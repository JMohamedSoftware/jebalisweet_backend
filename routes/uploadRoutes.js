const express = require('express');
const router = express.Router();

/**
 * @deprecated Local uploads are disabled. Use direct Cloudinary upload from the frontend.
 */
router.post('/', (req, res) => {
    res.status(410).json({
        message: 'Local uploads are disabled. Please upload directly to Cloudinary from the frontend.'
    });
});

module.exports = router;
