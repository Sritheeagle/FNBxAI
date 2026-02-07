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
                <div className="f-stats-card sentinel-floating" style={{ borderLeft: '4px solid #6366f1', animationDelay: '0s', position: 'relative', overflow: 'hidden' }}>
                    <div className="sentinel-scanner" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#6366f1', opacity: 0.2 }}></div>
                    <div className="f-stats-header">
                        <div>
                            <div className="f-stats-label" style={{ letterSpacing: '0.1em', fontWeight: 950, color: '#94a3b8', fontSize: '0.65rem' }}>TOTAL PERSONNEL</div>
                            <div className="f-stats-value" style={{ fontSize: '2.25rem', fontWeight: 950, color: '#1e293b', letterSpacing: '-0.02em' }}>{stats.totalStudents}</div>
                        </div>
                        <div className="f-stats-icon-box" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', width: '60px', height: '60px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px rgba(99, 102, 241, 0.2)' }}>
                            <FaUsers style={{ fontSize: '1.6rem' }} />
                        </div>
                    </div>
                </div>

                <div className="f-stats-card sentinel-floating" style={{ borderLeft: '4px solid #10b981', animationDelay: '-1.5s', position: 'relative', overflow: 'hidden' }}>
                    <div className="sentinel-scanner" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#10b981', opacity: 0.2 }}></div>
                    <div className="f-stats-header">
                        <div>
                            <div className="f-stats-label" style={{ letterSpacing: '0.1em', fontWeight: 950, color: '#94a3b8', fontSize: '0.65rem' }}>KNOWLEDGE NODES</div>
                            <div className="f-stats-value" style={{ fontSize: '2.25rem', fontWeight: 950, color: '#1e293b', letterSpacing: '-0.02em' }}>{stats.bySubject.length}</div>
                        </div>
                        <div className="f-stats-icon-box" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', width: '60px', height: '60px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.2)' }}>
                            <FaBookOpen style={{ fontSize: '1.6rem' }} />
                        </div>
                    </div>
                </div>

                <div className="f-stats-card sentinel-floating" style={{ borderLeft: '4px solid #f59e0b', animationDelay: '-3s', position: 'relative', overflow: 'hidden' }}>
                    <div className="sentinel-scanner" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#f59e0b', opacity: 0.2 }}></div>
                    <div className="f-stats-header">
                        <div>
                            <div className="f-stats-label" style={{ letterSpacing: '0.1em', fontWeight: 950, color: '#94a3b8', fontSize: '0.65rem' }}>OPERATIONAL PIPELINES</div>
                            <div className="f-stats-value" style={{ fontSize: '2.25rem', fontWeight: 950, color: '#1e293b', letterSpacing: '-0.02em' }}>{stats.bySection.length}</div>
                        </div>
                        <div className="f-stats-icon-box" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', width: '60px', height: '60px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 8px 16px rgba(245, 158, 11, 0.2)' }}>
                            <FaThLarge style={{ fontSize: '1.6rem' }} />
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                <div className="f-node-card sentinel-floating" style={{ padding: '2.5rem', animationDelay: '-1.5s', position: 'relative', overflow: 'hidden' }}>
                    <div className="sentinel-scanner" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--accent-primary)', opacity: 0.1 }}></div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 950, color: '#1e293b', marginBottom: '2.25rem', display: 'flex', alignItems: 'center', gap: '0.8rem', letterSpacing: '-0.01em' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaCalendarAlt size={18} /></div>
                        PIPELINE ANALYSIS
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {stats.bySection.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                                <p style={{ color: '#94a3b8', fontWeight: 850, margin: 0 }}>NO PIPELINE TELEMETRY DETECTED</p>
                            </div>
                        ) : (
                            stats.bySection.map((sec, idx) => (
                                <div key={idx} className="f-modal-list-item" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f1f5f9', transition: '0.2s' }}>
                                    <div>
                                        <div style={{ fontWeight: 950, color: '#1e293b', fontSize: '1.05rem' }}>SECTION {sec.section}</div>
                                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 900, marginTop: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ACADEMIC YEAR {sec.year} • {sec.subjects.length} MODULES</div>
                                    </div>
                                    <div style={{ background: 'white', padding: '0.6rem 1.25rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontWeight: 950, fontSize: '0.9rem', color: 'var(--accent-primary)', border: '1px solid #f1f5f9' }}>
                                        {sec.count} NODES
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="f-node-card sentinel-floating" style={{ padding: '2.5rem', animationDelay: '-3s', position: 'relative', overflow: 'hidden' }}>
                    <div className="sentinel-scanner" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: '#10b981', opacity: 0.1 }}></div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 950, color: '#1e293b', marginBottom: '2.25rem', display: 'flex', alignItems: 'center', gap: '0.8rem', letterSpacing: '-0.01em' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaBookmark size={18} /></div>
                        MODULE INVENTORY
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {stats.bySubject.length === 0 ? (
                            <div style={{ padding: '3rem', textAlign: 'center', background: '#f8fafc', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                                <p style={{ color: '#94a3b8', fontWeight: 850, margin: 0 }}>NO MODULE RECORDS ACCESSIBLE</p>
                            </div>
                        ) : (
                            stats.bySubject.map((sub, idx) => (
                                <div key={idx} className="f-modal-list-item" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f1f5f9', transition: '0.2s' }}>
                                    <div>
                                        <div style={{ fontWeight: 950, color: '#1e293b', fontSize: '1.05rem' }}>{sub.subject}</div>
                                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 900, marginTop: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ACTIVE CLUSTER • UNIT {sub.section}</div>
                                    </div>
                                    <div style={{ background: 'white', padding: '0.6rem 1.25rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', fontWeight: 950, fontSize: '0.9rem', color: '#10b981', border: '1px solid #f1f5f9' }}>
                                        {sub.count} USERS
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
