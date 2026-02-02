import React, { useState, useEffect, useCallback } from 'react';
import { apiGet } from '../../utils/apiClient';
import { FaChalkboardTeacher, FaUserGraduate, FaBookOpen, FaUsers, FaThLarge, FaBookmark, FaCalendarAlt, FaSatellite } from 'react-icons/fa';

const FacultyTeachingStats = ({ facultyId }) => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        bySubject: [],
        bySection: [],
        totalClasses: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchTeachingStats = useCallback(async () => {
        try {
            const facultyData = await apiGet(`/api/faculty/${facultyId}`);
            const assignments = facultyData.assignments || [];
            const allStudents = await apiGet('/api/students');

            const studentsBySubject = {};
            const studentsBySection = {};
            let totalStudents = new Set();

            assignments.forEach(assignment => {
                const year = String(assignment.year || '').trim();
                const section = String((assignment.section || '')).trim().toUpperCase();
                const subject = assignment.subject || assignment.name || 'Unknown';

                const matchingStudents = allStudents.filter(student =>
                    String(student.year).trim() === year &&
                    String((student.section || '')).trim().toUpperCase() === section
                );

                if (!studentsBySubject[subject]) {
                    studentsBySubject[subject] = { subject, year, section, count: 0 };
                }
                studentsBySubject[subject].count += matchingStudents.length;

                const sectionKey = `Year ${year}-Section ${section}`;
                if (!studentsBySection[sectionKey]) {
                    studentsBySection[sectionKey] = { year, section, count: 0, subjects: [] };
                }
                studentsBySection[sectionKey].count += matchingStudents.length;
                if (!studentsBySection[sectionKey].subjects.includes(subject)) {
                    studentsBySection[sectionKey].subjects.push(subject);
                }

                matchingStudents.forEach(s => totalStudents.add(s.sid));
            });

            setStats({
                totalStudents: totalStudents.size,
                bySubject: Object.values(studentsBySubject),
                bySection: Object.values(studentsBySection),
                totalClasses: assignments.length
            });
        } catch (error) {
            console.error("Failed to fetch teaching stats", error);
        } finally {
            setLoading(false);
        }
    }, [facultyId]);

    useEffect(() => {
        fetchTeachingStats();
    }, [fetchTeachingStats]);

    if (loading && stats.totalStudents === 0) {
        return (
            <div className="f-node-card f-center-empty">
                <div className="spinner"></div>
                <p style={{ marginTop: '1rem', fontWeight: 850 }}>Synchronizing Telemetry...</p>
            </div>
        );
    }

    return (
        <div className="operational-overview animate-fade-in">
            <header className="f-view-header">
                <div>
                    <h2>TEACHING <span>OVERVIEW</span></h2>
                    <p className="nexus-subtitle">Live telemetry of your academic footprint</p>
                </div>
            </header>

            <div className="f-stats-grid" style={{ marginBottom: '3rem' }}>
                <div className="f-stats-card animate-slide-up" style={{ borderLeft: '4px solid #6366f1' }}>
                    <div className="f-stats-header">
                        <div>
                            <div className="f-stats-label" style={{ letterSpacing: '0.05em', fontWeight: 900, color: '#94a3b8' }}>TOTAL STUDENTS</div>
                            <div className="f-stats-value" style={{ fontSize: '2rem', fontWeight: 950, color: '#1e293b' }}>{stats.totalStudents}</div>
                        </div>
                        <div className="f-stats-icon-box" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <FaUsers style={{ fontSize: '1.4rem' }} />
                        </div>
                    </div>
                </div>

                <div className="f-stats-card animate-slide-up" style={{ borderLeft: '4px solid #10b981', animationDelay: '0.1s' }}>
                    <div className="f-stats-header">
                        <div>
                            <div className="f-stats-label" style={{ letterSpacing: '0.05em', fontWeight: 900, color: '#94a3b8' }}>SUBJECT NODES</div>
                            <div className="f-stats-value" style={{ fontSize: '2rem', fontWeight: 950, color: '#1e293b' }}>{stats.bySubject.length}</div>
                        </div>
                        <div className="f-stats-icon-box" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <FaBookOpen style={{ fontSize: '1.4rem' }} />
                        </div>
                    </div>
                </div>

                <div className="f-stats-card animate-slide-up" style={{ borderLeft: '4px solid #f59e0b', animationDelay: '0.2s' }}>
                    <div className="f-stats-header">
                        <div>
                            <div className="f-stats-label" style={{ letterSpacing: '0.05em', fontWeight: 900, color: '#94a3b8' }}>ACTIVE PIPELINES</div>
                            <div className="f-stats-value" style={{ fontSize: '2rem', fontWeight: 950, color: '#1e293b' }}>{stats.bySection.length}</div>
                        </div>
                        <div className="f-stats-icon-box" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', width: '56px', height: '56px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                            <FaThLarge style={{ fontSize: '1.4rem' }} />
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem' }}>
                <div className="f-node-card animate-slide-up" style={{ padding: '2.5rem', animationDelay: '0.3s' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 950, color: '#1e293b', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', padding: '0.5rem', borderRadius: '10px' }}><FaCalendarAlt /></div>
                        SECTION ANALYSIS
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {stats.bySection.length === 0 ? (
                            <p style={{ color: '#94a3b8', fontWeight: 850 }}>No section telemetry available.</p>
                        ) : (
                            stats.bySection.map((sec, idx) => (
                                <div key={idx} className="f-modal-list-item" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f1f5f9' }}>
                                    <div>
                                        <div style={{ fontWeight: 950, color: '#1e293b' }}>Section {sec.section}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 850, marginTop: '0.2rem' }}>YEAR {sec.year} • {sec.subjects.length} SUBJECTS</div>
                                    </div>
                                    <div style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontWeight: 950, fontSize: '0.85rem', color: 'var(--accent-primary)' }}>
                                        {sec.count} NODES
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="f-node-card animate-slide-up" style={{ padding: '2.5rem', animationDelay: '0.4s' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 950, color: '#1e293b', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '0.5rem', borderRadius: '10px' }}><FaBookmark /></div>
                        SUBJECT INVENTORY
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {stats.bySubject.length === 0 ? (
                            <p style={{ color: '#94a3b8', fontWeight: 850 }}>No subject data recorded.</p>
                        ) : (
                            stats.bySubject.map((sub, idx) => (
                                <div key={idx} className="f-modal-list-item" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f1f5f9' }}>
                                    <div>
                                        <div style={{ fontWeight: 950, color: '#1e293b' }}>{sub.subject}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 850, marginTop: '0.2rem' }}>ACTIVE SUBJECT CLUSTER</div>
                                    </div>
                                    <div style={{ background: 'white', padding: '0.5rem 1rem', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', fontWeight: 950, fontSize: '0.85rem', color: '#10b981' }}>
                                        {sub.count} STUDENTS
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacultyTeachingStats;
