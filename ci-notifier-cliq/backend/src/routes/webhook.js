const express = require('express');
const router = express.Router();
const db = require('../db');
const { normalizePayload } = require('../services/normalizer.service');
const { postCard } = require('../services/cliq.service');

// Store SSE clients (will be set by main server)
let sseClients = [];

function setSseClients(clients) {
    sseClients = clients;
}

/**
 * POST /ci/webhook
 * Receive CI failure/success webhooks
 */
router.post('/webhook', async (req, res) => {
    try {
        const payload = req.body;
        const source = req.query.source || 'auto';

        console.log('Received webhook:', JSON.stringify(payload, null, 2).substring(0, 500));

        // Normalize the payload
        const normalized = normalizePayload(payload, source);

        console.log('Normalized run:', normalized);

        // Store in database
        const runId = await db.insertRun(normalized);
        const run = await db.getRunById(runId);

        console.log(`Stored run #${runId} - ${run.repo} / ${run.workflow} - ${run.status}`);

        // Post to Cliq if it's a failure
        if (run.status === 'failure') {
            const cliqResult = await postCard({ ...run, id: runId });
            console.log('Cliq notification result:', cliqResult);
        }

        // Notify SSE clients
        if (sseClients.length > 0) {
            const eventData = JSON.stringify({ type: 'new-run', run: { ...run, id: runId } });
            sseClients.forEach(client => {
                client.write(`data: ${eventData}\n\n`);
            });
            console.log(`Notified ${sseClients.length} SSE clients`);
        }

        res.status(200).json({
            success: true,
            runId,
            message: 'Webhook processed successfully'
        });
    } catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

module.exports = router;
module.exports.setSseClients = setSseClients;
