import React, { useEffect, useState } from 'react';
import { getStats } from '../services/api';

export default function Stats() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadStats();
    }, []);

    async function loadStats() {
        try {
            setLoading(true);
            const data = await getStats();
            setStats(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="loading">Loading stats...</div>;
    if (error) return <div className="error">Error loading stats: {error}</div>;
    if (!stats) return null;

    return (
        <div className="stats-grid">
            <div className="stat-card">
                <h3>Total Runs</h3>
                <div className="value">{stats.totalRuns || 0}</div>
            </div>

            <div className="stat-card failures">
                <h3>Failures (Last 7 Days)</h3>
                <div className="value">{stats.failuresLast7Days || 0}</div>
            </div>

            <div className="stat-card">
                <h3>Top Failing Workflow</h3>
                <div className="value" style={{ fontSize: '1.2rem' }}>
                    {stats.topFailingWorkflows && stats.topFailingWorkflows.length > 0
                        ? stats.topFailingWorkflows[0].workflow
                        : 'None'}
                </div>
                {stats.topFailingWorkflows && stats.topFailingWorkflows.length > 0 && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#7f8c8d' }}>
                        {stats.topFailingWorkflows[0].count} failures
                    </div>
                )}
            </div>
        </div>
    );
}
