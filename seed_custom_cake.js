const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const Product = require('./models/Product');
const Category = require('./models/Category');

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URI1);

        const gateauCat = await Category.findOne({ name: 'Gâteaux' });
        if (!gateauCat) {
            console.error('Category Gâteaux not found. Run sync_categories_v2.js first.');
            process.exit(1);
        }

        const customCake = {
            name: 'Gâteau Personnalisé',
            description: 'Un gâteau unique créé par vous via notre configurateur.',
            price: 50, // Base price
            image: '/images/17189029461596829888opals_3200x1200.jpg',
            categoryId: gateauCat._id,
            categoryName: gateauCat.name,
            inStock: true,
            featured: false
        };

        await Product.findOneAndUpdate(
            { name: 'Gâteau Personnalisé' },
            customCake,
            { upsert: true }
        );

        console.log('Custom Cake Placeholder Seeded');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seed();
