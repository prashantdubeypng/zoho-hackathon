/**
 * Normalize CI webhook payloads from various sources to a standard format
 */

/**
 * Normalize GitHub Actions webhook payload
 */
function normalizeGitHubActions(payload) {
    const { repository, workflow_run, workflow_job } = payload;

    // Handle workflow_run event
    if (workflow_run) {
        return {
            repo: repository.full_name,
            workflow: workflow_run.name,
            branch: workflow_run.head_branch,
            commit_sha: workflow_run.head_sha,
            status: workflow_run.conclusion || workflow_run.status, // conclusion: success/failure, status: in_progress/queued
            run_url: workflow_run.html_url,
            logs: `Workflow: ${workflow_run.name}\nRun #${workflow_run.run_number}\nEvent: ${workflow_run.event}\nActor: ${workflow_run.actor?.login || 'N/A'}`,
            raw_payload: payload
        };
    }

    // Handle workflow_job event
    if (workflow_job) {
        return {
            repo: repository.full_name,
            workflow: workflow_job.workflow_name || workflow_job.name,
            branch: workflow_job.head_branch || 'unknown',
            commit_sha: workflow_job.head_sha || 'unknown',
            status: workflow_job.conclusion || workflow_job.status,
            run_url: workflow_job.html_url,
            logs: `Job: ${workflow_job.name}\nStatus: ${workflow_job.status}\nConclusion: ${workflow_job.conclusion || 'N/A'}\nRunner: ${workflow_job.runner_name || 'N/A'}`,
            raw_payload: payload
        };
    }

    // Fallback for unknown GitHub payload
    return normalizeGeneric(payload);
}

/**
 * Normalize generic CI payload
 */
function normalizeGeneric(payload) {
    return {
        repo: payload.repo || payload.repository || 'unknown',
        workflow: payload.workflow || payload.pipeline || payload.job || 'unknown',
        branch: payload.branch || payload.ref || 'unknown',
        commit_sha: payload.commit || payload.sha || payload.commit_sha || 'unknown',
        status: payload.status || payload.state || 'unknown',
        run_url: payload.url || payload.run_url || payload.build_url || '#',
        logs: payload.logs || payload.message || JSON.stringify(payload, null, 2),
        raw_payload: payload
    };
}

/**
 * Main normalization function
 */
function normalizePayload(body, source = 'auto') {
    // Auto-detect source
    if (source === 'auto') {
        if (body.workflow_run || body.workflow_job) {
            source = 'github';
        } else {
            source = 'generic';
        }
    }

    switch (source.toLowerCase()) {
        case 'github':
        case 'github-actions':
            return normalizeGitHubActions(body);
        case 'generic':
        default:
            return normalizeGeneric(body);
    }
}

module.exports = {
    normalizePayload
};
