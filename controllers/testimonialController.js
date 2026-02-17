const testimonialRepository = require('../repositories/TestimonialRepository');

exports.getAllTestimonials = async (req, res) => {
    try {
        const testimonials = await testimonialRepository.getAll(true);
        res.json(testimonials);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching testimonials' });
    }
};

exports.createTestimonial = async (req, res) => {
    try {
        const { name, role, content, rating, avatar } = req.body;

        // Robust XSS Sanitization: Encode HTML special characters
        const sanitize = (str) => {
            if (typeof str !== 'string') return str;
            return str
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;')
                .trim();
        };

        const sanitizedData = {
            name: sanitize(name),
            role: sanitize(role),
            content: sanitize(content),
            rating: Number(rating) || 5,
            avatar: avatar || '/assets/images/default-avatar.png',
            approved: false // Always force pending approval for new testimonials
        };

        const testimonial = await testimonialRepository.create(sanitizedData);
        res.status(201).json(testimonial);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating testimonial' });
    }
};

exports.deleteTestimonial = async (req, res) => {
    try {
        await testimonialRepository.delete(req.params.id);
        res.json({ message: 'Testimonial deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting testimonial' });
    }
};

exports.approveTestimonial = async (req, res) => {
    try {
        const testimonial = await testimonialRepository.approve(req.params.id);
        res.json(testimonial);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error approving testimonial' });
    }
};
