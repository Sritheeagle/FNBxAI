import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './FacultyDashboard.css';
import { FaCalendarAlt, FaCheckCircle, FaSave, FaUserCheck, FaHistory, FaFilter, FaUsers, FaExclamationTriangle, FaShieldAlt, FaArrowLeft, FaTimes, FaClipboardList, FaKey } from 'react-icons/fa';
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
    const [selectedPeriod, setSelectedPeriod] = useState(1);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [history, setHistory] = useState([]);
    const [viewMode, setViewMode] = useState('take');
    const [previousAbsentees, setPreviousAbsentees] = useState([]);

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
                let sectionStr = String(assignment.section || assignment.Section || assignment.classSection || 'A');
                if (sectionStr === 'UNDEFINED' || sectionStr === 'NULL' || sectionStr === '') sectionStr = 'A';

                const subject = assignment.subject || assignment.Subject || data.subject || 'General';

                const sectionsList = sectionStr.split(',').map(s => s.trim().toUpperCase());

                const branch = assignment.branch || assignment.Branch || data.department || data.Department || 'CSE';

                sectionsList.forEach(section => {
                    if (year && section) {
                        const key = `${year}-${section}-${subject}-${branch}`;
                        if (!sectionsMap.has(key)) {
                            sectionsMap.set(key, { year, section, subject, branch });
                        }
                    }
                });
            });
            const sections = Array.from(sectionsMap.values());
            if (sections.length > 0) {
                console.log('✅ Sections from assignments:', sections);
                return sections;
            }
        }

        // Method 2: Check sections array
        if (data.sections && Array.isArray(data.sections) && data.sections.length > 0) {
            const sections = [];
            data.sections.forEach(s => {
                const year = String(s.year || s.Year);
                const sectionStr = String(s.section || s.Section || 'A');
                sectionStr.split(',').forEach(subSec => {
                    sections.push({
                        year,
                        section: subSec.trim().toUpperCase()
                    });
                });
            });
            return sections;
        }

        // Method 3: Check direct fields
        if (data.year) {
            const year = String(data.year);
            const sectionStr = String(data.section || 'A');
            return sectionStr.split(',').map(s => ({
                year,
                section: s.trim().toUpperCase()
            }));
        }

        console.error('❌ NO SECTIONS FOUND for attendance');
        return [];
    };

    const fetchStudentsAndAttendance = useCallback(async () => {
        setLoading(true);
        try {
            const allStudents = await apiGet(`/api/faculty-stats/${facultyData.facultyId}/students`);
            console.log('Fetched students for attendance:', allStudents);

            // Filter by selected section (including branch)
            const filteredStudents = allStudents.filter(s => {
                const studentYear = String(s.year || s.Year);
                const studentSection = String(s.section || s.Section).toUpperCase().trim();
                const studentBranch = String(s.branch || s.Branch || '').toUpperCase().trim();
                const targetBranch = String(selectedSection.branch || '').toUpperCase().trim();

                // Compare as strings to avoid type mismatch
                const yearMatch = studentYear === String(selectedSection.year);
                const sectionMatch = studentSection === String(selectedSection.section).toUpperCase().trim();
                const branchMatch = !targetBranch || targetBranch === 'ALL' || studentBranch === targetBranch;

                return yearMatch && sectionMatch && branchMatch;
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
            // Check for general 'attendance' or specific 'attendance_update'
            if (ev.resource === 'attendance' || ev.resource === 'attendance_update') {
                // If it's a specific student update matching current section
                if (ev.resource === 'attendance_update' && ev.section &&
                    ev.section.year === selectedSection.year &&
                    ev.section.section === selectedSection.section) {

                    // Optimistic Update
                    setAttendance(prev => ({
                        ...prev,
                        [ev.studentId]: ev.status
                    }));
                } else {
                    // General Refresh
                    fetchStudentsAndAttendance();
                }
            }
        });
        return unsub;
    }, [fetchStudentsAndAttendance, selectedSection]);

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

    const fetchPreviousAbsentees = useCallback(async () => {
        try {
            const branch = students[0]?.branch || 'CSE';
            const res = await apiGet(
                `/api/attendance/absentees/today?year=${selectedSection.year}&section=${selectedSection.section}&date=${date}&branch=${branch}`
            );
            setPreviousAbsentees(res || []);
        } catch (err) {
            console.error("Failed to fetch previous absentees:", err);
        }
    }, [selectedSection, date, students]);

    useEffect(() => {
        initializeSections();
    }, [facultyData, initializeSections]);

    useEffect(() => {
        if (selectedSection.year && selectedSection.section) {
            fetchStudentsAndAttendance();
            fetchHistory();
            fetchPreviousAbsentees();
        }
    }, [selectedSection, date, fetchStudentsAndAttendance, fetchHistory, fetchPreviousAbsentees]);

    const [rollCallMode, setRollCallMode] = useState(false);
    const [currentStudentIdx, setCurrentStudentIdx] = useState(0);
    const [voiceAssist] = useState(false);

    const handleStatusChange = useCallback((studentId, status) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    }, []);

    const submitRollCallStatus = useCallback((status) => {
        if (!students[currentStudentIdx]) return;
        const s = students[currentStudentIdx];
        handleStatusChange(s.sid || s.id, status);

        if (currentStudentIdx < students.length - 1) {
            setCurrentStudentIdx(prev => prev + 1);
        } else {
            setRollCallMode(false);
            alert("Sentinel Roll Call Complete. Please review and commit attendance.");
        }
    }, [students, currentStudentIdx, handleStatusChange]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!rollCallMode) return;
            if (e.key === 'ArrowRight') submitRollCallStatus('Present');
            if (e.key === 'ArrowLeft') submitRollCallStatus('Absent');
            if (e.key === 'Escape') setRollCallMode(false);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [rollCallMode, currentStudentIdx, students, submitRollCallStatus]);

    useEffect(() => {
        if (rollCallMode && voiceAssist && students[currentStudentIdx]) {
            // Cancel previous speech
            window.speechSynthesis.cancel();
            const s = students[currentStudentIdx];
            const text = s.studentName || s.name;
            const u = new SpeechSynthesisUtterance(text);
            u.rate = 1.1;
            window.speechSynthesis.speak(u);
        }

    }, [currentStudentIdx, rollCallMode, voiceAssist, students]);

    const startRollCall = () => {
        if (students.length === 0) return;
        setRollCallMode(true);
        setCurrentStudentIdx(0);
    };

    const handleSectionChange = (newSection) => {
        setSelectedSection(newSection);
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
                period: selectedPeriod,
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

    if (viewMode === 'report') {
        return <DailyReportView date={date} section={selectedSection} onBack={() => setViewMode('take')} />;
    }

    if (viewMode === 'otp') {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        // Pass full section info. 
        return <SessionOTPGenerator section={selectedSection} facultyId={user.id || user._id} onBack={() => setViewMode('take')} />;
    }

    return (
        <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className={`tab-switcher ${viewMode === 'take' ? 'left' : 'right'}`} style={{ marginBottom: '2rem' }}>
                <button
                    className={viewMode === 'take' ? 'active' : ''}
                    onClick={() => setViewMode('take')}
                >
                    <FaUserCheck /> SENTINEL ROLL CALL
                </button>
                <button
                    className={viewMode === 'history' ? 'active' : ''}
                    onClick={() => setViewMode('history')}
                >
                    <FaHistory /> HISTORY LOG
                </button>
            </div>

            {viewMode === 'take' ? (
                <>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 950, color: '#1e293b', marginBottom: '0.5rem' }}>
                        ATTENDANCE <span>MANAGER</span>
                    </h2>
                    <p className="nexus-subtitle" style={{ marginBottom: '2.5rem' }}>Update daily rosters and monitor engagement</p>

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

                        <div className="f-weekly-stats" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', background: 'transparent', padding: 0 }}>
                            <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '0s', background: 'white' }}>
                                <div className="sentinel-scanner"></div>
                                <div className="summary-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><FaUserCheck /></div>
                                <div className="value">{stats.present}</div>
                                <div className="label">PRESENT PERSONNEL</div>
                            </div>
                            <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-1.5s', background: 'white' }}>
                                <div className="sentinel-scanner"></div>
                                <div className="summary-icon-box" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}><FaTimes /></div>
                                <div className="value">{stats.absent}</div>
                                <div className="label">ABSENT NODES</div>
                            </div>
                            <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-3s', background: 'white' }}>
                                <div className="sentinel-scanner"></div>
                                <div className="summary-icon-box" style={{ background: 'rgba(79, 70, 229, 0.1)', color: '#6366f1' }}><FaShieldAlt /></div>
                                <div className="value">{stats.percentage}%</div>
                                <div className="label">PRESENCE RATE</div>
                            </div>
                            <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-4.5s', background: 'white' }}>
                                <div className="sentinel-scanner"></div>
                                <div className="summary-icon-box" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}><FaUsers /></div>
                                <div className="value">{students.length}</div>
                                <div className="label">TOTAL CAPACITY</div>
                            </div>
                        </div>
                    </div>

                    <div className="f-attendance-controls animate-slide-up" style={{ padding: '1.5rem', background: 'white', borderRadius: '20px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                            <div className="f-pill-control">
                                <FaCalendarAlt style={{ color: 'var(--accent-primary)' }} />
                                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="f-form-select" style={{ border: 'none', background: 'transparent', padding: 0, width: 'auto' }} />
                            </div>

                            <div className="f-pill-control">
                                <FaClipboardList style={{ color: 'var(--accent-primary)' }} />
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                                    className="f-form-select"
                                    style={{ border: 'none', background: 'transparent', padding: 0, width: 'auto', fontWeight: 800 }}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(h => (
                                        <option key={h} value={h}>PERIOD {h}</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => setViewMode('otp')}
                                    className="f-node-btn"
                                    style={{
                                        background: '#fff7ed',
                                        color: '#ea580c',
                                        border: '1px solid #fed7aa',
                                        padding: '0.6rem 1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <FaKey /> SESSION OTP
                                </button>
                                <button
                                    onClick={startRollCall}
                                    disabled={students.length === 0}
                                    className="f-node-btn"
                                    style={{
                                        background: students.length === 0 ? '#cbd5e1' : '#6366f1',
                                        color: 'white',
                                        border: 'none',
                                        padding: '0.6rem 1.2rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                                    }}
                                >
                                    <FaShieldAlt /> START SENTINEL MODE
                                </button>
                                <button
                                    onClick={() => setViewMode('report')}
                                    className="f-node-btn"
                                    style={{
                                        background: '#f1f5f9',
                                        color: '#475569',
                                        border: '1px solid #e2e8f0',
                                        padding: '0.6rem 1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <FaClipboardList /> DAILY REPORT
                                </button>
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

                    {/* Absentee Preview Notification */}
                    {previousAbsentees.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absentee-preview-card"
                            style={{
                                margin: '1.5rem 0',
                                padding: '1rem 1.5rem',
                                background: '#fff1f2',
                                border: '1px solid #fda4af',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '1rem'
                            }}
                        >
                            {previousAbsentees.some(p => p.studentId === (students[currentStudentIdx].sid || students[currentStudentIdx].id)) && (
                                <div style={{ background: '#fff7ed', color: '#c2410c', padding: '0.5rem 1rem', borderRadius: '12px', display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', fontWeight: 800, marginBottom: '2rem', border: '1px solid #fed7aa', marginLeft: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <FaExclamationTriangle /> PREVIOUSLY ABSENT TODAY
                                    </div>
                                    <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                                        {previousAbsentees.find(p => p.studentId === (students[currentStudentIdx].sid || students[currentStudentIdx].id))?.periods.map(per => `${per.subject} (${per.facultyName?.split(' ')[0] || 'Sys'})`).join(', ')}
                                    </div>
                                </div>
                            )}
                            <div style={{ background: '#f43f5e', padding: '0.5rem', borderRadius: '50%', color: 'white' }}>
                                <FaExclamationTriangle />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, color: '#be123c', fontSize: '0.95rem', fontWeight: 850 }}>
                                    PREVIOUSLY ABSENT TODAY ({previousAbsentees.length})
                                </h4>
                                <p style={{ margin: '0.25rem 0 0.75rem 0', fontSize: '0.8rem', color: '#881337', opacity: 0.8 }}>
                                    The following students were marked absent in earlier classes today. Verify their presence.
                                </p>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {previousAbsentees.map(stud => (
                                        <div key={stud.studentId} style={{
                                            background: 'white',
                                            padding: '0.3rem 0.8rem',
                                            borderRadius: '8px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            border: '1px solid #fecdd3',
                                            color: '#9f1239',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem'
                                        }}>
                                            <span>{stud.studentName}</span>
                                            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                                                {stud.periods.map((p, i) => (
                                                    <span key={i} title={`Marked by ${p.facultyName || 'System'}`} style={{
                                                        fontSize: '0.65rem',
                                                        background: '#ffe4e6',
                                                        padding: '0.1rem 0.4rem',
                                                        borderRadius: '4px',
                                                        cursor: 'help',
                                                        border: '1px solid #fecdd3'
                                                    }}>
                                                        {p.subject} <span style={{ opacity: 0.6, fontSize: '0.6em' }}>({p.facultyName?.split(' ')[0] || 'Sys'})</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {loading ? (
                        <div className="f-node-card f-center-empty">
                            <div className="spinner"></div>
                            <p style={{ marginTop: '1rem', fontWeight: 850 }}>Syncing Roster...</p>
                        </div>
                    ) : (
                        <div className="f-roster-wrap animate-slide-up" style={{ marginTop: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '50px 1fr 150px 80px', padding: '0 1.5rem', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.05em' }}>
                                <div>#</div>
                                <div>STUDENT</div>
                                <div>ID</div>
                                <div style={{ textAlign: 'right' }}>STATUS</div>
                            </div>
                            <div className="f-roster-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {students.map((student, index) => {
                                    const isAbsent = attendance[student.sid || student.id] === 'Absent';
                                    return (
                                        <div
                                            key={student.sid || student.id}
                                            className={`f-student-row sentinel-floating ${isAbsent ? 'row-absent' : 'row-present'}`}
                                            onClick={() => handleStatusChange(student.sid || student.id, isAbsent ? 'Present' : 'Absent')}
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '50px 1fr 150px 80px',
                                                alignItems: 'center',
                                                padding: '1rem 1.5rem',
                                                background: 'white',
                                                borderRadius: '16px',
                                                marginBottom: '0.75rem',
                                                border: isAbsent ? '1px solid #fee2e2' : '1px solid #f1f5f9',
                                                transition: 'all 0.2s cubic-bezier(0.19, 1, 0.22, 1)',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                overflow: 'hidden',
                                                animationDelay: `${index * 0.05}s`
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.005)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(0,0,0,0.05)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
                                        >
                                            <div className="sentinel-scanner"></div>
                                            {/* Status Indicator Bar */}
                                            <div style={{
                                                position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px',
                                                background: isAbsent ? '#ef4444' : '#10b981'
                                            }}></div>

                                            {/* Index */}
                                            <div style={{
                                                width: '32px', height: '32px', borderRadius: '10px',
                                                background: '#f8fafc', color: '#94a3b8',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 900, fontSize: '0.8rem'
                                            }}>
                                                {index + 1}
                                            </div>

                                            {/* Name & Risk */}
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ fontWeight: 950, color: '#1e293b', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    {student.studentName || student.name}
                                                    {/* Risk Badges */}
                                                    {student.attendanceRisk === 'critical' && (
                                                        <span style={{ fontSize: '0.6rem', background: '#fecaca', color: '#b91c1c', padding: '2px 6px', borderRadius: '6px', fontWeight: 800 }}>CRITICAL</span>
                                                    )}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, marginTop: '0.25rem' }}>
                                                    {student.attendancePct ? `${student.attendancePct}% AVG` : 'No Data'}
                                                </div>
                                            </div>

                                            {/* ID */}
                                            <div style={{ fontWeight: 850, color: '#64748b', fontSize: '0.9rem', letterSpacing: '0.5px' }}>
                                                {student.sid || student.id}
                                            </div>

                                            {/* Checkbox Graphic */}
                                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                <div style={{
                                                    width: '28px', height: '28px',
                                                    borderRadius: '8px',
                                                    border: isAbsent ? '2px solid #ef4444' : '2px solid #10b981',
                                                    background: isAbsent ? 'transparent' : '#10b981',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    transition: 'all 0.2s'
                                                }}>
                                                    {!isAbsent && <FaCheckCircle style={{ color: 'white', fontSize: '0.9rem' }} />}
                                                </div>
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
    )

    // DAILY REPORT VIEW (Sub-component rendered conditionally above if I refactored structure, but for now logic is inside return)
    // Actually, I need to handle 'report' view mode in the main return block.
    // The current return block handles viewMode === 'history' ? ... : ...
    // I need to add viewMode === 'report'.

    // Wait, the structure is: 
    // if (viewMode === 'take') { ... } else { <HistoryView /> }
    // I need to change this logic:
    // if (viewMode === 'take') ...
    // else if (viewMode === 'report') ...
    // else (history)
};

// HELPER: Daily Report Component
const DailyReportView = ({ date, section, onBack }) => {
    const [report, setReport] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, [date, section]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            // Need user context (year). Assuming year is available or passed. 
            // In FacultyAttendanceManager, 'selectedSection' holds year.
            const res = await apiGet(`/api/attendance/daily-report?date=${date}&year=${section.year || '3'}&section=${section.section || section.name || 'A'}&branch=${section.branch || 'CSE'}`);
            setReport(res || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 950, color: '#1e293b', margin: 0 }}>
                    <span style={{ color: '#6366f1' }}>DAILY MASTER LOG</span> • {date}
                </h3>
                <button onClick={onBack} className="f-node-btn secondary"><FaArrowLeft /> RETURN</button>
            </div>

            {loading ? <div className="spinner"></div> : (
                <div style={{ background: 'white', borderRadius: '24px', padding: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(5, 1fr) 1.5fr 1.5fr', padding: '1rem', borderBottom: '2px solid #f1f5f9', fontWeight: 950, color: '#94a3b8', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                        <div>STUDENT IDENTITY</div>
                        <div style={{ textAlign: 'center' }}>H1</div>
                        <div style={{ textAlign: 'center' }}>H2</div>
                        <div style={{ textAlign: 'center' }}>H3</div>
                        <div style={{ textAlign: 'center' }}>H4</div>
                        <div style={{ textAlign: 'center' }}>H5</div>
                        <div style={{ textAlign: 'center' }}>SCORE %</div>
                        <div style={{ textAlign: 'center' }}>STATUS</div>
                    </div>
                    {report.map(s => (
                        <div key={s.sid} style={{ display: 'grid', gridTemplateColumns: '2fr repeat(5, 1fr) 1.5fr 1.5fr', padding: '1.25rem 1rem', borderBottom: '1px solid #f8fafc', alignItems: 'center' }}>
                            <div style={{ fontWeight: 850, color: '#1e293b', display: 'flex', flexDirection: 'column' }}>
                                <span>{s.name}</span>
                                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{s.sid}</span>
                            </div>
                            {s.hourWise.map((h, i) => (
                                <div key={i} style={{ textAlign: 'center' }}>
                                    <span style={{
                                        display: 'inline-flex', width: '28px', height: '28px', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontWeight: 900, fontSize: '0.8rem',
                                        background: h.status === 'Present' ? '#dcfce7' : h.status === 'Absent' ? '#fee2e2' : '#f1f5f9',
                                        color: h.status === 'Present' ? '#16a34a' : h.status === 'Absent' ? '#ef4444' : '#cbd5e1'
                                    }}>
                                        {h.symbol}
                                    </span>
                                </div>
                            ))}
                            <div style={{ textAlign: 'center', fontWeight: 950, color: s.stats.percentage >= 75 ? '#16a34a' : s.stats.percentage >= 40 ? '#f59e0b' : '#ef4444' }}>
                                {s.stats.percentage}%
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <span style={{
                                    padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.7rem', fontWeight: 950, textTransform: 'uppercase',
                                    background: s.dailyStatus === 'Regular' ? '#dcfce7' : s.dailyStatus === 'Irregular' ? '#fef3c7' : '#fee2e2',
                                    color: s.dailyStatus === 'Regular' ? '#166534' : s.dailyStatus === 'Irregular' ? '#b45309' : '#991b1b'
                                }}>
                                    {s.dailyStatus}
                                </span>
                            </div>
                        </div>
                    ))}
                    {report.length === 0 && <div className="f-center-empty" style={{ padding: '4rem' }}>No data generated for this date.</div>}
                </div>
            )}
        </div>
    );
};

// HELPER: OTP Generator
const SessionOTPGenerator = ({ onBack, section, facultyId }) => {
    const [otp, setOtp] = useState('----');
    const [selectedPeriod, setSelectedPeriod] = useState(1);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [liveCount, setLiveCount] = useState(0);
    const [recentJoins, setRecentJoins] = useState([]);

    // Live Monitor
    useEffect(() => {
        const unsub = sseClient.onUpdate((ev) => {
            if (ev.resource === 'attendance_update') {
                setLiveCount(prev => prev + 1);
                const studentId = ev.studentId;
                setRecentJoins(prev => [studentId, ...prev].slice(0, 3));
            }
        });
        return unsub;
    }, []);

    useEffect(() => {
        let interval;
        if (timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && otp !== '----') {
            // Expired
            setOtp('EXPIRED');
        }
        return () => clearInterval(interval);
    }, [timeLeft, otp]);

    const generateOTP = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        setLiveCount(0);
        setRecentJoins([]);
        try {
            const payload = {
                facultyId: facultyId || 'temp_fac_id',
                year: section.year || '3',
                section: section.section || 'A',
                branch: section.branch || 'CSE',
                subject: section.subject || 'General',
                period: selectedPeriod,
                duration: 60
            };

            const res = await apiPost('/api/attendance/otp/create', payload);
            if (res && res.code) {
                setOtp(res.code);
                setTimeLeft(60);
            }
        } catch (err) {
            console.error("Failed to generate OTP:", err);
            alert("Failed to create session. Check connection.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', borderRadius: '32px', position: 'relative', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            <div className="sentinel-scanner"></div>

            <button onClick={onBack} className="f-node-btn secondary" style={{ position: 'absolute', top: '2rem', left: '2rem', zIndex: 10, width: 'auto', padding: '0 1.25rem' }}>
                <FaArrowLeft /> EXIT OTP
            </button>

            {/* Background Pulse Effect for Live Activity */}
            {liveCount > 0 && (
                <div style={{ position: 'absolute', inset: 0, opacity: 0.08, pointerEvents: 'none', background: `radial-gradient(circle, #6366f1 0%, transparent 70%)`, animation: 'sentinel-pulse 2s infinite' }}></div>
            )}

            <div style={{ textAlign: 'center', zIndex: 2 }}>
                <div style={{ position: 'relative', width: '240px', height: '240px', margin: '0 auto 1.5rem auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                    {/* Period Selector (Mini) */}
                    <div style={{ position: 'absolute', top: '-10px', background: 'white', padding: '0.25rem 0.75rem', borderRadius: '12px', border: '1px solid #e2e8f0', zIndex: 5, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 950, color: '#94a3b8' }}>ACTIVE HOUR:</span>
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(Number(e.target.value))}
                            disabled={timeLeft > 0}
                            style={{ border: 'none', background: 'transparent', fontWeight: 950, color: '#6366f1', fontSize: '0.75rem', padding: 0, outline: 'none' }}
                        >
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(h => <option key={h} value={h}>H{h}</option>)}
                        </select>
                    </div>

                    {/* SVG Progress Ring */}
                    <svg width="240" height="240" viewBox="0 0 100 100" className="otp-ring">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                        <circle
                            cx="50" cy="50" r="45"
                            fill="none"
                            stroke={timeLeft > 10 ? "#6366f1" : "#ef4444"}
                            strokeWidth="4"
                            strokeDasharray="283"
                            strokeDashoffset={283 - (timeLeft / 60) * 283}
                            className="otp-ring-circle"
                        />
                    </svg>

                    <div style={{ position: 'absolute', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 950, color: '#94a3b8', letterSpacing: '0.1em' }}>OTP TOKEN</div>
                        <div style={{
                            fontSize: '3.5rem',
                            fontWeight: 950,
                            color: timeLeft > 0 ? '#1e293b' : '#94a3b8',
                            fontFamily: 'monospace',
                            margin: '0.5rem 0'
                        }}>
                            {otp}
                        </div>
                        {timeLeft > 0 && (
                            <div style={{ fontSize: '1rem', fontWeight: 900, color: timeLeft > 10 ? '#6366f1' : '#ef4444' }}>
                                {timeLeft}s
                            </div>
                        )}
                    </div>
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 950, color: '#1e293b', margin: '0 0 0.5rem 0' }}>SESSION SECURITY VERIFICATION</h2>
                <p style={{ color: '#64748b', fontWeight: 850, fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto 2rem' }}>
                    Students must enter this tactical key in their Nexus Hub to log physical presence.
                </p>

                {/* Live Stats Pill */}
                {liveCount > 0 && (
                    <div className="animate-slide-up" style={{ marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            background: 'white',
                            color: '#10b981',
                            padding: '0.75rem 2rem',
                            borderRadius: '20px',
                            fontWeight: 900,
                            fontSize: '1rem',
                            boxShadow: '0 10px 30px rgba(16, 185, 129, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            border: '1px solid #dcfce7'
                        }}>
                            <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '50%', animation: 'pulse 1s infinite' }}></div>
                            {liveCount} NODES CONNECTED
                        </div>
                        {recentJoins.length > 0 && (
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800 }}>
                                RECENT JOIN: <span style={{ color: '#1e293b' }}>{recentJoins[0]}</span>
                            </div>
                        )}
                    </div>
                )}

                {timeLeft === 0 && (
                    <button onClick={generateOTP} disabled={isGenerating} className="nexus-btn-primary" style={{ padding: '1rem 3rem' }}>
                        {isGenerating ? 'PROTOCOL INIT...' : 'REGENERATE TOKEN'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default FacultyAttendanceManager;
