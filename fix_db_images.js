const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });
// Explicitly load local .env if needed, though usually backend .env is enough.
// We just need the MONGO_URI.

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://Jebali:Jebali123@cluster0.7uy1smh.mongodb.net/jebalisweet?retryWrites=true&w=majority&appName=Cluster0');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const Product = require('./models/Product'); // Ensure path is correct relative to backend root

const fixImages = async () => {
    await connectDB();

    try {
        const products = await Product.find({ image: { $regex: 'localhost:5000' } });
        console.log(`Found ${products.length} products with localhost images.`);

        for (const product of products) {
            const oldUrl = product.image;
            const newUrl = oldUrl.replace('http://localhost:5000', 'https://nakisha-unidyllic-shona.ngrok-free.dev');

            product.image = newUrl;
            await product.save();
            console.log(`Updated: ${product.name}`);
        }

        console.log('--- MIGRATION COMPLETE ---');
        process.exit(0);
    } catch (error) {
        console.error('Error migrating images:', error);
        process.exit(1);
    }
};

fixImages();
