const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuration - CHANGE THESE TO MATCH YOUR ACTUAL VALUES IF NOT IN ENV
const CLOUDINARY_CLOUD_NAME = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dgiwx2p7n').trim();
const CLOUDINARY_UPLOAD_PRESET = (process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'JSweet').trim();
const MONGO_URI = (process.env.MONGO_URI || 'mongodb+srv://jbelimohamedsoftware_db_user:123@cluster0.7uy1smh.mongodb.net/jebalisweet?appName=Cluster0').trim();

// Import Models
const Product = require('./models/Product');
const Category = require('./models/Category');
const Promotion = require('./models/Promotion');

async function uploadToCloudinary(filePath) {
    const fileName = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const blob = new Blob([fileBuffer]);

    const formData = new FormData();
    formData.append('file', blob, fileName);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
            method: 'POST',
            body: formData,
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Cloudinary Error for ${fileName}: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
}

function getLocalPath(imageUrl) {
    if (!imageUrl) return null;

    // Check if it's already a Cloudinary URL
    if (imageUrl.includes('res.cloudinary.com')) return null;

    // Is it a local URL like http://localhost:5000/uploads/file.jpg
    if (imageUrl.includes('/uploads/')) {
        const parts = imageUrl.split('/uploads/');
        const fileName = parts[parts.length - 1];
        const localPath = path.join(__dirname, 'uploads', fileName);
        if (fs.existsSync(localPath)) return localPath;
    }

    // Is it a relative path like /uploads/file.jpg or uploads/file.jpg
    const relativePath = imageUrl.startsWith('/') ? imageUrl.substring(1) : imageUrl;
    const absolutePath = path.join(__dirname, relativePath);
    if (fs.existsSync(absolutePath)) return absolutePath;

    // Maybe just the filename?
    const justFileNamePath = path.join(__dirname, 'uploads', imageUrl);
    if (fs.existsSync(justFileNamePath)) return justFileNamePath;

    return null;
}

async function migrate() {
    try {
        console.log('--- Starting Cloudinary Migration ---');
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Migrate Products
        console.log('\nScanning Products...');
        const products = await Product.find({});
        for (const product of products) {
            const localPath = getLocalPath(product.image);
            if (localPath) {
                console.log(`Uploading product image for: ${product.name} (${path.basename(localPath)})`);
                try {
                    const cloudinaryUrl = await uploadToCloudinary(localPath);
                    product.image = cloudinaryUrl;
                    await product.save();
                    console.log(`✅ Success: ${cloudinaryUrl}`);
                } catch (err) {
                    console.error(`❌ Failed: ${err.message}`);
                }
            }
        }

        // 2. Migrate Categories
        console.log('\nScanning Categories...');
        const categories = await Category.find({});
        for (const category of categories) {
            const localPath = getLocalPath(category.image);
            if (localPath) {
                console.log(`Uploading category image for: ${category.name} (${path.basename(localPath)})`);
                try {
                    const cloudinaryUrl = await uploadToCloudinary(localPath);
                    category.image = cloudinaryUrl;
                    await category.save();
                    console.log(`✅ Success: ${cloudinaryUrl}`);
                } catch (err) {
                    console.error(`❌ Failed: ${err.message}`);
                }
            }
        }

        // 3. Migrate Promotions
        console.log('\nScanning Promotions...');
        const promotions = await Promotion.find({});
        for (const promo of promotions) {
            const localPath = getLocalPath(promo.backgroundImage);
            if (localPath) {
                console.log(`Uploading promotion image for: ${promo.title} (${path.basename(localPath)})`);
                try {
                    const cloudinaryUrl = await uploadToCloudinary(localPath);
                    promo.backgroundImage = cloudinaryUrl;
                    await promo.save();
                    console.log(`✅ Success: ${cloudinaryUrl}`);
                } catch (err) {
                    console.error(`❌ Failed: ${err.message}`);
                }
            }
        }

        console.log('\n--- Migration Finished ---');
        process.exit(0);
    } catch (error) {
        console.error('Migration Error:', error);
        process.exit(1);
    }
}

migrate();
