const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jebali_sweet';

async function wipePasswords() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        console.log('Wiping readablePassword field from all users...');
        const result = await User.updateMany({}, { $unset: { readablePassword: "" } });

        console.log(`Success! Updated ${result.modifiedCount} users.`);
        process.exit(0);
    } catch (error) {
        console.error('Error wiping passwords:', error);
        process.exit(1);
    }
}

wipePasswords();
