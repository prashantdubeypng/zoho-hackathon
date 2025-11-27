const express = require('express');
const router = express.Router();
const db = require('../db');
const { verifyApiKey } = require('../middleware/auth');
const { createIssue } = require('../services/github.service');
const { postCard } = require('../services/cliq.service');

/**
 * GET /api/runs
 * Get paginated list of CI runs with filters
 */
router.get('/runs', verifyApiKey, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            status,
            repo,
            search,
            startDate,
            endDate
        } = req.query;

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const options = {
            limit: parseInt(limit),
            offset,
            status,
            repo,
            search,
            startDate,
            endDate
        };

        const runs = await db.getRuns(options);
        const total = await db.getRunsCount(options);

        res.json({
            runs,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Error fetching runs:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * GET /api/runs/:id
 * Get a single run by ID
 */
router.get('/runs/:id', verifyApiKey, async (req, res) => {
    try {
        const { id } = req.params;
        const run = await db.getRunById(id);

        if (!run) {
            return res.status(404).json({ error: 'Run not found' });
        }

        res.json(run);
    } catch (error) {
        console.error('Error fetching run:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * GET /api/stats
 * Get aggregate statistics
 */
router.get('/stats', verifyApiKey, async (req, res) => {
    try {
        const stats = await db.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * POST /api/runs/:id/rerun
 * Trigger a re-run from the dashboard
 */
router.post('/runs/:id/rerun', verifyApiKey, async (req, res) => {
    try {
        const { id } = req.params;
        const run = await db.getRunById(id);

        if (!run) {
            return res.status(404).json({ error: 'Run not found' });
        }

        // Delegate to Cliq action handler
        const cliqRouter = require('./cliq');
        const actionReq = {
            body: {
                action: 'rerun',
                data: {
                    run_id: id,
                    repo: run.repo,
                    run_url: run.run_url
                }
            }
        };

        const actionRes = {
            json: (data) => res.json(data),
            status: (code) => ({ json: (data) => res.status(code).json(data) })
        };

        // Call the Cliq action handler
        return require('./cliq').stack[0].handle(actionReq, actionRes, () => { });
    } catch (error) {
        console.error('Error triggering rerun:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * POST /api/runs/:id/create-issue
 * Create a GitHub issue for a failed run
 */
router.post('/runs/:id/create-issue', verifyApiKey, async (req, res) => {
    try {
        const { id } = req.params;
        const run = await db.getRunById(id);

        if (!run) {
            return res.status(404).json({ error: 'Run not found' });
        }

        if (!process.env.GITHUB_TOKEN) {
            return res.status(400).json({
                error: 'GITHUB_TOKEN not configured'
            });
        }

        const title = `CI Failure: ${run.workflow} on ${run.branch}`;
        const body = `
## CI Failure Report

**Repository:** ${run.repo}
**Workflow:** ${run.workflow}
**Branch:** ${run.branch}
**Commit:** ${run.commit_sha}
**Status:** ${run.status}
**Run URL:** ${run.run_url}

### Logs
\`\`\`
${run.logs || 'No logs available'}
\`\`\`

**Created at:** ${run.created_at}
`;

        const result = await createIssue(run.repo, title, body);

        if (result.success) {
            res.json({
                success: true,
                issue_url: result.url,
                message: 'Issue created successfully'
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error creating issue:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * POST /api/runs/:id/post-to-cliq
 * Manually post a run to Cliq
 */
router.post('/runs/:id/post-to-cliq', verifyApiKey, async (req, res) => {
    try {
        const { id } = req.params;
        const run = await db.getRunById(id);

        if (!run) {
            return res.status(404).json({ error: 'Run not found' });
        }

        const result = await postCard({ ...run, id: parseInt(id) });

        res.json({
            success: result.success,
            message: 'Posted to Cliq',
            result
        });
    } catch (error) {
        console.error('Error posting to Cliq:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

module.exports = router;
