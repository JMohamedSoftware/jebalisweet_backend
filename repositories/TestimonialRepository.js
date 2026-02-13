const Testimonial = require('../models/Testimonial');

class TestimonialRepository {
    async getAll(approvedOnly = true) {
        const query = approvedOnly ? { approved: true } : {};
        return await Testimonial.find(query).sort({ createdAt: -1 });
    }

    async getById(id) {
        return await Testimonial.findById(id);
    }

    async create(data) {
        const testimonial = new Testimonial(data);
        return await testimonial.save();
    }

    async update(id, data) {
        return await Testimonial.findByIdAndUpdate(id, data, { new: true });
    }

    async delete(id) {
        return await Testimonial.findByIdAndDelete(id);
    }

    async approve(id) {
        return await Testimonial.findByIdAndUpdate(id, { approved: true }, { new: true });
    }
}

module.exports = new TestimonialRepository();
