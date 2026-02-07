import React, { useState } from 'react';
import { FaUserGraduate, FaSearch, FaGraduationCap, FaCodeBranch, FaLayerGroup, FaRobot } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import '../FacultyDashboard.css';

const FacultyStudents = ({ studentsList, openAiWithPrompt, getFileUrl }) => {
    // Safety check
    studentsList = studentsList || [];
    const [searchTerm, setSearchTerm] = useState('');
    const [filterYear, setFilterYear] = useState('All');
    const [filterBranch, setFilterBranch] = useState('All');
    const [selectedStudent, setSelectedStudent] = useState(null);

    const filteredStudents = studentsList.filter(student => {
        const matchesSearch = (student.studentName || student.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (student.sid || student.id || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesYear = filterYear === 'All' || String(student.year) === String(filterYear);
        const matchesBranch = filterBranch === 'All' || String(student.branch || '').toUpperCase() === String(filterBranch).toUpperCase();
        return matchesSearch && matchesYear && matchesBranch;
    });

    const years = ['All', ...new Set(studentsList.map(s => s.year).filter(Boolean))].sort();
    const branches = ['All', ...new Set(studentsList.map(s => s.branch).filter(Boolean))].sort();

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

                <div className="nexus-glass-pills" style={{ marginBottom: 0 }}>
                    {branches.map(b => (
                        <button
                            key={b}
                            onClick={() => setFilterBranch(b)}
                            className={`nexus-pill ${filterBranch === String(b) ? 'active' : ''}`}
                        >
                            {b === 'All' ? 'ALL BRANCHES' : b}
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
                                    className="f-node-card sentinel-floating"
                                    style={{
                                        padding: '0',
                                        overflow: 'hidden',
                                        animationDelay: `${i * -0.5}s`,
                                        borderTop: `4px solid ${student.attendanceRisk === 'critical' ? 'var(--v-danger, #ef4444)' :
                                            student.attendanceRisk === 'warning' ? 'var(--v-secondary, #f59e0b)' :
                                                'var(--v-accent, #10b981)'}`
                                    }}
                                >
                                    <div className="sentinel-scanner"></div>
                                    <div style={{ padding: '1.5rem 1.5rem 1rem', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                            <div className="mentor-portrait" style={{ width: '56px', height: '56px' }}>
                                                {student.profilePic ? (
                                                    <img src={getFileUrl(student.profilePic)} alt={student.name} style={{ borderRadius: '14px' }} />
                                                ) : (
                                                    <div className="portrait-fallback" style={{ borderRadius: '14px', fontSize: '1rem' }}>
                                                        {(student.studentName || student.name || 'S').charAt(0)}
                                                    </div>
                                                )}
                                                <div className={`status-dot ${student.attendanceRisk === 'critical' ? 'busy' : 'online'}`}></div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <span className="f-meta-badge unit" style={{ background: '#f1f5f9', display: 'block', marginBottom: '0.4rem' }}>
                                                    ID: {student.sid || student.id}
                                                </span>
                                                <span className={`status-tag ${student.attendanceRisk === 'critical' ? 'gold' : ''}`} style={{ fontSize: '0.55rem', fontWeight: 950 }}>
                                                    {student.attendanceRisk?.toUpperCase() || 'OPTIMAL'} FLOW
                                                </span>
                                            </div>
                                        </div>

                                        <h3 style={{ margin: '0 0 0.2rem', fontSize: '1.2rem', fontWeight: 950, color: '#1e293b' }}>
                                            {student.studentName || student.name}
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>
                                                {student.email || 'No registry email'}
                                            </span>
                                            {student.attendancePct !== undefined && (
                                                <span style={{ fontSize: '0.7rem', fontWeight: 950, color: 'var(--v-primary)' }}>
                                                    ({student.attendancePct}%)
                                                </span>
                                            )}
                                        </div>
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
                                        <div style={{ gridColumn: 'span 2', marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                className="f-quick-btn outline"
                                                style={{ flex: 1, fontSize: '0.65rem', padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                                                onClick={() => {
                                                    const prompt = `Can you provide a pedagogical evaluation and progress report for ${student.studentName} (ID: ${student.sid})? They are in Year ${student.year}, Section ${student.section}, studying ${student.branch}. I want to understand their potential learning hurdles and suggested intervention strategies.`;
                                                    openAiWithPrompt(prompt);
                                                }}
                                            >
                                                <FaRobot /> AI
                                            </button>
                                            <button
                                                className="f-quick-btn primary"
                                                style={{ flex: 2, fontSize: '0.65rem', padding: '0.5rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                                                onClick={() => setSelectedStudent(student)}
                                            >
                                                <FaSearch /> VIEW DOSSIER
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

            {/* Dossier Modal */}
            <AnimatePresence>
                {selectedStudent && (
                    <div className="nexus-modal-overlay" onClick={() => setSelectedStudent(null)} style={{ zIndex: 1000 }}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="nexus-modal-content"
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: '800px', width: '95%', padding: 0, overflow: 'hidden' }}
                        >
                            <div className="sentinel-scanner"></div>
                            <div className="f-modal-header" style={{ padding: '2rem', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                    <div className="mentor-portrait" style={{ width: '80px', height: '80px' }}>
                                        {selectedStudent.profilePic ? (
                                            <img src={getFileUrl(selectedStudent.profilePic)} alt={selectedStudent.name} />
                                        ) : (
                                            <div className="portrait-fallback" style={{ fontSize: '2rem' }}>
                                                {(selectedStudent.studentName || selectedStudent.name || 'S').charAt(0)}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="nexus-page-subtitle" style={{ marginBottom: '0.2rem' }}>Personnel File // {selectedStudent.sid}</div>
                                        <h2 style={{ fontSize: '2rem', fontWeight: 950, margin: 0 }}>{selectedStudent.studentName || selectedStudent.name}</h2>
                                        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                                            <span className="f-meta-badge type">{selectedStudent.branch}</span>
                                            <span className="f-meta-badge unit">YEAR {selectedStudent.year}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="nexus-modal-close" onClick={() => setSelectedStudent(null)}>&times;</button>
                            </div>

                            <div className="nexus-modal-body" style={{ padding: '2rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                    <div className="f-node-card" style={{ padding: '1.5rem', background: '#fff', border: '1px solid #f1f5f9' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 950, color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>ATTENDANCE STATUS</span>
                                        <div style={{ fontSize: '1.8rem', fontWeight: 950, color: selectedStudent.attendanceRisk === 'critical' ? '#ef4444' : '#10b981' }}>
                                            {selectedStudent.attendancePct || 0}%
                                        </div>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>Current presence rate</span>
                                    </div>
                                    <div className="f-node-card" style={{ padding: '1.5rem', background: '#fff', border: '1px solid #f1f5f9' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 950, color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>OPERATIONAL FLOW</span>
                                        <div style={{ fontSize: '1.2rem', fontWeight: 950, color: '#1e293b', textTransform: 'uppercase' }}>
                                            {selectedStudent.attendanceRisk || 'OPTIMAL'}
                                        </div>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b' }}>Registry risk level</span>
                                    </div>
                                    <div className="f-node-card" style={{ padding: '1.5rem', background: '#fff', border: '1px solid #f1f5f9', gridColumn: 'span 2' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 950, color: '#94a3b8', display: 'block', marginBottom: '0.5rem' }}>CONTACT CHANNELS</span>
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>📧 {selectedStudent.email}</div>
                                            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>📱 {selectedStudent.phone || 'NO PHONE SYNC'}</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '0.9rem', fontWeight: 950 }}>SYSTEM RECOMMENDATIONS</h4>
                                    <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                                        {selectedStudent.attendanceRisk === 'critical'
                                            ? "URGENT ALERT: Student's spectral presence has dropped below critical thresholds. Immediate pedagogical intervention and counseling sub-routines are recommended to prevent credit fragmentation."
                                            : "STABLE FLOW: Student maintains optimal sync with the curriculum node. Continue standard monitoring and periodic intelligence updates."}
                                    </p>
                                </div>
                            </div>
                            <div className="f-modal-actions" style={{ padding: '1.5rem 2rem', background: '#f1f5f9', borderTop: '1px solid #e2e8f0' }}>
                                <button className="f-cancel-btn" onClick={() => setSelectedStudent(null)}>CLOSE TERMINAL</button>
                                <button
                                    className="f-quick-btn primary"
                                    onClick={() => {
                                        const prompt = `I am reviewing the dossier for ${selectedStudent.studentName}. They have ${selectedStudent.attendancePct}% attendance and a ${selectedStudent.attendanceRisk} risk profile. What specific academic coaching steps should I take?`;
                                        openAiWithPrompt(prompt);
                                    }}
                                >
                                    COACH WITH AI
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default FacultyStudents;
