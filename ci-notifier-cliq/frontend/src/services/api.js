/**
 * API service for backend communication
 */

const API_BASE = '/api';
const API_KEY = import.meta.env.VITE_API_KEY || '';

async function fetchAPI(url, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (API_KEY) {
        headers['X-API-Key'] = API_KEY;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
}

export async function getRuns(params = {}) {
    const query = new URLSearchParams();

    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.status) query.append('status', params.status);
    if (params.repo) query.append('repo', params.repo);
    if (params.search) query.append('search', params.search);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);

    const queryString = query.toString();
    return fetchAPI(`${API_BASE}/runs${queryString ? '?' + queryString : ''}`);
}

export async function getRunById(id) {
    return fetchAPI(`${API_BASE}/runs/${id}`);
}

export async function getStats() {
    return fetchAPI(`${API_BASE}/stats`);
}

export async function rerunWorkflow(runId) {
    return fetchAPI(`${API_BASE}/runs/${runId}/rerun`, {
        method: 'POST'
    });
}

export async function createIssue(runId) {
    return fetchAPI(`${API_BASE}/runs/${runId}/create-issue`, {
        method: 'POST'
    });
}

export async function postToCliq(runId) {
    return fetchAPI(`${API_BASE}/runs/${runId}/post-to-cliq`, {
        method: 'POST'
    });
}

/**
 * Connect to SSE for real-time updates
 */
export function connectToEvents(onMessage) {
    const eventSource = new EventSource('/events');

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        onMessage(data);
    };

    eventSource.onerror = (error) => {
        console.error('SSE error:', error);
    };

    return eventSource;
}
