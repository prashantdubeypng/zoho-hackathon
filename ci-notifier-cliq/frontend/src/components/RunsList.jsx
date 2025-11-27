import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RunsList({ runs, pagination, onPageChange }) {
    const navigate = useNavigate();

    if (!runs || runs.length === 0) {
        return (
            <div className="runs-table">
                <div style={{ padding: '3rem', textAlign: 'center', color: '#7f8c8d' }}>
                    No runs found
                </div>
            </div>
        );
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    function getStatusBadge(status) {
        const className = status === 'failure' ? 'failure' : status === 'success' ? 'success' : 'unknown';
        return <span className={`status-badge ${className}`}>{status}</span>;
    }

    return (
        <>
            <div className="runs-table">
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Repository</th>
                            <th>Workflow</th>
                            <th>Branch</th>
                            <th>Commit</th>
                            <th>Status</th>
                            <th>Link</th>
                        </tr>
                    </thead>
                    <tbody>
                        {runs.map((run) => (
                            <tr key={run.id} onClick={() => navigate(`/dashboard/runs/${run.id}`)}>
                                <td>{formatDate(run.created_at)}</td>
                                <td>{run.repo}</td>
                                <td>{run.workflow}</td>
                                <td>{run.branch}</td>
                                <td>
                                    <code className="truncate">{run.commit_sha?.substring(0, 7)}</code>
                                </td>
                                <td>{getStatusBadge(run.status)}</td>
                                <td onClick={(e) => e.stopPropagation()}>
                                    <a href={run.run_url} target="_blank" rel="noopener noreferrer">
                                        View →
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pagination && (
                <div className="pagination">
                    <button
                        disabled={pagination.page <= 1}
                        onClick={() => onPageChange(pagination.page - 1)}
                    >
                        Previous
                    </button>
                    <span>
                        Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                    </span>
                    <button
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => onPageChange(pagination.page + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </>
    );
}
