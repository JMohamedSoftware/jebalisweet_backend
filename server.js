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

// Basic security headers
app.use(helmet());

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Origin: ${req.get('origin')}`);
    next();
});

// CORS configuration for Netlify deployment
app.use(cors({
    origin: function (origin, callback) {
        console.log('CORS Origin Request:', origin);
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);

        // Allowed origins
        const allowedOrigins = [
            'http://localhost:4028',
            'http://localhost:3000',
            'https://jebalisweet.vercel.app',
            /^(https?:\/\/)?(.*\.)?jebalisweet\.tn(:\d+)?$/, // Any jebalisweet.tn subdomain or port
            /\.netlify\.app$/,  // Any Netlify subdomain
            /\.ngrok\.io$/,     // ngrok URLs for testing
            /\.ngrok-free\.app$/,  // ngrok free tier URLs
            /\.ngrok-free\.dev$/,  // ngrok free tier URLs (dev TLD)
            /^http:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/,  // Any IP address (local network)
            /^http:\/\/localhost:\d+$/          // Any localhost port
        ];

        // Check if origin is allowed
        const isAllowed = allowedOrigins.some(pattern => {
            if (pattern instanceof RegExp) {
                return pattern.test(origin);
            }
            return pattern === origin;
        });

        if (isAllowed) {
            console.log('CORS Allowed:', origin);
            callback(null, true);
        } else {
            console.warn('CORS Blocked:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes de base
app.get('/', (req, res) => {
    res.json({ message: 'Bienvenue sur l\'API Backend de Jebali Sweet' });
});

// Database status check
app.get('/api/db-status', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const state = mongoose.connection.readyState;
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };

        let productCount = 0;
        if (state === 1) {
            const Product = require('./models/Product');
            productCount = await Product.countDocuments();
        }

        res.json({
            status: states[state],
            productCount: productCount,
            dbName: mongoose.connection.name
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const statsRoutes = require('./routes/statsRoutes');
const userRoutes = require('./routes/userRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const uploadRoutes = require('./routes/uploadRoutes'); // Import upload routes
const aiRoutes = require('./routes/aiRoutes'); // Import AI routes
const promotionRoutes = require('./routes/promotionRoutes');
const testimonialRoutes = require('./routes/testimonialRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes); // Use upload routes
app.use('/api/ai', aiRoutes); // Use AI routes
app.use('/api/promotions', promotionRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve static files

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`Serveur en cours d'exécution sur le port ${PORT}.`);
});
