const axios = require('axios');
const { buildCliqCard } = require('../templates/cliq-card');

/**
 * Post message card to Cliq incoming webhook
 */
async function postCard(run) {
    const webhookUrl = process.env.CLIQ_WEBHOOK_URL;

    if (!webhookUrl) {
        console.warn('CLIQ_WEBHOOK_URL not configured, skipping Cliq notification');
        return { success: false, reason: 'CLIQ_WEBHOOK_URL not set' };
    }

    const actionUrl = process.env.BACKEND_URL || 'http://localhost:3000';
    const card = buildCliqCard(run, actionUrl);

    try {
        const response = await axios.post(webhookUrl, card, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Posted to Cliq:', response.status);
        return { success: true, status: response.status };
    } catch (error) {
        console.error('Error posting to Cliq:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Post a custom message to Cliq
 */
async function postMessage(message) {
    const webhookUrl = process.env.CLIQ_WEBHOOK_URL;

    if (!webhookUrl) {
        console.warn('CLIQ_WEBHOOK_URL not configured');
        return { success: false, reason: 'CLIQ_WEBHOOK_URL not set' };
    }

    try {
        const response = await axios.post(webhookUrl, { text: message }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        return { success: true, status: response.status };
    } catch (error) {
        console.error('Error posting to Cliq:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = {
    postCard,
    postMessage
};
