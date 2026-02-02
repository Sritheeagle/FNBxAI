import React, { useState } from 'react';
import { FaUserGraduate, FaSearch, FaGraduationCap, FaCodeBranch, FaLayerGroup, FaRobot } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import '../FacultyDashboard.css';

const FacultyStudents = ({ studentsList, openAiWithPrompt }) => {
    // Safety check
    studentsList = studentsList || [];
    const [searchTerm, setSearchTerm] = useState('');
    const [filterYear, setFilterYear] = useState('All');

    const filteredStudents = studentsList.filter(student => {
        const matchesSearch = (student.studentName || student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (student.sid || student.id || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesYear = filterYear === 'All' || String(student.year) === String(filterYear);
        return matchesSearch && matchesYear;
    });

    const years = ['All', ...new Set(studentsList.map(s => s.year).filter(Boolean))].sort();

    return (
        <div className="animate-fade-in">
            <div className="nexus-mesh-bg"></div>

            {/* Header */}
            <header className="f-view-header">
                <div>
                    <h2>STUDENT <span>ROSTER</span></h2>
                    <p className="nexus-subtitle">Complete registry of students in your assigned classes</p>
                </div>
                <div className="f-node-actions">
                    <span className="f-meta-badge unit" style={{ fontSize: '0.9rem', padding: '0.6rem 1rem' }}>
                        {studentsList.length} TOTAL STUDENTS
                    </span>
                </div>
            </header>

            {/* Controls */}
            <div className="f-flex-gap f-spacer-lg animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <div className="f-search-bar" style={{ position: 'relative', width: '350px' }}>
                    <FaSearch style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                        type="text"
                        placeholder="Search student name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="f-form-select" // Re-using select style for consistent padding/radius
                        style={{ paddingLeft: '3.2rem', marginBottom: 0 }}
                    />
                </div>

                <div className="nexus-glass-pills" style={{ marginBottom: 0 }}>
                    {years.map(y => (
                        <button
                            key={y}
                            onClick={() => setFilterYear(y)}
                            className={`nexus-pill ${filterYear === String(y) ? 'active' : ''}`}
                        >
                            {y === 'All' ? 'ALL YEARS' : `YEAR ${y}`}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                {filteredStudents.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        <AnimatePresence>
                            {filteredStudents.map((student, i) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2 }}
                                    key={student.sid || student.id || i}
                                    className="f-node-card bounce-in"
                                    style={{ padding: '0', overflow: 'hidden', borderTop: '4px solid var(--nexus-primary)' }}
                                >
                                    <div style={{ padding: '1.5rem 1.5rem 1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div className="f-node-type-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--nexus-primary)', width: '56px', height: '56px', borderRadius: '16px' }}>
                                                <FaUserGraduate size={24} />
                                            </div>
                                            <span className="f-meta-badge unit" style={{ background: '#f1f5f9' }}>
                                                ID: {student.sid || student.id}
                                            </span>
                                        </div>

                                        <h3 style={{ margin: '0 0 0.2rem', fontSize: '1.2rem', fontWeight: 950, color: '#1e293b' }}>
                                            {student.studentName || student.name}
                                        </h3>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>
                                            {student.email || 'No email provided'}
                                        </p>
                                    </div>

                                    <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>
                                            <FaGraduationCap style={{ color: '#94a3b8' }} />
                                            <span>YEAR {student.year || '?'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>
                                            <FaLayerGroup style={{ color: '#94a3b8' }} />
                                            <span>SEC {student.section || '?'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem', fontWeight: 800, color: '#475569', gridColumn: 'span 2' }}>
                                            <FaCodeBranch style={{ color: '#94a3b8' }} />
                                            <span>{student.branch || 'General Engineering'}</span>
                                        </div>
                                        <div style={{ gridColumn: 'span 2', marginTop: '0.5rem' }}>
                                            <button
                                                className="f-quick-btn outline"
                                                style={{ width: '100%', fontSize: '0.7rem', padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                                                onClick={() => {
                                                    const prompt = `Can you provide a pedagogical evaluation and progress report for ${student.studentName} (ID: ${student.sid})? They are in Year ${student.year}, Section ${student.section}, studying ${student.branch}. I want to understand their potential learning hurdles and suggested intervention strategies.`;
                                                    openAiWithPrompt(prompt);
                                                }}
                                            >
                                                <FaRobot /> AI EVALUATE
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="f-node-card" style={{ textAlign: 'center', padding: '4rem 2rem', opacity: 0.8 }}>
                        <div className="f-node-type-icon" style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', fontSize: '2.5rem', background: '#f1f5f9', color: '#cbd5e1' }}>
                            <FaSearch />
                        </div>
                        <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#94a3b8', margin: 0 }}>NO STUDENTS FOUND</h3>
                        <p style={{ marginTop: '0.5rem', color: '#cbd5e1' }}>Try adjusting your search or filters.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FacultyStudents;
