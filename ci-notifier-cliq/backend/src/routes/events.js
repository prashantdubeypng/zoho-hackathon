const express = require('express');
const router = express.Router();

// SSE clients tracking
const clients = [];

/**
 * GET /events
 * Server-Sent Events endpoint for real-time dashboard updates
 */
router.get('/events', (req, res) => {
    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Add this client to the list
    clients.push(res);

    console.log(`SSE client connected. Total clients: ${clients.length}`);

    // Send a welcome message
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to CI Notifier events' })}\n\n`);

    // Remove client on disconnect
    req.on('close', () => {
        const index = clients.indexOf(res);
        if (index !== -1) {
            clients.splice(index, 1);
        }
        console.log(`SSE client disconnected. Total clients: ${clients.length}`);
    });
});

/**
 * Send a message to all connected SSE clients
 */
function broadcast(eventType, data) {
    const payload = JSON.stringify({ type: eventType, ...data });
    clients.forEach(client => {
        client.write(`data: ${payload}\n\n`);
    });
}

// Export clients array so webhook route can access it
module.exports = router;
module.exports.clients = clients;
module.exports.broadcast = broadcast;
