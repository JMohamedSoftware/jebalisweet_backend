const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');

const uri = "mongodb+srv://jbelimohamedsoftware_db_user:med28%2B-A46F999%3D%29%3DK2855@cluster0.7uy1smh.mongodb.net/jebalisweet?appName=Cluster0";

async function seed() {
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB.");

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

        console.log('Custom Cake Placeholder Seeded Successfully!');
        process.exit(0);
    } catch (err) {
        console.error("Error:", err.message);
        process.exit(1);
    }
}

seed();
