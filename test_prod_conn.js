const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
    const uri = process.env.MONGO_URI;
    console.log('URI:', uri ? 'Exists' : 'MISSING');

    const options = {
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
    };

    try {
        console.log('Connecting...');
        await mongoose.connect(uri, options);
        console.log('Connected!');
        const count = await mongoose.connection.db.collection('products').countDocuments();
        console.log('Product count:', count);
        await mongoose.disconnect();
        console.log('Disconnected.');
    } catch (err) {
        console.error('Error:', err.message);
    }
};

connectDB();
