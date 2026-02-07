import React, { useState, useEffect } from 'react';
import { FaChartBar, FaTrophy, FaUsers, FaBook, FaFilter } from 'react-icons/fa';
import { apiGet } from '../../utils/apiClient';
import sseClient from '../../utils/sseClient';
import './AdminMarks.css';

const AdminMarks = () => {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ year: '', section: '', subject: '' });

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (filters.year) params.append('year', filters.year);
                if (filters.section) params.append('section', filters.section);
                if (filters.subject) params.append('subject', filters.subject);

                const data = await apiGet(`/api/admin/marks/overview?${params.toString()}`);
                // Ensure data is not null
                setOverview(data || { totalStudents: 0, subjectsAnalyzed: [], averagesBySubject: {}, overallAverage: 0 });
            } catch (error) {
                console.error('Error fetching marks overview:', error);
                setOverview({ totalStudents: 0, subjectsAnalyzed: [], averagesBySubject: {}, overallAverage: 0 });
            } finally {
                setLoading(false);
            }
        };

        fetchOverview();

        // SSE Listener
        const unsub = sseClient.onUpdate((ev) => {
            if (ev.resource === 'marks') {
                fetchOverview();
            }
        });
        return unsub;
    }, [filters]);

    const getGradeColor = (percentage) => {
        if (percentage >= 90) return '#10b981';
        if (percentage >= 80) return '#3b82f6';
        if (percentage >= 70) return '#6366f1';
        if (percentage >= 60) return '#8b5cf6';
        if (percentage >= 50) return '#ec4899';
        if (percentage >= 40) return '#f59e0b';
        return '#ef4444';
    };

    if (loading) {
        return (
            <div className="admin-marks-container">
                <div className="f-loader-wrap" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', padding: '10rem' }}>
                    <div className="sentinel-scanner" style={{ width: '100%', maxWidth: '300px', height: '4px' }}></div>
                    <p style={{ fontWeight: 950, letterSpacing: '0.2em', color: '#94a3b8', fontSize: '0.8rem' }}>SYNCING PERFORMANCE DATA...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-marks-container animate-fade-in">
            <header className="admin-page-header">
                <div className="admin-page-title">
                    <h1>INTEL <span>PERFORMANCE</span></h1>
                    <p>Strategic analysis of academic progress and grade distribution</p>
                </div>
            </header>

            <div className="filter-bar">
                <div className="filter-group" style={{ display: 'flex', gap: '1rem', alignItems: 'center', width: '100%' }}>
                    <FaFilter style={{ color: 'var(--admin-text-light)' }} />
                    <select
                        value={filters.year}
                        onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                        className="filter-select"
                    >
                        <option value="">All Years</option>
                        <option value="1">Year 1</option>
                        <option value="2">Year 2</option>
                        <option value="3">Year 3</option>
                        <option value="4">Year 4</option>
                    </select>

                    <input
                        type="text"
                        value={filters.section}
                        onChange={(e) => setFilters({ ...filters, section: e.target.value })}
                        className="filter-input"
                        placeholder="Section (e.g. A, B)"
                        style={{ padding: '0.8rem', borderRadius: '12px', border: '1px solid #e2e8f0', fontWeight: 600, color: '#475569', minWidth: '150px' }}
                    />

                    <button className="filter-reset" onClick={() => setFilters({ year: '', section: '', subject: '' })} style={{ marginLeft: 'auto' }}>
                        RESET FILTERS
                    </button>
                </div>
            </div>

            <div className="admin-stats-grid mb-lg">
                <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '0s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{ background: '#e0e7ff', color: '#6366f1', width: '50px', height: '50px', borderRadius: '14px' }}><FaUsers /></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{overview?.totalStudents || 0}</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>ANALYZED PERSONNEL</div>
                </div>

                <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-1s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{ background: '#dcfce7', color: '#10b981', width: '50px', height: '50px', borderRadius: '14px' }}><FaBook /></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{overview?.subjectsAnalyzed?.length || 0}</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>KNOWLEDGE SECTORS</div>
                </div>

                <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-2s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{ background: '#fef3c7', color: '#f59e0b', width: '50px', height: '50px', borderRadius: '14px' }}><FaTrophy /></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{overview?.overallAverage || 0}%</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>GLOBAL AGGREGATE</div>
                </div>

                <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-3s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{ background: '#f3e8ff', color: '#8b5cf6', width: '50px', height: '50px', borderRadius: '14px' }}><FaChartBar /></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>
                        {overview?.averagesBySubject ? Object.keys(overview.averagesBySubject).length : 0}
                    </div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>LIVE EVALUATIONS</div>
                </div>
            </div>

            {/* Subject-wise Performance */}
            <div className="performance-section">
                <h3>SUBJECT-WISE PERFORMANCE</h3>

                {overview && overview.averagesBySubject && Object.keys(overview.averagesBySubject).length > 0 ? (
                    <div className="subject-cards-grid">
                        {Object.entries(overview.averagesBySubject).map(([subject, data], idx) => (
                            <div key={subject} className="subject-performance-card sentinel-floating" style={{ animationDelay: `${idx * -0.5}s` }}>
                                <div className="sentinel-scanner"></div>
                                <div className="subject-header">
                                    <FaBook style={{ color: '#6366f1' }} />
                                    <h4 style={{ fontWeight: 950 }}>{subject}</h4>
                                </div>

                                <div className="percentage-display">
                                    <div
                                        className="percentage-circle"
                                        style={{ borderColor: getGradeColor(data.percentage) }}
                                    >
                                        <span className="percentage-value">{data.percentage}%</span>
                                    </div>
                                </div>

                                <div className="subject-stats">
                                    <div className="subject-stat-item">
                                        <span className="subject-stat-label">Total Scored</span>
                                        <span className="subject-stat-value">{data.totalMarks}</span>
                                    </div>
                                    <div className="subject-stat-item">
                                        <span className="subject-stat-label">Max Marks</span>
                                        <span className="subject-stat-value">{data.maxMarks}</span>
                                    </div>
                                </div>

                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{
                                            width: `${data.percentage}%`,
                                            backgroundColor: getGradeColor(data.percentage)
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="admin-empty-state">
                        <FaChartBar className="admin-empty-icon" />
                        <h4 className="admin-empty-title">No Data Available</h4>
                        <p className="admin-empty-text">Marks will appear here once faculty enters them</p>
                    </div>
                )}
            </div>

            {/* Info Banner */}
            <div className="info-banner" style={{ marginTop: '2rem' }}>
                <FaTrophy />
                <div>
                    <strong>Assessment Structure:</strong>
                    <span>CLA (5 tests × 20 marks) + Module 1 (4 targets × 10 marks) + Module 2 (4 targets × 10 marks) = 180 marks total per subject</span>
                </div>
            </div>
        </div>
    );
};

export default AdminMarks;
