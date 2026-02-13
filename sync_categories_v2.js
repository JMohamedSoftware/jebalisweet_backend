const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const Category = require('./models/Category');

const newCategories = [
    { name: 'Chocolats', image: '/images/chocolate-drip-cake-with-white-cake-garnished-with-berries.jpg' },
    { name: 'Salés', image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0' },
    { name: 'Gâteaux', image: '/images/17189029461596829888opals_3200x1200.jpg' }
];

async function sync() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URI1);
        console.log('Connected to DB');

        for (const cat of newCategories) {
            await Category.findOneAndUpdate(
                { name: cat.name },
                cat,
                { upsert: true, new: true }
            );
            console.log(`Synced: ${cat.name}`);
        }

        // Optional: Remove old ones if necessary, but maybe safer to keep them for existing products

        console.log('Finished syncing categories.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

sync();
