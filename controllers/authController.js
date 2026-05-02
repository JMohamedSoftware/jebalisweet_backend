const userRepository = require('../repositories/UserRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendResetEmail, sendVerificationEmail } = require('../services/emailService');
const User = require('../models/User'); // Import User for device-level checks
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Veuillez fournir un email et un mot de passe.' });
    }

    if (!JWT_SECRET) {
        console.error("CRITICAL: JWT_SECRET environment variable is missing.");
        return res.status(500).json({ message: 'Erreur de configuration serveur' });
    }

    const emailLower = email.toLowerCase();

    try {
        const user = await userRepository.findByEmail(emailLower);

        if (!user) {
            return res.status(401).json({ message: 'Identifiants incorrects.' });
        }

        // Only compare hashed passwords. Remove plain-text fallback.
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Identifiants incorrects.' });
        }

        if (user.status === 'pending_verification') {
            return res.status(403).json({
                message: 'Vérification requise',
                status: 'pending_verification',
                userId: user.id || user._id,
                email: user.email
            });
        }

        if (user.role === 'livreur' && user.status === 'pending') {
            return res.status(403).json({ message: 'Votre compte est en attente de validation par l\'administrateur.' });
        }

        if (user.status === 'rejected') {
            return res.status(403).json({ message: 'Votre compte a été refusé. Contactez l\'administrateur.' });
        }

        const token = jwt.sign(
            { id: user.id || user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update Login History
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const newLogin = { ip, timestamp: new Date() };
        const updatedHistory = [newLogin, ...(user.loginHistory || [])].slice(0, 5);

        await userRepository.update(user.id || user._id, { loginHistory: updatedHistory });

        // Sanitize response
        const userObj = user.toObject ? user.toObject() : user;
        const { password: _, ...userInfo } = userObj;

        res.json({
            message: 'Connexion réussie',
            user: userInfo,
            token: token
        });
    } catch (error) {
        next(error);
    }
};

exports.register = async (req, res) => {
    let { firstName, lastName, email, password, phone, address, city, postalCode, role } = req.body;
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    // Security: Enforce Password Complexity (min 8 chars, at least one number or symbol)
    const passwordRegex = /^(?=.*[0-9!@#$%^&*])(?=.{8,})/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message: 'Le mot de passe doit contenir au moins 8 caractères et inclure au moins un chiffre ou un caractère spécial.'
        });
    }

    // Normalize email
    email = email.toLowerCase();
    const username = `${firstName} ${lastName}`;

    // Security: Never allow role escalation from request body
    const finalRole = (role === 'livreur') ? 'livreur' : 'client';

    // Security: Handle Bot Domains and Device Limits
    const blacklistedDomains = ['service.com', 'test2.com', 'gmqail.com', 'tempmail.com', 'fabaos.com'];
    const emailDomain = email.split('@')[1];
    
    if (blacklistedDomains.includes(emailDomain)) {
        return res.status(403).json({ message: 'Ce domaine d\'email est bloqué pour des raisons de sécurité.' });
    }

    try {
        // 1. IP and Machine Fingerprint capture
        const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const machineId = req.machineId;

        // 2. Strict Check: Max 3 accounts per device/machine in 24 hours
        // This is a database-level backup to the rate-limiter
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const registrationsToday = await User.countDocuments({
            machineId: machineId,
            createdAt: { $gte: twentyFourHoursAgo }
        });

        if (registrationsToday >= 3) {
            return res.status(429).json({ 
                message: 'Limite atteinte. Vous ne pouvez créer que 3 comptes par jour depuis cet appareil.' 
            });
        }

        // 3. Security: Prevent IP spam (1 account per IP if requested)
        if (process.env.NODE_ENV === 'production' && finalRole !== 'livreur') {
             // We can be more lenient or keep the existing single-IP check
             // For now, let's allow it up to 3 per IP too for consistency
             const ipLimitToday = await User.countDocuments({
                 registrationIP: ip,
                 createdAt: { $gte: twentyFourHoursAgo }
             });
             if (ipLimitToday >= 3) {
                 return res.status(429).json({ message: 'Limite d\'inscription par IP atteinte.' });
             }
        }

        // Vérifier si l'email existe déjà
        const existing = await userRepository.findByEmail(email);
        if (existing) {
            return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
        }

        console.log('DEBUG: Hashing password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('DEBUG: Generating OTP...');
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 15 * 60 * 1000);
        console.log('DEBUG: Creating user in DB...');
        const newUser = await userRepository.create({
            firstName,
            lastName,
            username,
            email,
            password: hashedPassword,
            phone: phone || null,
            address: address || null,
            city: city || null,
            postalCode: postalCode || null,
            role: finalRole,
            status: finalRole === 'livreur' ? 'pending' : 'pending_verification',
            registrationIP: ip,
            machineId: machineId,
            emailVerificationOTP: otp,
            emailVerificationExpires: expires
        });
        console.log('DEBUG: Sending verification email...');
        await sendVerificationEmail(newUser.email, newUser.firstName, otp);
        console.log('DEBUG: Registration complete.');
        res.status(201).json({
            message: 'Inscription réussie. Code de vérification envoyé.',
            status: 'pending_verification',
            userId: newUser.id || newUser._id,
            email: newUser.email
        });
    } catch (error) {
        next(error);
    }
};

