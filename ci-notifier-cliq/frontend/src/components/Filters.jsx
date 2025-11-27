import React from 'react';

export default function Filters({ filters, onChange, onApply }) {
    return (
        <div className="filters">
            <label>
                Status
                <select
                    value={filters.status || ''}
                    onChange={(e) => onChange('status', e.target.value)}
                >
                    <option value="">All</option>
                    <option value="failure">Failure</option>
                    <option value="success">Success</option>
                </select>
            </label>

            <label>
                Search (Branch/Commit)
                <input
                    type="text"
                    placeholder="Search..."
                    value={filters.search || ''}
                    onChange={(e) => onChange('search', e.target.value)}
                />
            </label>

            <label>
                Start Date
                <input
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => onChange('startDate', e.target.value)}
                />
            </label>

            <label>
                End Date
                <input
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => onChange('endDate', e.target.value)}
                />
            </label>

            <button onClick={onApply}>Apply Filters</button>
        </div>
    );
}
