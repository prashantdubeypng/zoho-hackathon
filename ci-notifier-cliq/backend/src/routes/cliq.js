const express = require('express');
const router = express.Router();
const db = require('../db');
const { rerunWorkflow, createIssue } = require('../services/github.service');
const { postMessage, postCard } = require('../services/cliq.service');

/**
 * POST /cliq/action
 * Handle Cliq button actions
 */
router.post('/action', async (req, res) => {
    try {
        const { action, data } = req.body;

        console.log('Received Cliq action:', action, data);

        if (!action) {
            return res.status(400).json({ error: 'Missing action parameter' });
        }

        switch (action.toLowerCase()) {
            case 'rerun': {
                const { run_id, repo, run_url } = data || {};

                if (!run_id) {
                    return res.status(400).json({ error: 'Missing run_id' });
                }

                const run = await db.getRunById(run_id);
                if (!run) {
                    return res.status(404).json({ error: 'Run not found' });
                }

                // Extract run ID from GitHub URL if available
                // Example: https://github.com/owner/repo/actions/runs/123456
                let githubRunId = null;
                if (run.run_url) {
                    const match = run.run_url.match(/\/runs\/(\d+)/);
                    if (match) {
                        githubRunId = match[1];
                    }
                }

                // If GitHub token is configured, try to rerun
                if (process.env.GITHUB_TOKEN && githubRunId) {
                    const result = await rerunWorkflow(run.repo, githubRunId);

                    if (result.success) {
                        await postMessage(`✅ Workflow re-run triggered for ${run.repo} #${githubRunId}`);
                        return res.json({
                            success: true,
                            message: 'Workflow re-run triggered',
                            github: result
                        });
                    } else {
                        return res.json({
                            success: false,
                            message: 'Failed to trigger re-run via GitHub API',
                            error: result.error
                        });
                    }
                } else {
                    // Simulated response
                    return res.json({
                        success: true,
                        message: 'Re-run action received (simulated - configure GITHUB_TOKEN for actual re-run)',
                        run_url: run.run_url
                    });
                }
            }

            case 'assign': {
                const { run_id } = data || {};

                if (!run_id) {
                    return res.status(400).json({ error: 'Missing run_id' });
                }

                const run = await db.getRunById(run_id);
                if (!run) {
                    return res.status(404).json({ error: 'Run not found' });
                }

                // Placeholder for assign functionality
                // In a real implementation, this could open a dialog to select assignee
                return res.json({
                    success: true,
                    message: 'Assign action received (not implemented - add your logic here)',
                    run_id
                });
            }

            case 'open-run': {
                const { run_url } = data || {};

                if (!run_url) {
                    return res.status(400).json({ error: 'Missing run_url' });
                }

                return res.json({
                    success: true,
                    url: run_url,
                    message: 'Opening run URL'
                });
            }

            default:
                return res.status(400).json({ error: `Unknown action: ${action}` });
        }
    } catch (error) {
        console.error('Error handling Cliq action:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

/**
 * GET /cliq/test-card
 * Send a test card to Cliq (for /test-ci-card command)
 */
router.get('/test-card', async (req, res) => {
    try {
        const testRun = {
            id: 0,
            repo: 'test-org/test-repo',
            workflow: 'Test Workflow',
            branch: 'main',
            commit_sha: 'abc1234567890',
            status: 'failure',
            run_url: 'https://github.com/test-org/test-repo/actions/runs/123',
            logs: 'This is a test CI failure notification.\nError: Tests failed on line 42.',
            created_at: new Date().toISOString()
        };

        const result = await postCard(testRun);

        res.json({
            success: result.success,
            message: 'Test card sent to Cliq',
            result
        });
    } catch (error) {
        console.error('Error sending test card:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

module.exports = router;