exports.checkEmail = async (req, res, next) => {
    let { email } = req.body;
    email = email ? email.toLowerCase() : '';
    try {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'Aucun compte associé à cet email.' });
        }

        res.json({
            message: 'Compte trouvé',
            user: {
                id: user._id,
                email: user.email,
                // Only provide names if strictly needed by frontend, 
                // but keep them for now to avoid breaking UI 
                // while removing sensitive phone/role.
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.sendOTP = async (req, res, next) => {
    let { email } = req.body;
    email = email ? email.toLowerCase() : '';
    try {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'Aucun compte associé à cet email.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000);

        // Reset attempts when sending a new one
        await User.findByIdAndUpdate(user._id, {
            resetPasswordOTP: otp,
            resetPasswordExpires: expires,
            otpAttempts: 0
        });

        const emailSent = await sendResetEmail(user.email, user.firstName, otp);

        if (emailSent) {
            res.json({ message: 'Code envoyé avec succès par e-mail.' });
        } else {
            res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'e-mail de récupération.' });
        }
    } catch (error) {
        next(error);
    }
};

exports.verifyOTP = async (req, res, next) => {
    const { userId, otp } = req.body;
    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        // Security: Block if 5 attempts already reached
        if (user.otpAttempts >= 5) {
            return res.status(403).json({ message: 'Trop de tentatives échouées. Veuillez demander un nouveau code.' });
        }

        if (!user.resetPasswordOTP) {
             return res.status(400).json({ message: 'Aucun code actif. Veuillez en demander un nouveau.' });
        }

        if (user.resetPasswordOTP !== otp) {
            // Increment failure count
            const newAttempts = (user.otpAttempts || 0) + 1;
            const updateObj = { otpAttempts: newAttempts };
            
            // If failure reaches 5, clear the code entirely
            if (newAttempts >= 5) {
                updateObj.resetPasswordOTP = null;
                updateObj.resetPasswordExpires = null;
            }
            
            await User.findByIdAndUpdate(userId, updateObj);
            
            const remaining = 5 - newAttempts;
            return res.status(400).json({ 
                message: newAttempts >= 5 
                    ? 'Limite de tentatives atteinte. Votre code est invalidé. Veuillez en demander un nouveau.' 
                    : `Code incorrect. Il vous reste ${remaining} tentative(s).` 
            });
        }

        if (new Date() > new Date(user.resetPasswordExpires)) {
            return res.status(400).json({ message: 'Code expiré.' });
        }

        res.json({ message: 'Code valide.' });
    } catch (error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    const { userId, otp, newPassword } = req.body;
    try {
        const userWrapper = await userRepository.findById(userId);
        if (!userWrapper) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        if (!userWrapper.resetPasswordOTP || userWrapper.resetPasswordOTP !== otp) {
            return res.status(400).json({ message: 'Code invalide ou session expiree.' });
        }
        if (new Date() > new Date(userWrapper.resetPasswordExpires)) {
            return res.status(400).json({ message: 'Code expiré.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await User.findByIdAndUpdate(userId, {
            password: hashedPassword,
            resetPasswordOTP: null,
            resetPasswordExpires: null,
            otpAttempts: 0
        });

        res.json({ message: 'Mot de passe réinitialisé avec succès.' });
    } catch (error) {
        next(error);
    }
};

exports.verifyEmail = async (req, res, next) => {
    const { userId, otp } = req.body;
    try {
        const user = await userRepository.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'Email déjà vérifié.' });
        }

        if (user.emailVerificationOTP !== otp) {
            return res.status(400).json({ message: 'Code invalide.' });
        }

        if (new Date() > new Date(user.emailVerificationExpires)) {
            return res.status(400).json({ message: 'Code expiré. Veuillez générer un nouveau code.' });
        }

        await userRepository.verifyEmail(userId);

        res.json({ message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.' });
    } catch (error) {
        next(error);
    }
};

exports.resendVerificationOTP = async (req, res, next) => {
    const { userId } = req.body;
    try {
        const user = await userRepository.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        if (user.isEmailVerified) {
            return res.status(400).json({ message: 'Email déjà vérifié.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 15 * 60 * 1000);

        await userRepository.saveVerificationOTP(userId, otp, expires);
        await sendVerificationEmail(user.email, user.firstName, otp);

        res.json({ message: 'Nouveau code envoyé avec succès.' });
    } catch (error) {
        next(error);
    }
};
