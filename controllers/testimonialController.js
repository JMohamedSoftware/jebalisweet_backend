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
        const testimonial = await testimonialRepository.create(req.body);
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
