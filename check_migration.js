const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Promotion = require('./models/Promotion');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://jbelimohamedsoftware_db_user:123@cluster0.7uy1smh.mongodb.net/jebalisweet?appName=Cluster0';

async function check() {
    try {
        await mongoose.connect(MONGO_URI);

        const products = await Product.find({});
        const pCloud = products.filter(p => p.image && p.image.includes('cloudinary')).length;
        const pLocal = products.filter(p => p.image && !p.image.includes('cloudinary')).length;

        const categories = await Category.find({});
        const cCloud = categories.filter(c => c.image && c.image.includes('cloudinary')).length;
        const cLocal = categories.filter(c => c.image && !c.image.includes('cloudinary')).length;

        const promotions = await Promotion.find({});
        const rCloud = promotions.filter(r => r.backgroundImage && r.backgroundImage.includes('cloudinary')).length;
        const rLocal = promotions.filter(r => r.backgroundImage && !r.backgroundImage.includes('cloudinary')).length;

        console.log('--- Migration Status ---');
        console.log(`Products:   ${pCloud} on Cloudinary, ${pLocal} Local`);
        console.log(`Categories: ${cCloud} on Cloudinary, ${cLocal} Local`);
        console.log(`Promotions: ${rCloud} on Cloudinary, ${rLocal} Local`);

        if (pLocal > 0) {
            console.log('\nTop 5 Local Product URLs:');
            products.filter(p => p.image && !p.image.includes('cloudinary')).slice(0, 5).forEach(p => console.log(` - ${p.name}: ${p.image}`));
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

check();
