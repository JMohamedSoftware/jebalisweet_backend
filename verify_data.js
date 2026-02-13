const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables correctly
dotenv.config({ path: path.join(__dirname, '.env') });

const Product = require('./models/Product');
const Category = require('./models/Category');
const User = require('./models/User');

const verifyData = async () => {
    try {
        console.log('Connecting to database...');
        console.log(`URI: ${process.env.MONGO_URI}`);

        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`Connected to: ${conn.connection.host}`);
        console.log(`Database Name: ${conn.connection.name}`);

        const productCount = await Product.countDocuments();
        const categoryCount = await Category.countDocuments();
        const userCount = await User.countDocuments();

        console.log('--- Data Verification Results ---');
        console.log(`Products: ${productCount}`);
        console.log(`Categories: ${categoryCount}`);
        console.log(`Users: ${userCount}`);

        if (productCount === 0 || categoryCount === 0) {
            console.log('\nWARNING: Database appears empty. You may need to seed data.');
        } else {
            console.log('\nSUCCESS: Data found.');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error verifying data:', error);
    }
};

verifyData();
