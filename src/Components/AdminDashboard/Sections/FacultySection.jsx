import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaEye, FaEdit, FaTrash, FaChalkboardTeacher, FaUsers, FaBook, FaFileUpload } from 'react-icons/fa';

/**
/**
 * Faculty Management
 * Manage instructors and curriculum responsibilities.
 */
const FacultySection = ({ faculty, students, openModal, handleDeleteFaculty, allSubjects = [] }) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [subjectFilter, setSubjectFilter] = React.useState('All');

    const filteredFaculty = React.useMemo(() => {
        return faculty.filter(f => {
            const matchesSearch = (f.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (f.facultyId || '').toLowerCase().includes(searchTerm.toLowerCase());

            const assignments = Array.isArray(f.assignments) ? f.assignments : [];
            const matchesSubject = subjectFilter === 'All' || assignments.some(a => a.subject === subjectFilter);

            return matchesSearch && matchesSubject;
        });
    }, [faculty, searchTerm, subjectFilter]);

    useEffect(() => {
        console.log('🎓 FacultySection Rendered');
        console.log('   - Total Faculty:', faculty.length);
        console.log('   - Filtered Faculty:', filteredFaculty.length);
        console.log('   - Faculty Data:', faculty);
        console.log('   - Search Term:', searchTerm);
        console.log('   - Subject Filter:', subjectFilter);
    }, [faculty, filteredFaculty, searchTerm, subjectFilter]);

    return (
        <div className="animate-fade-in">
            <header className="admin-page-header">
                <div className="admin-page-title">
                    <h1>FACULTY <span>DIRECTORY</span></h1>
                    <p>Total Faculty: {filteredFaculty.length}</p>
                </div>
                <div className="admin-action-bar compact" style={{ margin: 0, padding: '0.5rem 1.5rem' }}>
                    <button className="admin-btn admin-btn-primary" onClick={() => openModal('faculty')}>
                        <FaPlus /> ADD NEW FACULTY
                    </button>
                    <button className="admin-btn admin-btn-outline" onClick={() => openModal('bulk-faculty')}>
                        <FaFileUpload /> BULK UPLOAD
                    </button>
                </div>
            </header>

            <div className="admin-filter-bar">
                <div style={{ flex: 1, minWidth: '250px' }}>
                    <input
                        className="admin-form-input full-width"
                        placeholder="Search by name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ width: '100%', marginBottom: 0 }}
                    />
                </div>
                <select className="admin-filter-select" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                    <option value="All">All Taught Subjects</option>
                    {allSubjects.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
                </select>
            </div>

            <div className="admin-card">
                <div className="admin-table-wrap">
                    <table className="admin-grid-table">
                        <thead>
                            <tr>
                                <th>FACULTY NAME</th>
                                <th>FACULTY ID</th>
                                <th>DEPARTMENT</th>
                                <th>ASSIGNED SUBJECTS</th>
                                <th>STUDENT COUNT</th>
                                <th>CLASS LOAD</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredFaculty.length > 0 ? (
                                filteredFaculty.map((f, idx) => {
                                    const assignments = Array.isArray(f.assignments) ? f.assignments : [];
                                    const teachingCount = students.filter(s =>
                                        assignments.some(a =>
                                            String(a.year) === String(s.year) &&
                                            (String(a.section) === String(s.section) || a.section === 'All')
                                        )
                                    ).length;
                                    const uniqueSubjects = [...new Set(assignments.map(a => a.subject).filter(Boolean))];

                                    return (
                                        <motion.tr
                                            key={f.facultyId}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div className="summary-icon-box" style={{ width: '38px', height: '38px', borderRadius: '10px', fontSize: '0.9rem', background: '#f0fdf4', color: '#15803d' }}>
                                                        <FaChalkboardTeacher />
                                                    </div>
                                                    <span style={{ fontWeight: 600 }}>{f.name}</span>
                                                </div>
                                            </td>
                                            <td><span className="admin-badge primary">{f.facultyId}</span></td>
                                            <td>{f.department || 'CENTRAL'}</td>
                                            <td>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', maxWidth: '300px' }}>
                                                    {uniqueSubjects.length > 0 ? (
                                                        uniqueSubjects.map((subject, sIdx) => (
                                                            <span key={sIdx} className="admin-badge primary" style={{ fontSize: '0.6rem', textTransform: 'none', background: '#eef2ff', color: '#4338ca' }}>
                                                                {subject}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontStyle: 'italic' }}>NO ASSIGNMENTS</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <FaUsers style={{ color: '#94a3b8', fontSize: '0.8rem' }} />
                                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{teachingCount}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <FaBook style={{ color: '#94a3b8', fontSize: '0.8rem' }} />
                                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{assignments.length} CLASSES</span>
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
                                    <td colSpan="7">
                                        <div className="admin-empty-state" style={{ padding: '6rem' }}>
                                            <FaChalkboardTeacher className="admin-empty-icon" style={{ opacity: 0.3 }} />
                                            <p className="admin-empty-text" style={{ fontWeight: 950, color: 'var(--admin-text-muted)' }}>NO FACULTY FOUND</p>
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
