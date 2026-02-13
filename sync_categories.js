const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const Product = require('./models/Product');
const Category = require('./models/Category');

const syncCategories = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const categories = await Category.find();
        const catMap = {};
        categories.forEach(c => {
            catMap[c._id.toString()] = c.name;
        });

        console.log('Category Map:', catMap);

        const products = await Product.find();
        let updatedCount = 0;

        for (const product of products) {
            const raw = product.toObject();
            let catId = raw.categoryId || raw.category;
            let needsUpdate = false;

            // If catId is an ObjectId, use the map to get the name
            if (catId && mongoose.Types.ObjectId.isValid(catId.toString())) {
                const catName = catMap[catId.toString()];
                if (catName && product.categoryName !== catName) {
                    product.categoryName = catName;
                    needsUpdate = true;
                }

                // Also ensure categoryId is set if only category (legacy) was present
                if (!product.categoryId) {
                    product.categoryId = catId;
                    needsUpdate = true;
                }
            } else if (typeof catId === 'string' && !mongoose.Types.ObjectId.isValid(catId)) {
                // If catId is already a name string (legacy legacy), sync it to categoryName
                if (product.categoryName !== catId) {
                    product.categoryName = catId;
                    needsUpdate = true;
                }
            }

            if (needsUpdate) {
                await product.save();
                updatedCount++;
            }
        }

        console.log(`Updated ${updatedCount} products.`);
        process.exit(0);
    } catch (error) {
        console.error('Error syncing categories:', error);
        process.exit(1);
    }
};

syncCategories();
