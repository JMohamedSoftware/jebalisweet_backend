const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const Hero = require('./models/Hero');
const connectDB = require('./config/mongo');

const seedHero = async () => {
    try {
        await connectDB();
        
        // Remove existing heroes (optional, but for this specific request we want to override)
        await Hero.deleteMany({});
        
        const hero = new Hero({
            title: 'Excellence Orientale',
            subtitle: 'L\'art de la pâtisserie tunisienne traditionnelle, sublimée par la Maison Jebali.',
            image: '/photo 7lou/behi_ana_3andi_202604061828.png',
            ctaText: 'Déguster',
            targetCategory: 'Pâtisserie Orientale',
            isActive: true
        });
        
        await hero.save();
        console.log('✅ Hero seeded successfully with user image!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding hero:', err.message);
        process.exit(1);
    }
};

seedHero();
