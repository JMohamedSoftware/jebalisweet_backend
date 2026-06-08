const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login attempts per window
    message: { message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 500, // Increased from 100 to allow for bursts from shared IPs and parallel fetches
    message: { message: 'Trop de requêtes. Veuillez patienter.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const strictLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 100, // Increased from 20 to improve usability while still blocking brute-force
    message: { message: 'Action suspecte détectée. Veuillez patienter.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const testimonialLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // Limit each IP to 5 testimonials per hour
    message: { message: 'Trop de témoignages envoyés. Veuillez réessayer plus tard.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const registrationLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 2, // Limit each machine to 2 accounts per day
    keyGenerator: (req) => req.machineId || req.ip,
    message: { message: "Limite d'inscription atteinte. Vous pouvez créer au maximum 2 comptes par jour depuis cet appareil." },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    loginLimiter,
    apiLimiter,
    testimonialLimiter,
    strictLimiter,
    registrationLimiter
};
