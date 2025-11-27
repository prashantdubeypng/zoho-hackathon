import React, { useState, useEffect } from 'react';
import Stats from './Stats';
import Filters from './Filters';
import RunsList from './RunsList';
import { getRuns, connectToEvents } from '../services/api';

export default function Dashboard() {
    const [runs, setRuns] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        status: '',
        search: '',
        startDate: '',
        endDate: ''
    });
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        loadRuns();

        // Connect to SSE for real-time updates
        const eventSource = connectToEvents((data) => {
            console.log('SSE event:', data);
            if (data.type === 'new-run') {
                // Refresh the list when a new run arrives
                loadRuns();
            }
        });

        return () => {
            eventSource.close();
        };
    }, []);

    useEffect(() => {
        loadRuns();
    }, [currentPage]);

    async function loadRuns() {
        try {
            setLoading(true);
            const params = {
                page: currentPage,
                limit: 20,
                ...filters
            };

            // Remove empty filters
            Object.keys(params).forEach(key => {
                if (!params[key]) delete params[key];
            });

            const data = await getRuns(params);
            setRuns(data.runs || []);
            setPagination(data.pagination);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    function handleFilterChange(key, value) {
        setFilters(prev => ({ ...prev, [key]: value }));
    }

    function handleApplyFilters() {
        setCurrentPage(1); // Reset to first page
        loadRuns();
    }

    function handlePageChange(newPage) {
        setCurrentPage(newPage);
    }

    return (
        <div className="container">
            <Stats />

            <Filters
                filters={filters}
                onChange={handleFilterChange}
                onApply={handleApplyFilters}
            />

            {loading && <div className="loading">Loading runs...</div>}
            {error && <div className="error">Error loading runs: {error}</div>}
            {!loading && !error && (
                <RunsList
                    runs={runs}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                />
            )}
        </div>
    );
}
