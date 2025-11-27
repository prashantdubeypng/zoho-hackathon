const axios = require('axios');

/**
 * GitHub API service
 */

const GITHUB_API_BASE = 'https://api.github.com';

function getHeaders() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        throw new Error('GITHUB_TOKEN not configured');
    }

    return {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
    };
}

/**
 * Re-run a failed workflow
 * @param {string} repo - Repository in format "owner/repo"
 * @param {number} runId - Workflow run ID
 */
async function rerunWorkflow(repo, runId) {
    try {
        const url = `${GITHUB_API_BASE}/repos/${repo}/actions/runs/${runId}/rerun`;
        const response = await axios.post(url, {}, { headers: getHeaders() });

        return { success: true, status: response.status };
    } catch (error) {
        console.error('Error re-running workflow:', error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
}

/**
 * Re-run failed jobs in a workflow
 */
async function rerunFailedJobs(repo, runId) {
    try {
        const url = `${GITHUB_API_BASE}/repos/${repo}/actions/runs/${runId}/rerun-failed-jobs`;
        const response = await axios.post(url, {}, { headers: getHeaders() });

        return { success: true, status: response.status };
    } catch (error) {
        console.error('Error re-running failed jobs:', error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
}

/**
 * Create a GitHub issue for a failed run
 */
async function createIssue(repo, title, body) {
    try {
        const url = `${GITHUB_API_BASE}/repos/${repo}/issues`;
        const response = await axios.post(url, {
            title,
            body,
            labels: ['ci-failure']
        }, { headers: getHeaders() });

        return {
            success: true,
            issue: response.data,
            url: response.data.html_url
        };
    } catch (error) {
        console.error('Error creating issue:', error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
}

/**
 * Get workflow run details
 */
async function getWorkflowRun(repo, runId) {
    try {
        const url = `${GITHUB_API_BASE}/repos/${repo}/actions/runs/${runId}`;
        const response = await axios.get(url, { headers: getHeaders() });

        return { success: true, run: response.data };
    } catch (error) {
        console.error('Error fetching workflow run:', error.message);
        return {
            success: false,
            error: error.response?.data?.message || error.message
        };
    }
}

module.exports = {
    rerunWorkflow,
    rerunFailedJobs,
    createIssue,
    getWorkflowRun
};
