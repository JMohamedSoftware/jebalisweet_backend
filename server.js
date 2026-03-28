const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables immediately, specifying the path to backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const cors = require('cors');
const connectDB = require('./config/mongo');
const { verifyConnection } = require('./services/emailService');
const PORT = process.env.PORT || 5000;

connectDB();

// Run SMTP connection check and diagnostics on startup
(async () => {
    const success = await verifyConnection();
    if (!success && process.env.NODE_ENV === 'production') {
        console.log('🔄 SMTP verification failed. Running deep diagnostics...');
        try {
            require('./scripts/test-smtp'); // This runs runDiagnostics()
        } catch (e) {
            console.error('Failed to run diagnostics script:', e.message);
        }
    }
})();

const app = express();
// Enable trust proxy for Render (to get correct client IP)
app.enable('trust proxy');

const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const { apiLimiter, testimonialLimiter, strictLimiter } = require('./middleware/rateLimiters');
const timeout = require('./middleware/timeoutMiddleware');

// Use Helmet for basic security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://va.vercel-scripts.com"], // Allow Vercel Analytics
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
            connectSrc: ["'self'", "https://jebalisweet-backend.onrender.com", "https://api.cloudinary.com", "https://res.cloudinary.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            frameAncestors: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin" },
    crossOriginResourcePolicy: { policy: "same-origin" },
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    },
    xssFilter: false // Modern CSP handles XSS, disable legacy filter (equivalent to X-XSS-Protection: 0)
}));

// Apply global timeout (30 seconds)
app.use(timeout(30000));

// Request Logger (Enhanced for Production Troubleshooting)
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (process.env.NODE_ENV === 'production' && (res.statusCode >= 400 || duration > 1000)) {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms - IP: ${req.ip}`);
        } else if (process.env.NODE_ENV !== 'production') {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
        }
    });
    next();
});

// CORS configuration for Netlify/Vercel deployment
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:4028',
            'http://localhost:3000',
            /^(https?:\/\/)?(.*\.)?jebalisweet\.tn(:\d+)?$/,
            /^http:\/\/localhost:\d+$/
        ];

        const isAllowed = allowedOrigins.some(pattern => {
            if (pattern instanceof RegExp) return pattern.test(origin);
            return pattern === origin;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

// Limit Request Payloads (Prevent large payload attacks)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());
// Data Sanitization against XSS
app.use(xss());
// Prevent HTTP Parameter Pollution
app.use(hpp());

// Apply general limiter to ALL routes
app.use(apiLimiter);

// Routes de base
app.get('/', (req, res) => {
    res.json({ message: 'Bienvenue sur l\'API Backend de Jebali Sweet' });
});

// Database status check - Restricted to Development
app.get('/api/db-status', (req, res, next) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ message: 'Accès interdit en production.' });
    }
    next();
}, async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const state = mongoose.connection.readyState;
        const states = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };

        let productCount = 0;
        if (state === 1) {
            const Product = require('./models/Product');
            productCount = await Product.countDocuments();
        }

        res.json({
            status: states[state],
            productCount: productCount
        });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const statsRoutes = require('./routes/statsRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');
const promoRoutes = require('./routes/promotionRoutes');
const promoCodeRoutes = require('./routes/promoCodeRoutes');

// Apply auth routes without global loginLimiter to allow granular rate limiting
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', strictLimiter, statsRoutes);
app.use('/api/users', strictLimiter, userRoutes);
app.use('/api/upload', strictLimiter, uploadRoutes);
app.use('/api/promotions', promoRoutes);
app.use('/api/promo-codes', strictLimiter, promoCodeRoutes);
app.use('/api/testimonials', testimonialLimiter, testimonialRoutes);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ message: 'Ressource non trouvée' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack);
    const status = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production'
        ? 'Une erreur interne est survenue'
        : err.message;

    res.status(status).json({
        success: false,
        message: message,
        ...(process.env.NODE_ENV !== 'production' && { error: err.stack })
    });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur le port ${PORT}.`);
});
