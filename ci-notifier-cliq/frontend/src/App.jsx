import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import RunDetail from './components/RunDetail';
import './styles/index.css';

export default function App() {
    return (
        <BrowserRouter>
            <div id="root">
                <header className="header">
                    <h1>🚀 CI Notifier Dashboard</h1>
                    <p>Real-time DevOps notifications for Zoho Cliq</p>
                </header>

                <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/dashboard/runs/:id" element={<RunDetail />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}
