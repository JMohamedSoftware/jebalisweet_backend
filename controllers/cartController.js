const cartRepository = require('../repositories/CartRepository');

exports.getCart = async (req, res) => {
    const userId = req.user.id || req.user._id;

    try {
        const cartItems = await cartRepository.getCart(userId);

        // Formatage pour matcher le frontend
        const formattedItems = cartItems.map(item => ({
            id: item.id,
            productId: item.productId,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            stockQuantity: item.stockQuantity || 0,
            availability: (item.stockQuantity || 0) > 0 ? 'in_stock' : 'out_of_stock',
            maxQuantity: item.stockQuantity || 0,
            comment: item.comment,
            customImage: item.customImage,
            customOptions: item.customOptions
        }));

        res.json({ items: formattedItems });
    } catch (error) {
        console.error('getCart error:', error);
        res.status(500).json({ message: 'Erreur serveur.' });
    }
};

exports.addToCart = async (req, res) => {
    const { productId, quantity, customOptions, comment, customImage, isAbsolute, isSet } = req.body;
    const userId = req.user.id || req.user._id;

    try {
        await cartRepository.updateItem(userId, productId, quantity, customOptions, comment, customImage, isAbsolute || isSet);
        res.json({ message: 'Panier mis à jour' });
    } catch (error) {
        console.error('addToCart error:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

exports.removeFromCart = async (req, res) => {
    const { productId, customOptions, customImage } = req.body;
    const userId = req.user.id || req.user._id;

    try {
        await cartRepository.removeItem(userId, productId, customOptions, customImage);
        res.json({ message: 'Article supprimé' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
