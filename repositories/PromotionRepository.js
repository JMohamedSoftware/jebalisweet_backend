const Promotion = require('../models/Promotion');

class PromotionRepository {
    async getActive() {
        return await Promotion.findOne({ active: true });
    }

    async getLatest() {
        return await Promotion.findOne().sort({ updatedAt: -1 });
    }

    async createOrUpdate(data) {
        // We only support one active promotion for now
        let promotion = await Promotion.findOne();
        if (promotion) {
            Object.assign(promotion, data);
            promotion.updatedAt = Date.now();
            return await promotion.save();
        } else {
            return await Promotion.create(data);
        }
    }
}

module.exports = new PromotionRepository();
