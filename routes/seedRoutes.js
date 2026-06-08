const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

router.get('/custom-cake', async (req, res) => {
    try {
        const gateauCat = await Category.findOne({ name: 'Gâteaux' });
        if (!gateauCat) {
            return res.status(404).json({ message: 'Category Gâteaux not found.' });
        }

        const customCake = {
            name: 'Gâteau Personnalisé',
            description: 'Un gâteau unique créé par vous via notre configurateur.',
            price: 50,
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

        res.json({ message: 'Custom Cake Placeholder Seeded Successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
