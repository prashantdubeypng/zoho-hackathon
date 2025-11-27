import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRunById, rerunWorkflow, createIssue, postToCliq } from '../services/api';

export default function RunDetail() {
    const { id } = useParams();
    const [run, setRun] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionResult, setActionResult] = useState(null);

    useEffect(() => {
        loadRun();
    }, [id]);

    async function loadRun() {
        try {
            setLoading(true);
            const data = await getRunById(id);
            setRun(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleRerun() {
        try {
            setActionResult({ type: 'loading', message: 'Triggering re-run...' });
            const result = await rerunWorkflow(id);
            setActionResult({
                type: 'success',
                message: result.message || 'Re-run triggered successfully'
            });
        } catch (err) {
            setActionResult({ type: 'error', message: err.message });
        }
    }

    async function handleCreateIssue() {
        try {
            setActionResult({ type: 'loading', message: 'Creating GitHub issue...' });
            const result = await createIssue(id);
            setActionResult({
                type: 'success',
                message: `Issue created: ${result.issue_url}`,
                link: result.issue_url
            });
        } catch (err) {
            setActionResult({ type: 'error', message: err.message });
        }
    }

    async function handlePostToCliq() {
        try {
            setActionResult({ type: 'loading', message: 'Posting to Cliq...' });
            const result = await postToCliq(id);
            setActionResult({
                type: 'success',
                message: result.message || 'Posted to Cliq successfully'
            });
        } catch (err) {
            setActionResult({ type: 'error', message: err.message });
        }
    }

    if (loading) return <div className="loading">Loading run details...</div>;
    if (error) return <div className="error">Error loading run: {error}</div>;
    if (!run) return <div className="error">Run not found</div>;

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusBadge = (status) => {
        const className = status === 'failure' ? 'failure' : status === 'success' ? 'success' : 'unknown';
        return <span className={`status-badge ${className}`}>{status}</span>;
    };

    return (
        <div className="container">
            <Link to="/dashboard" className="back-button">← Back to Dashboard</Link>

            <div className="run-detail">
                <h2>Run #{run.id}: {run.workflow}</h2>

                <div className="metadata">
                    <div className="metadata-item">
                        <label>Repository</label>
                        <value>{run.repo}</value>
                    </div>
                    <div className="metadata-item">
                        <label>Branch</label>
                        <value>{run.branch}</value>
                    </div>
                    <div className="metadata-item">
                        <label>Commit</label>
                        <value><code>{run.commit_sha}</code></value>
                    </div>
                    <div className="metadata-item">
                        <label>Status</label>
                        <value>{getStatusBadge(run.status)}</value>
                    </div>
                    <div className="metadata-item">
                        <label>Created At</label>
                        <value>{formatDate(run.created_at)}</value>
                    </div>
                    <div className="metadata-item">
                        <label>Updated At</label>
                        <value>{formatDate(run.updated_at)}</value>
                    </div>
                    <div className="metadata-item">
                        <label>Run URL</label>
                        <value>
                            <a href={run.run_url} target="_blank" rel="noopener noreferrer">
                                View on GitHub →
                            </a>
                        </value>
                    </div>
                </div>

                <div className="logs">
                    <h3>Logs</h3>
                    <pre>{run.logs || 'No logs available'}</pre>
                </div>

                <div className="actions">
                    <button className="primary" onClick={handleRerun}>
                        🔄 Re-run Workflow
                    </button>
                    <button className="secondary" onClick={handleCreateIssue}>
                        📝 Create GitHub Issue
                    </button>
                    <button className="secondary" onClick={handlePostToCliq}>
                        📤 Post to Cliq
                    </button>
                </div>

                {actionResult && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        borderRadius: '4px',
                        background: actionResult.type === 'error' ? '#f8d7da' :
                            actionResult.type === 'success' ? '#d4edda' : '#e2e3e5',
                        color: actionResult.type === 'error' ? '#721c24' :
                            actionResult.type === 'success' ? '#155724' : '#383d41'
                    }}>
                        {actionResult.message}
                        {actionResult.link && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <a href={actionResult.link} target="_blank" rel="noopener noreferrer">
                                    Open Issue →
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
