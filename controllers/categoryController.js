const Category = require('../models/Category');
const Product = require('../models/Product');

exports.getAllCategories = async (req, res) => {
    try {
        // Fetch all categories
        const categories = await Category.find();

        // Aggregate product counts by categoryName (more reliable linkage currently)
        const productCounts = await Product.aggregate([
            {
                $group: {
                    _id: "$categoryName",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Create a map for quick lookup
        const countMap = {};
        productCounts.forEach(item => {
            if (item._id) {
                countMap[item._id.toLowerCase()] = item.count;
            }
        });

        const formatted = categories.map(c => ({
            id: c._id.toString(),
            name: c.name,
            image: c.image,
            productCount: countMap[c.name.toLowerCase()] || 0
        }));

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur lors de la récupération des catégories.' });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, image } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Le nom de la catégorie est requis.' });
        }
        const category = new Category({ name, image });
        await category.save();
        res.status(201).json({
            id: category._id,
            name: category.name,
            image: category.image
        });
    } catch (error) {
        console.error("Error creating category:", error);
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Cette catégorie existe déjà.' });
        }
        res.status(500).json({ message: 'Erreur lors de la création de la catégorie.' });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        await Category.findByIdAndDelete(id);
        res.json({ message: 'Catégorie supprimée avec succès.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la suppression de la catégorie.' });
    }
};
