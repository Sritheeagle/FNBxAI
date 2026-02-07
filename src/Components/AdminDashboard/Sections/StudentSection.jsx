import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaFileUpload, FaSearch, FaEye, FaEdit, FaTrash, FaUserGraduate, FaUsers, FaUserCheck, FaUserClock } from 'react-icons/fa';

import StudentStatistics from '../StudentStatistics';

/**
 * STUDENT REGISTRY CONTROL CENTER
 * Strategic management of student identities and academic trajectories.
 */
const StudentSection = ({ students = [], openModal, handleDeleteStudent, getFileUrl }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAnalytics, setShowAnalytics] = useState(false);

    const filteredStudents = (students || []).filter(s =>
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.sid || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.branch || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(s.year || '').includes(searchTerm) ||
        String(s.section || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Calculate registry stats
    const stats = {
        total: students.length,
        active: students.filter(s => s.status !== 'Inactive').length,
        new: students.filter(s => {
            const date = new Date(s.createdAt || s.updatedAt);
            return (Date.now() - date.getTime()) < (7 * 24 * 60 * 60 * 1000);
        }).length
    };

    return (
        <div className="animate-fade-in">
            <header className="admin-page-header">
                <div className="admin-page-title">
                    <h1>STUDENT <span>REGISTRY</span></h1>
                    <p>Strategic oversight of verified student identities</p>
                </div>
                <div className="admin-action-bar compact">
                    <button className={`admin-btn ${showAnalytics ? 'admin-btn-primary' : 'admin-btn-outline'}`} onClick={() => setShowAnalytics(!showAnalytics)}>
                        <FaUserClock /> {showAnalytics ? 'HIDE INTEL' : 'FULL INTEL'}
                    </button>
                    <button className="admin-btn admin-btn-primary" onClick={() => openModal('student')}>
                        <FaPlus /> ADD NEW STUDENT
                    </button>
                    <button className="admin-btn admin-btn-outline" onClick={() => openModal('bulk-student')}>
                        <FaFileUpload /> BATCH UPLOAD
                    </button>
                </div>
            </header>

            {showAnalytics ? (
                <StudentStatistics students={students} />
            ) : (
                /* Strategic Analytics */
                <div className="admin-stats-grid mb-lg">
                    <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '0s' }}>
                        <div className="sentinel-scanner"></div>
                        <div className="summary-icon-box" style={{ background: '#eff6ff', color: '#6366f1', width: '50px', height: '50px', borderRadius: '14px' }}><FaUsers /></div>
                        <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{stats.total}</div>
                        <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>TOTAL PERSONNEL</div>
                    </div>
                    <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-1s' }}>
                        <div className="sentinel-scanner"></div>
                        <div className="summary-icon-box" style={{ background: '#dcfce7', color: '#10b981', width: '50px', height: '50px', borderRadius: '14px' }}><FaUserCheck /></div>
                        <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{stats.active}</div>
                        <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>ACTIVE STATUS</div>
                    </div>
                    <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-2s' }}>
                        <div className="sentinel-scanner"></div>
                        <div className="summary-icon-box" style={{ background: '#fef3c7', color: '#f59e0b', width: '50px', height: '50px', borderRadius: '14px' }}><FaUserClock /></div>
                        <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{stats.new}</div>
                        <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>RECENTLY UPDATED</div>
                    </div>
                </div>
            )}

            <div className="admin-card mb-lg">
                <div className="admin-filter-bar" style={{ gap: '1rem' }}>
                    <div className="admin-search-wrapper" style={{ flex: 1, minWidth: '300px' }}>
                        <FaSearch />
                        <input
                            className="admin-search-input"
                            placeholder="SEARCH BY IDENTITY (NAME, ID, OR BRANCH)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select className="admin-filter-select" style={{ minWidth: '150px' }}>
                        <option value="">ALL STATUS</option>
                        <option value="Active">ACTIVE</option>
                        <option value="Inactive">INACTIVE</option>
                    </select>
                </div>
            </div>

            <div className="admin-card sentinel-floating">
                <div className="sentinel-scanner"></div>
                <div className="admin-table-wrap">
                    <table className="admin-grid-table">
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ fontWeight: 950, letterSpacing: '0.05em' }}>STUDENT IDENTITY</th>
                                <th style={{ fontWeight: 950, letterSpacing: '0.05em' }}>SYSTEM ID</th>
                                <th style={{ fontWeight: 950, letterSpacing: '0.05em' }}>ACADEMIC BRANCH</th>
                                <th style={{ fontWeight: 950, letterSpacing: '0.05em' }}>YEAR / SECTION</th>
                                <th style={{ fontWeight: 950, letterSpacing: '0.05em' }}>TRAJECTORY</th>
                                <th style={{ fontWeight: 950, letterSpacing: '0.05em' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((s, idx) => (
                                    <motion.tr
                                        key={s.sid}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.03 }}
                                    >
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '12px',
                                                    overflow: 'hidden', border: '2px solid var(--admin-border)',
                                                    background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    {s.profilePic ? (
                                                        <img src={getFileUrl(s.profilePic)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <FaUserGraduate style={{ color: '#94a3b8' }} />
                                                    )}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 950, color: 'var(--admin-secondary)', fontSize: '0.9rem' }}>{s.name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', fontWeight: 800 }}>{s.email || 'NO EMAIL SYNCED'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="admin-badge primary">{s.sid}</span></td>
                                        <td>
                                            <div style={{ fontWeight: 900, color: 'var(--admin-primary)', fontSize: '0.8rem' }}>{s.branch}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <span className="admin-badge secondary">Y{s.year}</span>
                                                <span className="admin-badge dark">S{s.section || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '60px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${Math.min(100, (s.attendance || 0))}%`, height: '100%', background: 'var(--admin-primary)' }}></div>
                                                </div>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 950 }}>{s.attendance || 0}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="admin-action-btn" title="View Profile" onClick={() => openModal('student-view', s)}><FaEye /></button>
                                                <button className="admin-action-btn secondary" title="Edit" onClick={() => openModal('student', s)}><FaEdit /></button>
                                                <button className="admin-action-btn danger" title="Delete" onClick={() => handleDeleteStudent(s.sid)}><FaTrash /></button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6">
                                        <div className="admin-empty-state" style={{ padding: '8rem' }}>
                                            <FaUserGraduate className="admin-empty-icon" style={{ fontSize: '4rem', opacity: 0.2 }} />
                                            <p style={{ fontWeight: 950, color: 'var(--admin-text-muted)', marginTop: '1rem' }}>NO REGISTERED ENTITIES FOUND</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default StudentSection;
