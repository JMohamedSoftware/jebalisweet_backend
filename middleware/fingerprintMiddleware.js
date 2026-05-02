const crypto = require('crypto');

/**
 * Middleware to generate a unique "Machine ID" based on request headers.
 * This helps identify unique devices even if the IP address changes.
 */
const fingerprintMiddleware = (req, res, next) => {
    // 1. Capture key device characteristics
    const userAgent = req.headers['user-agent'] || 'unknown';
    const acceptLanguage = req.headers['accept-language'] || 'unknown';
    
    // Use req.ip (works with 'trust proxy' already enabled in server.js)
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // 2. Create a combined string for hashing
    // We include IP to keep it specific, but the headers help catch same-device IP changes
    const fingerprintString = `${userAgent}|${acceptLanguage}`;
    
    // 3. Generate a SHA-256 hash
    const machineId = crypto
        .createHash('sha256')
        .update(fingerprintString)
        .digest('hex');

    // 4. Attach to the request object for use in controllers and other middleware
    req.machineId = machineId;
    req.userAgent = userAgent;

    next();
};

module.exports = fingerprintMiddleware;
