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
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

// Use Helmet for basic security headers
app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for now to avoid breaking existing functionality if not tested
    crossOriginEmbedderPolicy: false,
    hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true
    }
}));

// Rate Limiting
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

// Request Logger (Limited in Production)
app.use((req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    }
    next();
});

// CORS configuration for Netlify/Vercel deployment
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'http://localhost:4028',
            'http://localhost:3000',
            'https://jebalisweet.vercel.app',
            /^(https?:\/\/)?(.*\.)?jebalisweet\.tn(:\d+)?$/,
            /\.netlify\.app$/,
            /\.ngrok\.io$/,
            /\.ngrok-free\.app$/,
            /\.ngrok-free\.dev$/,
            /^http:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

// Apply general limiter to all API routes
app.use('/api/', apiLimiter);

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
const promotionRoutes = require('./routes/promotionRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');

// Apply login limiter to auth routes
app.use('/api/auth', loginLimiter, authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/promotions', promotionRoutes);
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
