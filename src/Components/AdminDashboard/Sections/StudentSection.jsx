import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaFileUpload, FaSearch, FaEye, FaEdit, FaTrash, FaUserGraduate, FaBook } from 'react-icons/fa';

/**
/**
 * Student Management
 * Comprehensive student registry and controls.
 */
const StudentSection = ({ students = [], openModal, handleDeleteStudent }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredStudents = (students || []).filter(s =>
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.sid || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade-in">
            <header className="admin-page-header">
                <div className="admin-page-title">
                    <h1>STUDENT <span>REGISTRY</span></h1>
                    <p>Total Students: {students.length}</p>
                </div>
                <div className="admin-action-bar compact" style={{ margin: 0, padding: '0.5rem 1.5rem' }}>
                    <button className="admin-btn admin-btn-primary" onClick={() => openModal('student')}>
                        <FaPlus /> ADD NEW STUDENT
                    </button>
                    <button className="admin-btn admin-btn-outline" onClick={() => openModal('bulk-student')}>
                        <FaFileUpload /> BATCH UPLOAD
                    </button>
                    <div className="admin-search-wrapper" style={{ width: 'auto', minWidth: '300px', margin: 0 }}>
                        <FaSearch />
                        <input
                            className="admin-search-input"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <div className="admin-card">
                <div className="admin-table-wrap">
                    <table className="admin-grid-table">
                        <thead>
                            <tr>
                                <th>STUDENT NAME</th>
                                <th>STUDENT ID</th>
                                <th>BRANCH</th>
                                <th>YEAR</th>
                                <th>SECTION</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((s, idx) => (
                                    <motion.tr
                                        key={s.sid}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.04 }}
                                    >
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div className="summary-icon-box" style={{ width: '36px', height: '36px', minWidth: '36px', fontSize: '0.9rem', background: '#f1f5f9', borderRadius: '10px' }}>
                                                    <FaUserGraduate style={{ color: 'var(--admin-secondary)' }} />
                                                </div>
                                                <span style={{ fontWeight: 600, color: 'var(--admin-secondary)' }}>{s.name}</span>
                                            </div>
                                        </td>
                                        <td><span className="admin-badge primary">{s.sid}</span></td>
                                        <td>{s.branch}</td>
                                        <td>YEAR {s.year}</td>
                                        <td>SEC {s.section || '---'}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="admin-action-btn" title="View Profile" onClick={() => openModal('student-view', s)}><FaEye /></button>
                                                <button className="admin-action-btn secondary" title="View Curriculum" onClick={() => openModal('student-curriculum', s)}><FaBook /></button>
                                                <button className="admin-action-btn secondary" title="Edit" onClick={() => openModal('student', s)}><FaEdit /></button>
                                                <button className="admin-action-btn danger" title="Delete" onClick={() => handleDeleteStudent(s.sid)}><FaTrash /></button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6">
                                        <div className="admin-empty-state" style={{ padding: '4rem' }}>
                                            <FaUserGraduate className="admin-empty-icon" />
                                            <p className="admin-empty-text">No students found.</p>
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
