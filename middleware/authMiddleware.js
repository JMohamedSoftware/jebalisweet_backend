const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = (req, res, next) => {
    // Récupérer le token du header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <TOKEN>"

    if (!token) {
        return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_temporaire_pour_dev');
        req.user = decoded; // Attacher les infos de l'utilisateur à la requête
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Token invalide ou expiré.' });
    }
};

module.exports = authMiddleware;
