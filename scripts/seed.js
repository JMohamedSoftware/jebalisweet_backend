const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const connectDB = require('../config/mongo');

dotenv.config({ path: './backend/.env' });

const seedData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await connectDB();

        // Wait for connection to be fully established
        if (mongoose.connection.readyState !== 1) {
            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => reject(new Error('Connection timeout')), 10000);
                mongoose.connection.once('connected', () => {
                    clearTimeout(timeout);
                    resolve(true);
                });
            });
        }
        console.log('Connected.');

        // 1. Create Default Admin
        console.log('Creating Admin...');
        const adminEmail = 'admin@jebalisweet.com';
        const adminExists = await User.findOne({ email: adminEmail });

        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            await User.create({
                username: 'Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                phone: '0000000000'
            });
            console.log('Admin user created (admin@jebalisweet.com / admin123)');
        } else {
            console.log('Admin user already exists');
        }

        // 2. Create Default Delivery Driver
        console.log('Creating Driver...');
        const driverEmail = 'driver@jebalisweet.com';
        const driverExists = await User.findOne({ email: driverEmail });

        if (!driverExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('driver123', salt);

            await User.create({
                username: 'Livreur Test',
                email: driverEmail,
                password: hashedPassword,
                role: 'livreur',
                phone: '1111111111'
            });
            console.log('Delivery driver created (driver@jebalisweet.com / driver123)');
        } else {
            console.log('Delivery driver already exists');
        }

        // 2. Create Basic Categories
        console.log('Creating Categories...');
        const categories = [
            { name: 'Pâtisseries', image: '/images/patisseries.jpg' },
            { name: 'Chocolats', image: '/images/chocolats.jpg' },
            { name: 'Événements', image: '/images/events.jpg' }
        ];

        for (const cat of categories) {
            const exists = await Category.findOne({ name: cat.name });
            if (!exists) {
                await Category.create(cat);
                console.log(`Category '${cat.name}' created`);
            }
        }

        // 3. Create Basic Products
        console.log('Creating Products...');
        const patisserie = await Category.findOne({ name: 'Pâtisseries' });
        const chocolat = await Category.findOne({ name: 'Chocolats' });

        const products = [
            {
                name: 'Baklawa Royale',
                description: 'Une sélection premium de nos meilleures baklawas.',
                price: 25.99,
                categoryId: patisserie._id,
                categoryName: 'Pâtisseries',
                image: '/images/baklawa.jpg',
                stockQuantity: 50,
                inStock: true,
                brand: 'Jebali Sweet'
            },
            {
                name: 'Coffret Chocolat Noir',
                description: 'Chocolat noir intensité 70% aux éclats de pistache.',
                price: 18.50,
                categoryId: chocolat._id,
                categoryName: 'Chocolats',
                image: '/images/chocolat_noir.jpg',
                stockQuantity: 50,
                inStock: true,
                brand: 'Jebali Sweet'
            },
            {
                name: 'Macarons Assortis',
                description: 'Boîte de 12 macarons artisanaux.',
                price: 22.00,
                categoryId: patisserie._id,
                categoryName: 'Pâtisseries',
                image: '/images/macarons.jpg',
                stockQuantity: 50,
                inStock: true,
                brand: 'Jebali Sweet'
            }
        ];

        for (const prod of products) {
            const exists = await Product.findOne({ name: prod.name });
            if (!exists) {
                await Product.create(prod);
                console.log(`Product '${prod.name}' created`);
            } else {
                exists.stockQuantity = 50;
                exists.inStock = true;
                await exists.save();
                console.log(`Product '${prod.name}' updated`);
            }
        }

        console.log('Database seeding completed successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Error seeding database:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        process.exit(1);
    }
};

seedData().catch(err => {
    console.error('Fatal error in seed script:', err);
    process.exit(1);
});
