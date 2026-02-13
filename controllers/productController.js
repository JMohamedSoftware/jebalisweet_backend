const productRepository = require('../repositories/ProductRepository');
const Category = require('../models/Category');

exports.getAllProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 0; // 0 means all



        const { category, brand, minPrice, maxPrice, inStock, sortBy, sortOrder } = req.query;

        // Handle multi-value brand filter if needed (express query parser handles ?brand=A&brand=B as array)

        const result = await productRepository.findAll({
            page,
            limit,
            category,
            brand,
            minPrice,
            maxPrice,
            inStock,
            sortBy,
            sortOrder
        });

        res.json({
            products: result.products,
            total: result.total,
            page,
            totalPages: limit > 0 ? Math.ceil(result.total / limit) : 1
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la récupération des produits.' });
    }
};

exports.getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await productRepository.findById(id);
        if (!product) {
            return res.status(404).json({ message: 'Produit non trouvé.' });
        }
        res.json(product);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

exports.createProduct = async (req, res) => {
    // Logique Admin pour créer un produit
    let { name, description, price, image, category_id, categoryName, brand, stockQuantity, isFeatured, inStock } = req.body;

    try {
        // Resolve category name if not provided but ID exists
        if (!categoryName && category_id) {
            const category = await Category.findById(category_id).catch(() => null);
            if (category) {
                categoryName = category.name;
            }
        }

        const result = await productRepository.create({
            name, description, price, image, category_id, categoryName, brand, stockQuantity,
            featured: isFeatured, inStock
        });
        res.status(201).json({ id: result.id, message: 'Produit créé.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur création produit.' });
    }
};

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    let { name, description, price, image, category_id, categoryName, brand, stockQuantity, isFeatured, inStock } = req.body;

    try {
        // Resolve category name if not provided but ID exists
        if (!categoryName && category_id) {
            const category = await Category.findById(category_id).catch(() => null);
            if (category) {
                categoryName = category.name;
            }
        }

        const updatedProduct = await productRepository.update(id, {
            name, description, price, image, category_id, categoryName, brand, stockQuantity,
            featured: isFeatured, inStock
        });

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Produit non trouvé.' });
        }
        res.json(updatedProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur mise à jour produit.' });
    }
};

exports.deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await productRepository.delete(id);
        res.json({ message: 'Produit supprimé.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur suppression produit.' });
    }
};

exports.getProductMetadata = async (req, res) => {
    try {
        const Product = require('../models/Product');
        const [brands, maxPriceProduct] = await Promise.all([
            Product.distinct('brand'),
            Product.findOne().sort({ price: -1 })
        ]);

        res.json({
            brands: brands.filter(b => b), // Remove null/empty
            maxPrice: maxPriceProduct ? Math.ceil(maxPriceProduct.price) : 100
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur metadata.' });
    }
};
