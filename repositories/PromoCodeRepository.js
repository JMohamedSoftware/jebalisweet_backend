const PromoCode = require('../models/PromoCode');

class PromoCodeRepository {
    async getAll() {
        return await PromoCode.find().sort({ createdAt: -1 });
    }

    async getByCode(code) {
        return await PromoCode.findOne({ code: code.toUpperCase() });
    }

    async create(data) {
        return await PromoCode.create(data);
    }

    async update(id, data) {
        return await PromoCode.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id) {
        return await PromoCode.findByIdAndDelete(id);
    }

    async validateCode(code) {
        const promo = await this.getByCode(code);
        if (!promo) return { valid: false, message: 'Code promo invalide.' };
        if (!promo.isActive) return { valid: false, message: 'Ce code promo n\'est plus actif.' };
        
        if (promo.expiryDate && new Date() > promo.expiryDate) {
            return { valid: false, message: 'Ce code promo a expiré.' };
        }

        if (promo.usageLimit !== null && promo.usageCount >= promo.usageLimit) {
            return { valid: false, message: 'Ce code promo a atteint sa limite d\'utilisation.' };
        }

        return { valid: true, promo };
    }

    async incrementUsage(id) {
        return await PromoCode.findByIdAndUpdate(id, { $inc: { usageCount: 1 } });
    }
}

module.exports = new PromoCodeRepository();
