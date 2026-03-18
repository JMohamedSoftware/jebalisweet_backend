const promoCodeRepository = require('../repositories/PromoCodeRepository');

exports.getAllPromoCodes = async (req, res) => {
    try {
        const codes = await promoCodeRepository.getAll();
        res.json(codes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createPromoCode = async (req, res) => {
    try {
        const newCode = await promoCodeRepository.create(req.body);
        res.status(201).json(newCode);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Ce code promo existe déjà.' });
        }
        res.status(500).json({ message: error.message });
    }
};

exports.updatePromoCode = async (req, res) => {
    try {
        const updated = await promoCodeRepository.update(req.params.id, req.body);
        if (!updated) return res.status(404).json({ message: 'Code promo non trouvé.' });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.deletePromoCode = async (req, res) => {
    try {
        const deleted = await promoCodeRepository.delete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Code promo non trouvé.' });
        res.json({ message: 'Code promo supprimé avec succès.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.validatePromoCode = async (req, res) => {
    try {
        const { code } = req.params;
        const result = await promoCodeRepository.validateCode(code);
        if (!result.valid) {
            return res.status(400).json({ message: result.message });
        }
        res.json(result.promo);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
