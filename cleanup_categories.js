const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const Category = require('./models/Category');

async function run() {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGO_URI1);
        console.log('Connected to DB');

        const res = await Category.deleteMany({
            name: { $in: ['Pâtisserie fine', 'Événement', 'Evénement', 'pâtisserie', 'Pâtisserie', 'Pâtisseries'] }
        });

        console.log('Deleted categories count:', res.deletedCount);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
