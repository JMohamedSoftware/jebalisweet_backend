const userRepository = require('../repositories/userRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendResetEmail, sendVerificationEmail } = require('../services/emailService');
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

    try {
        // Security: Avoid Registration Spam (1 Account per IP)
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        if (process.env.NODE_ENV === 'production' && finalRole !== 'livreur') {
            const existingIP = await userRepository.findByRegistrationIP(ip);
            if (existingIP) {
                return res.status(403).json({ message: 'Un compte a déjà été créé depuis cette adresse IP. Contactez l\'assistance si c\'est une erreur.' });
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

        await userRepository.saveOTP(user._id, otp, expires);

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
        const user = await userRepository.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé.' });
        }

        if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
            return res.status(400).json({ message: 'Code invalide.' });
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

        await userRepository.updatePassword(userId, hashedPassword);

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
