const Hero = require('../models/Hero');

exports.getHero = async (req, res) => {
    try {
        let hero = await Hero.findOne({ isActive: true }).sort({ updatedAt: -1 });
        
        // Return default if none exists
        if (!hero) {
            hero = {
                title: 'Excellence Pâtisserie',
                subtitle: 'Découvrez nos créations artisanales.',
                image: '/images/17189029461596829888opals_3200x1200.jpg',
                ctaText: 'Déguster',
                targetCategory: 'Pâtisserie Orientale'
            };
        }
        res.json(hero);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateHero = async (req, res) => {
    try {
        const { title, subtitle, image, ctaText, targetCategory } = req.body;
        
        let hero = await Hero.findOne();
        
        if (hero) {
            hero.title = title || hero.title;
            hero.subtitle = subtitle || hero.subtitle;
            hero.image = image || hero.image;
            hero.ctaText = ctaText || hero.ctaText;
            hero.targetCategory = targetCategory || hero.targetCategory;
            hero.updatedAt = Date.now();
            await hero.save();
        } else {
            hero = await Hero.create({
                title,
                subtitle,
                image,
                ctaText,
                targetCategory
            });
        }
        
        res.json(hero);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
