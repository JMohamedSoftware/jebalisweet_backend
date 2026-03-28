const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');

exports.getProfile = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (req.user.role !== 'admin' && req.user.id !== id) {
            return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez consulter que votre propre profil.' });
        }

        const user = await userRepository.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        let userInfo = user;
        if (user.toObject) {
            userInfo = user.toObject();
        } else if (user._doc) {
            userInfo = user._doc;
        }

        const { password, resetPasswordOTP, resetPasswordExpires, ...safeUser } = userInfo;
        res.json(safeUser);
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (req.user.role !== 'admin' && req.user.id !== id) {
            return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez modifier que votre propre profil.' });
        }

        const { password, role: newRole, status: newStatus, ...updateData } = req.body;

        if (req.user.role === 'admin') {
            if (newRole) updateData.role = newRole;
            if (newStatus) updateData.status = newStatus;
        }

        const updatedUser = await userRepository.update(id, updateData);
        if (!updatedUser) {
            return res.status(404).json({ message: 'Utilisateur non trouvé ou mise à jour échouée' });
        }

        let userInfo = updatedUser;
        if (updatedUser.toObject) {
            userInfo = updatedUser.toObject();
        } else if (updatedUser._doc) {
            userInfo = updatedUser._doc;
        }

        const { password: _, resetPasswordOTP, resetPasswordExpires, ...safeUser } = userInfo;
        res.json(safeUser);
    } catch (error) {
        next(error);
    }
};

exports.getPreferences = async (req, res, next) => {
    const { id } = req.params;
    try {
        if (req.user.role !== 'admin' && req.user.id !== id) {
            return res.status(403).json({ message: 'Accès refusé.' });
        }

        const user = await userRepository.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const prefs = user.preferences || {
            language: 'fr',
            notifications: {
                email: true,
                sms: false,
                orderUpdates: true,
                promotions: true,
                newsletter: false
            }
        };

        res.json(prefs);
    } catch (error) {
        next(error);
    }
};

exports.updatePreferences = async (req, res, next) => {
    const { id } = req.params;
    const preferences = req.body;

    try {
        if (req.user.role !== 'admin' && req.user.id !== id) {
            return res.status(403).json({ message: 'Accès refusé.' });
        }

        await userRepository.update(id, { preferences });
        res.json({ message: 'Préférences mises à jour' });
    } catch (error) {
        next(error);
    }
};

exports.getDrivers = async (req, res, next) => {
    try {
        const drivers = await userRepository.findByRole('livreur');
        res.json(drivers.map(d => ({
            id: d._id.toString(),
            username: d.username,
            email: d.email,
            phone: d.phone
        })));
    } catch (error) {
        next(error);
    }
};

exports.getPendingDrivers = async (req, res, next) => {
    try {
        const drivers = await userRepository.findPendingDrivers();
        res.json(drivers.map(d => ({
            id: d._id.toString(),
            username: d.username,
            email: d.email,
            phone: d.phone,
            createdAt: d.createdAt
        })));
    } catch (error) {
        next(error);
    }
};

exports.updateDriverStatus = async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Status invalide.' });
    }

    try {
        await userRepository.updateStatus(id, status);
        res.json({ message: `Livreur ${status === 'active' ? 'approuvé' : 'rejeté'}.` });
    } catch (error) {
        next(error);
    }
};

exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await userRepository.findAll();
        res.json(users);
    } catch (error) {
        next(error);
    }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deleted = await userRepository.delete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }
        res.json({ message: 'Utilisateur supprimé avec succès' });
    } catch (error) {
        next(error);
    }
};

exports.verifyAdminPassword = async (req, res, next) => {
    try {
        const { password } = req.body;
        const correctPass = process.env.ADMIN_USER_PASS;

        // Security: Ensure environment variable is set and not empty
        // If ADMIN_USER_PASS is missing, we must NOT allow access.
        if (!correctPass || correctPass.trim() === '') {
            console.error('CRITICAL: ADMIN_USER_PASS is not configured in environment variables.');
            return res.status(500).json({ message: 'Erreur de configuration serveur.' });
        }

        if (password && password === correctPass) {
            return res.json({ success: true });
        } else {
            return res.status(401).json({ message: 'Mot de passe incorrect' });
        }
    } catch (error) {
        next(error);
    }
};

exports.impersonateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await userRepository.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const JWT_SECRET = process.env.JWT_SECRET;
        if (!JWT_SECRET) {
            return res.status(500).json({ message: 'Erreur de configuration serveur' });
        }

        const token = jwt.sign(
            { id: user.id || user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        const userObj = user.toObject ? user.toObject() : user;
        const { password: _, readablePassword: __, ...userInfo } = userObj;

        res.json({
            message: 'Mode impersonation activé',
            user: userInfo,
            token: token
        });
    } catch (error) {
        next(error);
    }
};
