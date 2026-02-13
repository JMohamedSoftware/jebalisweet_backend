const userRepository = require('../repositories/UserRepository');

exports.getProfile = async (req, res) => {
    try {
        const { id } = req.params;

        // Security check: User can only access their own profile OR must be an admin
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

        const { password, ...safeUser } = userInfo;
        res.json(safeUser);
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ message: 'Erreur lors de la récupération du profil', error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { id } = req.params;

        // Security check: User can only update their own profile OR must be an admin
        if (req.user.role !== 'admin' && req.user.id !== id) {
            return res.status(403).json({ message: 'Accès refusé. Vous ne pouvez modifier que votre propre profil.' });
        }

        // Exclude sensitive fields from being updated via this endpoint by non-admins
        const { password, role: newRole, status: newStatus, ...updateData } = req.body;

        // Only admins can change roles or status
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

        const { password: _, ...safeUser } = userInfo;
        res.json(safeUser);
    } catch (error) {
        console.error("Update Profile Error:", error);
        res.status(500).json({ message: 'Erreur lors de la mise à jour du profil', error: error.message });
    }
};

exports.getPreferences = async (req, res) => {
    const { id } = req.params;
    try {
        // Security check
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
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.updatePreferences = async (req, res) => {
    const { id } = req.params;
    const preferences = req.body;

    try {
        // Security check
        if (req.user.role !== 'admin' && req.user.id !== id) {
            return res.status(403).json({ message: 'Accès refusé.' });
        }

        await userRepository.update(id, { preferences });
        res.json({ message: 'Préférences mises à jour' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur mise à jour' });
    }
};

exports.getDrivers = async (req, res) => {
    try {
        // Access restricted by route middleware (roleMiddleware(['admin']))
        const drivers = await userRepository.findByRole('livreur');
        res.json(drivers.map(d => ({
            id: d._id.toString(),
            username: d.username,
            email: d.email,
            phone: d.phone
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur récupération livreurs' });
    }
};

exports.getPendingDrivers = async (req, res) => {
    try {
        // Access restricted by route middleware
        const drivers = await userRepository.findPendingDrivers();
        res.json(drivers.map(d => ({
            id: d._id.toString(),
            username: d.username,
            email: d.email,
            phone: d.phone,
            createdAt: d.createdAt
        })));
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur récupération livreurs en attente' });
    }
};

exports.updateDriverStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Status invalide.' });
    }

    try {
        // Access restricted by route middleware
        await userRepository.updateStatus(id, status);
        res.json({ message: `Livreur ${status === 'active' ? 'approuvé' : 'rejeté'}.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur mise à jour status' });
    }
};
