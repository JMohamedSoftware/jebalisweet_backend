const mongoose = require('mongoose');
const Product = require('../models/Product');

class ProductRepository {
    async findAll(options = {}) {
        const { page = 1, limit = 0, category, brand, minPrice, maxPrice, inStock, featured, sortBy, sortOrder, search } = options;
        console.log('ProductRepository.findAll options:', { sortBy, sortOrder, page, limit }); // DEBUG LOG
        const skip = (page - 1) * limit;

        // Helper to escape regex special characters to prevent ReDoS
        const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 100);

        const query = {};

        if (category && category !== 'Tous' && category !== 'Général' && category !== 'all' && category !== 'All') {
            const sanitizedCategory = escapeRegex(String(category));
            const regex = new RegExp(sanitizedCategory, 'i');
            query.$or = [
                { categoryName: regex }
            ];

            if (mongoose.Types.ObjectId.isValid(String(category))) {
                query.$or.push({ categoryId: String(category) });
            }
        }

        if (brand) {
            const brands = Array.isArray(brand) ? brand.map(b => String(b).substring(0, 50)) : [String(brand).substring(0, 50)];
            query.brand = { $in: brands };
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
            query.price = {};
            if (minPrice !== undefined) query.price.$gte = Number(minPrice);
            if (maxPrice !== undefined) query.price.$lte = Number(maxPrice);
        }

        if (inStock === 'true' || inStock === true) {
            query.stockQuantity = { $gt: 0 };
        }

        if (featured === 'true' || featured === true) {
            query.featured = true;
        }

        if (search) {
            query.name = { $regex: escapeRegex(String(search)), $options: 'i' };
        }

        let productQuery = Product.find(query);

        if (sortBy) {
            const order = sortOrder === 'desc' || sortOrder === -1 ? -1 : 1;
            const sortMap = {
                'price-asc': { price: 1 },
                'price-desc': { price: -1 },
                'newest': { createdAt: -1 },
                'bestsellers': { reviewCount: -1 },
                'relevance': { featured: -1, createdAt: -1 }
            };
            const sort = sortMap[sortBy] || { createdAt: -1 };
            console.log('ProductRepository.findAll apply sort:', sort); // DEBUG LOG
            productQuery = productQuery.sort(sort);
        } else {
            productQuery = productQuery.sort({ createdAt: -1 });
        }

        if (limit > 0) {
            productQuery = productQuery.skip(skip).limit(limit);
        }

        const [products, total] = await Promise.all([
            productQuery,
            Product.countDocuments(query)
        ]);

        const mappedProducts = products.map(p => {
            const obj = p.toObject();
            return {
                id: obj._id.toString(),
                ...obj,
                category_name: obj.categoryName, // Maintain compatibility
                stock_quantity: obj.stockQuantity,
                inStock: obj.stockQuantity > 0
            };
        });

        return { products: mappedProducts, total };
    }

    async findById(id) {
        try {
            const product = await Product.findById(id);
            if (!product) return null;
            const obj = product.toObject();
            return {
                id: obj._id.toString(),
                ...obj
            };
        } catch (e) {
            return null;
        }
    }

    async create(data) {
        const product = new Product(data);
        await product.save();
        return { id: product._id.toString() };
    }

    async update(id, data) {
        // Handle mapping from possible camelCase or snake_case inputs
        const updateData = { ...data };
        if (data.is_featured !== undefined) updateData.featured = data.is_featured;

        const product = await Product.findByIdAndUpdate(id, updateData, { new: true });
        if (!product) return null;
        const obj = product.toObject();
        return {
            id: obj._id.toString(),
            ...obj
        };
    }

    async delete(id) {
        return Product.findByIdAndDelete(id);
    }
}

module.exports = new ProductRepository();
