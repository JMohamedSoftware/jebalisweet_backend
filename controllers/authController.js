const userRepository = require('../repositories/UserRepository');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendResetEmail } = require('../services/emailService');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret_temporaire_pour_dev';

exports.login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Veuillez fournir un email et un mot de passe.' });
    }

    // Normalize email
    const emailLower = email.toLowerCase();

    try {
        const user = await userRepository.findByEmail(emailLower);

        if (!user) {
            return res.status(401).json({ message: 'Identifiants incorrects.' });
        }

        // Comparaison du mot de passe haché
        const isMatch = await bcrypt.compare(password, user.password);

        // Fallback temporaire pour le dev
        const isPlainTextMatch = user.password === password;

        if (!isMatch && !isPlainTextMatch) {
            return res.status(401).json({ message: 'Identifiants incorrects.' });
        }

        if (user.role === 'livreur' && user.status === 'pending') {
            return res.status(403).json({ message: 'Votre compte est en attente de validation par l\'administrateur.' });
        }

        if (user.status === 'rejected') {
            return res.status(403).json({ message: 'Votre compte a été refusé. Contactez l\'administrateur.' });
        }

        const token = jwt.sign(
            { id: user.id || user._id, email: user.email, role: user.role }, // Handle id or _id
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Retirer le mot de passe de la réponse
        const { password: _, ...userInfo } = user;

        res.json({
            message: 'Connexion réussie',
            user: userInfo,
            token: token
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

exports.register = async (req, res) => {
    let { firstName, lastName, email, password, phone, address, city, postalCode, role } = req.body;
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ message: 'Tous les champs sont requis.' });
    }

    // Normalize email
    email = email.toLowerCase();
    const username = `${firstName} ${lastName}`;

    try {
        // Vérifier si l'email existe déjà
        const existing = await userRepository.findByEmail(email);
        if (existing) {
            return res.status(409).json({ message: 'Cet email est déjà utilisé.' });
        }

        // Hachage du mot de passe
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Créer l'utilisateur
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
            role: role || 'client',
            status: role === 'livreur' ? 'pending' : 'active'
        });

        // Auto-login: generate token
        const token = jwt.sign(
            { id: newUser.id || newUser._id, email: newUser.email, role: newUser.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remove password from user object
        const { password: _, ...userInfo } = newUser.toObject ? newUser.toObject() : newUser;

        res.status(201).json({
            message: 'Inscription réussie',
            user: userInfo,
            token: token,
            userId: newUser.id || newUser._id
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

exports.checkEmail = async (req, res) => {
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
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

exports.sendOTP = async (req, res) => {
    let { email } = req.body;
    email = email ? email.toLowerCase() : '';
    try {
        const user = await userRepository.findByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'Aucun compte associé à cet email.' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60 * 1000);

        await userRepository.update(user._id, {
            resetPasswordOTP: otp,
            resetPasswordExpires: expires
        });

        // Send email using the email service
        const emailSent = await sendResetEmail(user.email, user.firstName, otp);

        if (emailSent) {
            // Email sent successfully
            res.json({
                message: 'Code envoyé avec succès par e-mail.'
            });
        } else {
            // Email failed
            res.status(500).json({
                message: 'Erreur lors de l\'envoi de l\'e-mail de récupération. Veuillez réessayer plus tard.'
            });
        }
    } catch (error) {
        console.error('❌ Erreur serveur dans sendOTP:', error);
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

exports.verifyOTP = async (req, res) => {
    const { userId, otp } = req.body;
    try {
        const user = await userRepository.findById(userId);

        if (!user.resetPasswordOTP || user.resetPasswordOTP !== otp) {
            return res.status(400).json({ message: 'Code invalide.' });
        }

        if (new Date() > new Date(user.resetPasswordExpires)) {
            return res.status(400).json({ message: 'Code expiré.' });
        }

        res.json({ message: 'Code valide.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};

exports.resetPassword = async (req, res) => {
    const { userId, otp, newPassword } = req.body;
    try {
        const userWrapper = await userRepository.findById(userId);

        if (!userWrapper.resetPasswordOTP || userWrapper.resetPasswordOTP !== otp) {
            return res.status(400).json({ message: 'Code invalide ou session expiree.' });
        }
        if (new Date() > new Date(userWrapper.resetPasswordExpires)) {
            return res.status(400).json({ message: 'Code expiré.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await userRepository.update(userId, {
            password: hashedPassword,
            resetPasswordOTP: null,
            resetPasswordExpires: null
        });

        res.json({ message: 'Mot de passe réinitialisé avec succès.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur.', error: error.message });
    }
};
