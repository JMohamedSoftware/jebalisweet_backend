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
    max: 100, // Limit each IP to 100 requests per minute
    message: { message: 'Trop de requêtes. Veuillez patienter.' },
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

module.exports = {
    loginLimiter,
    apiLimiter,
    testimonialLimiter
};
