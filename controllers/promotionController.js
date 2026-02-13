const promotionRepository = require('../repositories/PromotionRepository');

exports.getActivePromotion = async (req, res) => {
    try {
        const promotion = await promotionRepository.getActive();
        if (!promotion) {
            return res.status(404).json({ message: 'No active promotion found' });
        }
        res.json(promotion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching promotion' });
    }
};

exports.getLatestPromotion = async (req, res) => {
    try {
        const promotion = await promotionRepository.getLatest();
        res.json(promotion || {});
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching latest promotion' });
    }
};

exports.updatePromotion = async (req, res) => {
    try {
        const updatedPromotion = await promotionRepository.createOrUpdate(req.body);
        res.json(updatedPromotion);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating promotion' });
    }
};
