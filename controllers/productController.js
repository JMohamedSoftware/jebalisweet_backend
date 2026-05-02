const productRepository = require('../repositories/ProductRepository');
const Category = require('../models/Category');

exports.getAllProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0;
        const { category, brand, minPrice, maxPrice, inStock, sortBy, sortOrder, search } = req.query;

        const result = await productRepository.findAll({
            page, limit, category, brand, minPrice, maxPrice, inStock, sortBy, sortOrder, search
        });

        res.json({
            products: result.products,
            total: result.total,
            page,
            totalPages: limit > 0 ? Math.ceil(result.total / limit) : 1
        });
    } catch (error) {
        next(error);
    }
};

exports.getProductById = async (req, res, next) => {
    const { id } = req.params;
    try {
        const product = await productRepository.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Produit non trouvé.' });
        }
        res.json(product);
    } catch (error) {
        next(error);
    }
};

exports.createProduct = async (req, res, next) => {
    let { 
        name, description, price, image, category_id, categoryName, brand, stockQuantity, 
        isFeatured, inStock, images, sku, approxPieces, onOrderOnly, leadTime, 
        conservation, ingredients, priceUnit, variants
    } = req.body;
    try {
        if (!categoryName && category_id) {
            const category = await Category.findById(category_id).catch(() => null);
            if (category) categoryName = category.name;
        }

        const result = await productRepository.create({
            name, description, price, image, category_id, categoryName, brand, stockQuantity,
            featured: isFeatured, inStock, priceUnit, images, sku, approxPieces, 
            onOrderOnly, leadTime, conservation, ingredients, variants
        });
        res.status(201).json({ id: result.id, message: 'Produit créé.' });
    } catch (error) {
        next(error);
    }
};

exports.updateProduct = async (req, res, next) => {
    const { id } = req.params;
    let { 
        name, description, price, image, category_id, categoryName, brand, stockQuantity, 
        isFeatured, inStock, images, sku, approxPieces, onOrderOnly, leadTime, 
        conservation, ingredients, priceUnit, variants
    } = req.body;
    try {
        if (!categoryName && category_id) {
            const category = await Category.findById(category_id).catch(() => null);
            if (category) categoryName = category.name;
        }

        const updatedProduct = await productRepository.update(id, {
            name, description, price, image, category_id, categoryName, brand, stockQuantity,
            featured: isFeatured, inStock, priceUnit, images, sku, approxPieces, 
            onOrderOnly, leadTime, conservation, ingredients, variants
        });

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Produit non trouvé.' });
        }
        res.json(updatedProduct);
    } catch (error) {
        next(error);
    }
};

exports.deleteProduct = async (req, res, next) => {
    const { id } = req.params;
    try {
        await productRepository.delete(id);
        res.json({ message: 'Produit supprimé.' });
    } catch (error) {
        next(error);
    }
};

exports.getProductMetadata = async (req, res, next) => {
    try {
        const Product = require('../models/Product');
        const [brands, maxPriceProduct] = await Promise.all([
            Product.distinct('brand'),
            Product.findOne().sort({ price: -1 })
        ]);

        res.json({
            brands: brands.filter(b => b),
            maxPrice: maxPriceProduct ? Math.ceil(maxPriceProduct.price) : 100
        });
    } catch (error) {
        next(error);
    }
};

exports.getRelatedProducts = async (req, res, next) => {
    const { id } = req.params;
    try {
        const product = await productRepository.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Produit non trouvé.' });
        }

        const related = await productRepository.findAll({
            category: product.categoryName,
            limit: 4,
            inStock: true
        });

        // Filter out the current product
        const filteredRelated = related.products.filter(p => p.id !== id);
        res.json(filteredRelated);
    } catch (error) {
        next(error);
    }
};
