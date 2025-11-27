const crypto = require('crypto');

/**
 * Verify API key for dashboard endpoints
 */
function verifyApiKey(req, res, next) {
    const apiKey = req.headers['x-api-key'];
    const expectedKey = process.env.API_KEY;

    if (!expectedKey) {
        // If no API key is configured, allow access (for local dev)
        return next();
    }

    if (!apiKey || apiKey !== expectedKey) {
        return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
    }

    next();
}

/**
 * Verify webhook signature (optional)
 */
function verifySignature(req, res, next) {
    const secret = process.env.WEBHOOK_SECRET;

    if (!secret) {
        // If no secret is configured, skip verification
        return next();
    }

    const signature = req.headers['x-hub-signature-256'] || req.headers['x-signature'];

    if (!signature) {
        return res.status(401).json({ error: 'Missing signature header' });
    }

    const body = JSON.stringify(req.body);
    const expectedSignature = 'sha256=' + crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

    if (signature !== expectedSignature) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    next();
}

module.exports = {
    verifyApiKey,
    verifySignature
};
