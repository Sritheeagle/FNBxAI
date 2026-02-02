import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './FacultyDashboard.css';
import { FaCalendarAlt, FaCheckCircle, FaSave, FaUserCheck, FaHistory, FaFilter, FaUsers, FaExclamationTriangle } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { apiGet, apiPost } from '../../utils/apiClient';
import sseClient from '../../utils/sseClient';

/**
 * FACULTY ATTENDANCE MANAGER
 * Attendance tracking and management interface with section-based filtering.
 */
const FacultyAttendanceManager = ({ facultyData }) => {
    // Safety check
    facultyData = facultyData || {};
    const [availableSections, setAvailableSections] = useState([]);
    const [selectedSection, setSelectedSection] = useState({ year: '', section: '' });
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState([]);
    const [viewMode, setViewMode] = useState('take');



    const initializeSections = useCallback(() => {
        console.log('=== INITIALIZING ATTENDANCE SECTIONS ===');
        const sections = extractSectionsFromData(facultyData);
        console.log('Extracted sections for attendance:', sections);
        setAvailableSections(sections);

        if (sections.length > 0) {
            setSelectedSection(sections[0]);
        }
    }, [facultyData]);

    const extractSectionsFromData = (data) => {
        if (!data) return [];

        console.log('Extracting sections from:', Object.keys(data));

        // Method 1: Check assignments array (Primary Source)
        if (data.assignments && Array.isArray(data.assignments) && data.assignments.length > 0) {
            const sectionsMap = new Map();
            data.assignments.forEach(assignment => {
                const year = String(assignment.year || assignment.Year || assignment.classYear || '');
                // Default to 'A' if section is missing or undefined
                let section = String(assignment.section || assignment.Section || assignment.classSection || 'A').toUpperCase().trim();
                if (section === 'UNDEFINED' || section === 'NULL' || section === '') section = 'A';

                const subject = assignment.subject || assignment.Subject || data.subject || 'General';

                if (year) {
                    const key = `${year}-${section}-${subject}`;
                    if (!sectionsMap.has(key)) {
                        sectionsMap.set(key, { year, section, subject });
                    }
                }
            });
            const sections = Array.from(sectionsMap.values());
            if (sections.length > 0) {
                console.log('✅ Sections from assignments:', sections);
                return sections;
            }
        }

        // Method 2: Check sections array
        if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
            return data.sections.map(s => ({
                year: String(s.year || s.Year),
                section: String(s.section || s.Section || 'A').toUpperCase()
            }));
        }

        // Method 3: Check direct fields
        if (data.year) {
            return [{
                year: String(data.year),
                section: String(data.section || 'A').toUpperCase()
            }];
        }

        console.error('❌ NO SECTIONS FOUND for attendance');
        return [];
    };

    const fetchStudentsAndAttendance = useCallback(async () => {
        setLoading(true);
        try {
            const allStudents = await apiGet(`/api/faculty-stats/${facultyData.facultyId}/students`);
            console.log('Fetched students for attendance:', allStudents);

            // Filter by selected section
            const filteredStudents = allStudents.filter(s => {
                const studentYear = String(s.year || s.Year);
                const studentSection = String(s.section || s.Section).toUpperCase().trim();
                // Compare as strings to avoid type mismatch
                return studentYear === String(selectedSection.year) &&
                    studentSection === String(selectedSection.section).toUpperCase().trim();
            });
            setStudents(filteredStudents);

            // Fetch existing attendance
            const subject = selectedSection.subject || facultyData?.subject || '';
            const branch = filteredStudents[0]?.branch || 'CSE';
            const existing = await apiGet(
                `/api/attendance/all?year=${selectedSection.year}&section=${selectedSection.section}&subject=${encodeURIComponent(subject)}&date=${date}&branch=${branch}`
            );

            if (existing && existing.length > 0) {
                const record = existing[0];
                const statusMap = {};
                record.records.forEach(r => { statusMap[r.studentId] = r.status; });
                setAttendance(statusMap);
            } else {
                const initialStatus = {};
                filteredStudents.forEach(s => { initialStatus[s.sid || s.id] = 'Present'; });
                setAttendance(initialStatus);
            }
        } catch (error) {
            console.error("Error loading roster:", error);
        } finally {
            setLoading(false);
        }
    }, [facultyData, selectedSection, date]);

    useEffect(() => {
        const unsub = sseClient.onUpdate((ev) => {
            if (ev.resource === 'attendance') {
                fetchStudentsAndAttendance();
            }
        });
        return unsub;
    }, [fetchStudentsAndAttendance]);

    const fetchHistory = useCallback(async () => {
        try {
            const subject = selectedSection.subject || facultyData?.subject || '';
            const res = await apiGet(
                `/api/attendance/all?year=${selectedSection.year}&section=${selectedSection.section}&subject=${encodeURIComponent(subject)}`
            );
            setHistory(res || []);
        } catch (err) {
            console.error("History fetch fail:", err);
        }
    }, [facultyData, selectedSection]);

    useEffect(() => {
        initializeSections();
    }, [facultyData, initializeSections]);

    useEffect(() => {
        if (selectedSection.year && selectedSection.section) {
            fetchStudentsAndAttendance();
            fetchHistory();
        }
    }, [selectedSection, date, fetchStudentsAndAttendance, fetchHistory]);

    const handleSectionChange = (newSection) => {
        setSelectedSection(newSection);
    };

    const handleStatusChange = (studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const markAll = (status) => {
        const newStatus = {};
        students.forEach(s => { newStatus[s.sid || s.id] = status; });
        setAttendance(newStatus);
    };

    const handleSubmit = async () => {
        setSaving(true);
        const records = students.map(s => ({
            studentId: s.sid || s.id,
            studentName: s.studentName || s.name,
            status: attendance[s.sid || s.id] || 'Present'
        }));

        try {
            await apiPost('/api/attendance', {
                date,
                subject: selectedSection.subject || facultyData?.subject || '',
                year: selectedSection.year,
                section: selectedSection.section,
                branch: students[0]?.branch || 'CSE',
                facultyId: facultyData?.facultyId,
                facultyName: facultyData?.name || '',
                records
            });
            alert("Attendance Saved Successfully.");
            fetchHistory();
        } catch (error) {
            alert('Save Error: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const stats = useMemo(() => {
        const total = students.length;
        if (total === 0) return { present: 0, absent: 0, percentage: 0 };
        const present = Object.values(attendance).filter(s => s === 'Present').length;
        const absent = Object.values(attendance).filter(s => s === 'Absent').length;
        return { present, absent, percentage: Math.round((present / total) * 100) };
    }, [students, attendance]);

    // Show error if no sections
    if (availableSections.length === 0) {
        return (
            <div className="attendance-manager">
                <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
                    <FaExclamationTriangle size={64} style={{ color: '#f59e0b' }} />
                    <h3>No Sections Assigned</h3>
                    <p>Your faculty account doesn't have sections assigned for attendance.</p>
                    <p style={{ marginTop: '1rem', color: '#64748b' }}>
                        Please check the Marks section for debugging information or contact admin.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="attendance-manager animate-fade-in">
            <header className="f-view-header">
                <div>
                    <h2>ATTENDANCE <span>CONTROL</span></h2>
                    <p className="nexus-subtitle">Track and manage student presence across your sections</p>
                </div>
                <div className="nexus-glass-pills" style={{ marginBottom: 0 }}>
                    <button className={`nexus-pill ${viewMode === 'take' ? 'active' : ''}`} onClick={() => setViewMode('take')}>
                        <FaUserCheck /> MARK ATTENDANCE
                    </button>
                    <button className={`nexus-pill ${viewMode === 'history' ? 'active' : ''}`} onClick={() => setViewMode('history')}>
                        <FaHistory /> HISTORY
                    </button>
                </div>
            </header>

            {viewMode === 'take' ? (
                <>
                    {/* Section Filter & Stats */}
                    <div className="f-flex-gap f-spacer-lg animate-slide-up" style={{ alignItems: 'flex-start' }}>
                        <div className="f-node-card" style={{ flex: 1, padding: '1.25rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                <FaFilter style={{ color: 'var(--accent-primary)' }} />
                                <span style={{ fontWeight: 900, fontSize: '0.75rem', color: '#94a3b8', letterSpacing: '0.05em' }}>SELECT ACADEMIC SECTION</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                {availableSections.map((sec, idx) => (
                                    <button
                                        key={idx}
                                        className={`section-btn ${selectedSection.year === sec.year && selectedSection.section === sec.section && selectedSection.subject === sec.subject ? 'active' : ''}`}
                                        onClick={() => handleSectionChange(sec)}
                                        style={{ fontSize: '0.7rem' }}
                                    >
                                        YR {sec.year} ({sec.section})
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="f-weekly-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', background: 'transparent', padding: 0 }}>
                            <div className="f-stat-card" style={{ padding: '1rem 1.5rem' }}>
                                <span className="val" style={{ color: '#10b981', fontSize: '1.5rem' }}>{stats.present}</span>
                                <span className="lab">PRESENT</span>
                            </div>
                            <div className="f-stat-card" style={{ padding: '1rem 1.5rem' }}>
                                <span className="val" style={{ color: '#ef4444', fontSize: '1.5rem' }}>{stats.absent}</span>
                                <span className="lab">ABSENT</span>
                            </div>
                            <div className="f-stat-card" style={{ padding: '1rem 1.5rem' }}>
                                <span className="val" style={{ color: 'var(--accent-primary)', fontSize: '1.5rem' }}>{stats.percentage}%</span>
                                <span className="lab">RATE</span>
                            </div>
                            <div className="f-stat-card" style={{ padding: '1rem 1.5rem' }}>
                                <span className="val" style={{ color: '#f59e0b', fontSize: '1.5rem' }}>{students.length}</span>
                                <span className="lab">TOTAL</span>
                            </div>
                        </div>
                    </div>

                    <div className="f-attendance-controls animate-slide-up" style={{ padding: '1.5rem', background: 'white', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                            <div className="f-pill-control">
                                <FaCalendarAlt style={{ color: 'var(--accent-primary)' }} />
                                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="f-form-select" style={{ border: 'none', background: 'transparent', padding: 0, width: 'auto' }} />
                            </div>
                            <div style={{ height: '24px', width: '1px', background: '#e2e8f0' }}></div>
                            <div className="f-text-muted" style={{ fontWeight: 850, fontSize: '0.85rem' }}>
                                <FaUsers /> {selectedSection.subject || 'All Subjects'}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button onClick={() => markAll('Present')} className="f-node-btn secondary" style={{ fontSize: '0.7rem' }}>MARK ALL PRESENT</button>
                            <button onClick={() => markAll('Absent')} className="f-node-btn secondary" style={{ fontSize: '0.7rem' }}>MARK ALL ABSENT</button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="f-node-card f-center-empty">
                            <div className="spinner"></div>
                            <p style={{ marginTop: '1rem', fontWeight: 850 }}>Syncing Roster...</p>
                        </div>
                    ) : (
                        <div className="f-roster-wrap animate-slide-up" style={{ marginTop: '2rem' }}>
                            <div className="f-roster-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1rem' }}>
                                {students.map((student, index) => {
                                    const isAbsent = attendance[student.sid || student.id] === 'Absent';
                                    return (
                                        <div
                                            key={student.sid || student.id}
                                            className={`f-node-card f-flex-gap ${isAbsent ? 'absent-node' : 'present-node'}`}
                                            style={{
                                                padding: '1.25rem',
                                                cursor: 'pointer',
                                                borderLeft: `6px solid ${isAbsent ? '#ef4444' : '#10b981'}`,
                                                transition: 'all 0.2s',
                                                background: isAbsent ? 'rgba(239, 68, 68, 0.02)' : 'rgba(16, 185, 129, 0.02)'
                                            }}
                                            onClick={() => handleStatusChange(student.sid || student.id, isAbsent ? 'Present' : 'Absent')}
                                        >
                                            <div className="f-student-index" style={{
                                                width: '32px', height: '32px', borderRadius: '10px',
                                                background: isAbsent ? '#fee2e2' : '#dcfce7',
                                                color: isAbsent ? '#ef4444' : '#10b981',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 950, fontSize: '0.8rem'
                                            }}>
                                                {index + 1}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 950, color: '#1e293b', fontSize: '1rem' }}>{student.studentName || student.name}</div>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>ID: {student.sid || student.id}</div>
                                            </div>
                                            <div style={{
                                                padding: '0.4rem 0.8rem', borderRadius: '8px',
                                                background: isAbsent ? '#ef4444' : '#10b981',
                                                color: 'white', fontWeight: 950, fontSize: '0.65rem'
                                            }}>
                                                {isAbsent ? 'ABSENT' : 'PRESENT'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {students.length === 0 && (
                                <div className="f-node-card f-center-empty">
                                    <h3 style={{ color: '#94a3b8', margin: 0 }}>NO REGISTERED STUDENTS</h3>
                                    <p style={{ marginTop: '0.5rem', opacity: 0.6 }}>Verify the section filters or year assignment.</p>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="f-submit-footer animate-slide-up" style={{ marginTop: '3rem', position: 'sticky', bottom: '2rem', zIndex: 100, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(10px)', padding: '1.5rem', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="f-flex-gap f-text-muted">
                            <FaCheckCircle style={{ color: '#10b981', fontSize: '1.5rem' }} />
                            <div>
                                <div style={{ fontWeight: 950, color: '#1e293b', lineHeight: 1 }}>Roster Synchronized</div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 850, marginTop: '0.4rem' }}>{date} • {selectedSection.subject || 'Standard Session'}</div>
                            </div>
                        </div>
                        <button
                            className="nexus-btn-primary"
                            onClick={handleSubmit}
                            disabled={saving || students.length === 0}
                            style={{ padding: '1rem 2.5rem' }}
                        >
                            {saving ? 'PROCESSING...' : <><FaSave /> COMMIT ATTENDANCE</>}
                        </button>
                    </div>
                </>
            ) : (
                <div className="history-view animate-fade-in">
                    <div className="f-history-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                        {history.map(record => {
                            const p = record.records.filter(r => r.status === 'Present').length;
                            const t = record.records.length;
                            const pct = t > 0 ? Math.round((p / t) * 100) : 0;
                            return (
                                <motion.div
                                    whileHover={{ y: -5 }}
                                    key={record._id || record.id}
                                    className="f-node-card"
                                    style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 950, color: '#1e293b', fontSize: '1.1rem' }}>{new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 900, marginTop: '0.4rem', textTransform: 'uppercase' }}>
                                            Section {record.section} • {record.subject}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            fontWeight: 950,
                                            color: pct > 80 ? '#10b981' : pct > 60 ? '#f59e0b' : '#ef4444',
                                            fontSize: '1.2rem'
                                        }}>{pct}%</div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 900 }}>{p}/{t} PRESENT</div>
                                    </div>
                                </motion.div>
                            )
                        })}
                        {history.length === 0 && (
                            <div className="f-node-card f-center-empty" style={{ gridColumn: '1/-1', opacity: 0.6 }}>
                                <FaHistory size={48} style={{ marginBottom: '1.5rem' }} />
                                <p style={{ fontWeight: 850 }}>No historical records found for this section.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FacultyAttendanceManager;
