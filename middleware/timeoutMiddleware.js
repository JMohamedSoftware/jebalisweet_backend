/**
 * Middleware to handle request timeouts.
 * If a request takes longer than the specified time (in ms), it will be aborted.
 */
const timeout = (ms) => {
    return (req, res, next) => {
        res.setTimeout(ms, () => {
            if (!res.headersSent) {
                res.status(408).json({
                    success: false,
                    message: 'Request timeout. The server took too long to respond.'
                });
            }
        });
        next();
    };
};

module.exports = timeout;
