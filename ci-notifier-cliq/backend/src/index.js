const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const webhookRouter = require('./routes/webhook');
const cliqRouter = require('./routes/cliq');
const apiRouter = require('./routes/api');
const eventsRouter = require('./routes/events');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        message: 'CI Notifier for Zoho Cliq',
        version: '1.0.0',
        endpoints: {
            webhook: 'POST /ci/webhook',
            cliqAction: 'POST /cliq/action',
            testCard: 'GET /cliq/test-card',
            runs: 'GET /api/runs',
            runDetail: 'GET /api/runs/:id',
            stats: 'GET /api/stats',
            events: 'GET /events (SSE)'
        }
    });
});

// Set SSE clients reference for webhook route
webhookRouter.setSseClients(eventsRouter.clients);

// Routes
app.use('/ci', webhookRouter);
app.use('/cliq', cliqRouter);
app.use('/api', apiRouter);
app.use('/events', eventsRouter);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║   CI Notifier for Zoho Cliq - Backend Server         ║
╚═══════════════════════════════════════════════════════╝

Server running on port ${PORT}
Environment: ${process.env.NODE_ENV || 'development'}

Available endpoints:
  - POST   /ci/webhook          Receive CI webhooks
  - POST   /cliq/action         Handle Cliq button actions
  - GET    /cliq/test-card      Send test card to Cliq
  - GET    /api/runs            List CI runs (paginated)
  - GET    /api/runs/:id        Get run details
  - GET    /api/stats           Get statistics
  - GET    /events              SSE for real-time updates

Configuration:
  - Database: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite (data/ci_runs.db)'}
  - Cliq Webhook: ${process.env.CLIQ_WEBHOOK_URL ? 'Configured ✓' : 'Not configured ✗'}
  - GitHub Token: ${process.env.GITHUB_TOKEN ? 'Configured ✓' : 'Not configured ✗'}
  - API Key: ${process.env.API_KEY ? 'Configured ✓' : 'Not configured ✗'}

Ready to receive webhooks! 🚀
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    process.exit(0);
});

module.exports = app;
