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

const bodyParser = require('body-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const helmet = require('helmet');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set security HTTP headers
app.use(helmet());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent HTTP parameter pollution
app.use(hpp());

// Import routes
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
const heroRoutes = require('./routes/heroRoutes');

// DB status check
app.get('/api/db-status', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const Product = require('./models/Product');
        const productCount = await Product.countDocuments();
        res.json({
            status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            productCount
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/promotions', promoRoutes);
app.use('/api/promo-codes', promoCodeRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/hero', heroRoutes);

// Error Handler
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err.stack);
    const status = err.statusCode || 500;
    
    // Hide stack trace in production
    const response = {
        success: false,
        message: err.message || 'Erreur interne du serveur'
    };

    if (process.env.NODE_ENV !== 'production') {
        response.error = err.stack;
    }

    res.status(status).json(response);
});

app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur le port ${PORT}.`);
});
