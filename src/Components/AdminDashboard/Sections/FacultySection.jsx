import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaEye, FaEdit, FaTrash, FaChalkboardTeacher, FaUsers, FaBook, FaFileUpload, FaSearch, FaBriefcase, FaGraduationCap } from 'react-icons/fa';

/**
 * FACULTY COMMAND CENTER
 * Oversight and scheduling of academic instructors and curriculum assignments.
 */
const FacultySection = ({ faculty = [], students = [], openModal, handleDeleteFaculty, allSubjects = [], getFileUrl }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('All');

    const filteredFaculty = useMemo(() => {
        return faculty.filter(f => {
            const matchesSearch = (f.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (f.facultyId || '').toLowerCase().includes(searchTerm.toLowerCase());

            const assignments = Array.isArray(f.assignments) ? f.assignments : [];
            const matchesSubject = subjectFilter === 'All' || assignments.some(a => a.subject === subjectFilter);

            return matchesSearch && matchesSubject;
        });
    }, [faculty, searchTerm, subjectFilter]);

    // Calculate Strategic Stats
    const stats = {
        total: faculty.length,
        departments: new Set(faculty.map(f => f.department).filter(Boolean)).size,
        totalClasses: faculty.reduce((acc, f) => acc + (f.assignments?.length || 0), 0)
    };

    return (
        <div className="animate-fade-in">
            <header className="admin-page-header">
                <div className="admin-page-title">
                    <h1>FACULTY <span>COMMAND</span></h1>
                    <p>Strategic management of academic instructors and curriculum deployments</p>
                </div>
                <div className="admin-action-bar compact">
                    <button className="admin-btn admin-btn-primary" onClick={() => openModal('faculty')}>
                        <FaPlus /> ADD NEW FACULTY
                    </button>
                    <button className="admin-btn admin-btn-outline" onClick={() => openModal('bulk-faculty')}>
                        <FaFileUpload /> BATCH UPLOAD
                    </button>
                </div>
            </header>

            {/* Strategic Analytics */}
            <div className="admin-stats-grid mb-lg">
                <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '0s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{ background: '#f5f3ff', color: '#8b5cf6', width: '50px', height: '50px', borderRadius: '14px' }}><FaChalkboardTeacher /></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{stats.total}</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>ACTIVE INSTRUCTORS</div>
                </div>
                <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-1s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{ background: '#ecfdf5', color: '#10b981', width: '50px', height: '50px', borderRadius: '14px' }}><FaBriefcase /></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{stats.departments}</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>ACTIVE DEPARTMENTS</div>
                </div>
                <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-2s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{ background: '#fff7ed', color: '#f59e0b', width: '50px', height: '50px', borderRadius: '14px' }}><FaGraduationCap /></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{stats.totalClasses}</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>ASSIGNED DEPLOYMENTS</div>
                </div>
            </div>

            <div className="admin-card mb-lg">
                <div className="admin-filter-bar" style={{ gap: '1rem' }}>
                    <div className="admin-search-wrapper" style={{ flex: 1, minWidth: '300px' }}>
                        <FaSearch />
                        <input
                            className="admin-search-input"
                            placeholder="SEARCH BY NAME OR ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select className="admin-filter-select" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                        <option value="All">ALL SUBJECTS</option>
                        {allSubjects.map(s => <option key={s.code} value={s.name}>{s.name.toUpperCase()}</option>)}
                    </select>
                </div>
            </div>

            <div className="admin-card sentinel-floating">
                <div className="sentinel-scanner"></div>
                <div className="admin-table-wrap">
                    <table className="admin-grid-table">
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ fontWeight: 950, letterSpacing: '0.05em' }}>INSTRUCTOR IDENTITY</th>
                                <th style={{ fontWeight: 950, letterSpacing: '0.05em' }}>FACULTY ID</th>
                                <th style={{ fontWeight: 950, letterSpacing: '0.05em' }}>DEPARTMENT</th>
                                <th style={{ fontWeight: 950, letterSpacing: '0.05em' }}>LOAD DENSITY</th>
                                <th style={{ fontWeight: 950, letterSpacing: '0.05em' }}>PERSONNEL IMPACT</th>
                                <th style={{ fontWeight: 950, letterSpacing: '0.05em' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFaculty.length > 0 ? (
                                filteredFaculty.map((f, idx) => {
                                    const assignments = Array.isArray(f.assignments) ? f.assignments : [];
                                    const teachingCount = students.filter(s =>
                                        assignments.some(a => {
                                            const yMatch = String(a.year) === String(s.year);

                                            const aSections = a.section ? String(a.section).toUpperCase().split(',').map(sec => sec.trim()) : [];
                                            const sSection = String(s.section || '').toUpperCase();
                                            const secMatch = !a.section || aSections.includes('ALL') || aSections.includes(sSection);

                                            const aBranches = a.branch ? String(a.branch).toUpperCase().split(',').map(b => b.trim()) : [];
                                            const sBranch = String(s.branch || '').toUpperCase();
                                            const branchMatch = !a.branch || aBranches.includes('ALL') || aBranches.includes(sBranch);

                                            return yMatch && secMatch && branchMatch;
                                        })
                                    ).length;
                                    const classLoad = assignments.length;
                                    const loadPercentage = Math.min(100, (classLoad / 10) * 100); // Assume 10 is max load

                                    return (
                                        <motion.tr
                                            key={f.facultyId}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div style={{
                                                        width: '40px', height: '40px', borderRadius: '12px',
                                                        background: 'var(--admin-bg-soft)', display: 'flex',
                                                        alignItems: 'center', justifyContent: 'center', color: 'var(--admin-primary)',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {f.profilePic ? (
                                                            <img src={getFileUrl(f.profilePic)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <FaChalkboardTeacher />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 950, color: 'var(--admin-secondary)', fontSize: '0.9rem' }}>{f.name}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', fontWeight: 800 }}>{f.email || 'PROTOCOL ACTIVE'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td><span className="admin-badge primary">{f.facultyId}</span></td>
                                            <td>{f.department || 'CENTRAL OPS'}</td>
                                            <td>
                                                <div style={{ minWidth: '120px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--admin-text-muted)' }}>{classLoad} CLASSES</span>
                                                        <span style={{ fontSize: '0.65rem', fontWeight: 950 }}>{loadPercentage}%</span>
                                                    </div>
                                                    <div style={{ width: '100%', height: '4px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${loadPercentage}%`, height: '100%', background: loadPercentage > 80 ? '#ef4444' : 'var(--admin-primary)' }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <FaUsers style={{ color: '#94a3b8', fontSize: '0.8rem' }} />
                                                    <span style={{ fontWeight: 950, fontSize: '0.85rem' }}>{teachingCount} UNITS</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button className="admin-action-btn" title="View Profile" onClick={() => openModal('faculty-view', f)}><FaEye /></button>
                                                    <button className="admin-action-btn secondary" title="Edit" onClick={() => openModal('faculty', f)}><FaEdit /></button>
                                                    <button className="admin-action-btn danger" title="Delete" onClick={() => handleDeleteFaculty(f.facultyId)}><FaTrash /></button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="6">
                                        <div className="admin-empty-state" style={{ padding: '8rem' }}>
                                            <FaChalkboardTeacher className="admin-empty-icon" style={{ opacity: 0.2 }} />
                                            <p style={{ fontWeight: 950, color: 'var(--admin-text-muted)', marginTop: '1rem' }}>NO FACULTY ENTITIES REGISTERED</p>
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

export default FacultySection;
