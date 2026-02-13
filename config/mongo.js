const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Ensure environment variables are loaded if this file is run independently
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectDB = async () => {
    const uri = process.env.MONGO_URI || process.env.MONGO_URI1;

    if (!uri) {
        console.error('CRITICAL: MONGO_URI environment variable is not defined.');
        process.exit(1);
    }

    const options = {
        serverSelectionTimeoutMS: 30000, // Timeout after 30s
        socketTimeoutMS: 45000,         // Close sockets after 45s of inactivity
    };

    let retryCount = 0;
    const maxRetries = 5;

    const connectWithRetry = async () => {
        try {
            console.log(`Connecting to MongoDB (Attempt ${retryCount + 1}/${maxRetries})...`);
            const conn = await mongoose.connect(uri, options);
            console.log(`MongoDB Connected: ${conn.connection.host}`);

            mongoose.connection.on('error', (err) => {
                console.error(`Mongoose runtime connection error: ${err}`);
            });

            mongoose.connection.on('disconnected', () => {
                console.warn('Mongoose disconnected. Attempting to reconnect...');
            });

        } catch (error) {
            console.error(`Attempt ${retryCount + 1} failed: ${error.message}`);
            retryCount++;

            if (retryCount < maxRetries) {
                console.log(`Retrying in 5 seconds...`);
                setTimeout(connectWithRetry, 5000);
            } else {
                console.error('Max retries reached. Could not connect to MongoDB.');
                console.error('TIP: Check if your IP is whitelisted in MongoDB Atlas or if the credentials in .env are correct.');
                process.exit(1);
            }
        }
    };

    await connectWithRetry();
};

module.exports = connectDB;
