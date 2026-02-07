import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBolt, FaCalculator, FaCalendarCheck, FaChartBar, FaHistory, FaRobot, FaChalkboardTeacher } from 'react-icons/fa';
import { apiGet, apiPost } from '../../../utils/apiClient';
import sseClient from '../../../utils/sseClient';
import './SubjectAttendanceMarks.css';
import ProfessionalEmptyState from './ProfessionalEmptyState';
import StudentDailyAttendance from './StudentDailyAttendance';

/**
 * NEXUS SUBJECT INTEL (Detailed Performance)
 * Completely redesigned for detailed attendance and marks breakdown.
 */
const SubjectAttendanceMarks = ({ studentId, overviewData, enrolledSubjects, setView, openAiWithPrompt, assignedFaculty = [] }) => {
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [subjectData, setSubjectData] = useState([]);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [dailyReport, setDailyReport] = useState(null);
    const [showOtpInput, setShowOtpInput] = useState(false);
    const [otpCode, setOtpCode] = useState(['', '', '', '']);
    const [otpSubject, setOtpSubject] = useState(null);

    useEffect(() => {
        const fetchDaily = async () => {
            try {
                const data = await apiGet(`/api/students/${studentId}/attendance`);
                if (Array.isArray(data)) {
                    const today = new Date().toISOString().split('T')[0];
                    const todaysRecords = data.filter(r => r.date === today);

                    if (todaysRecords.length > 0) {
                        const presentCount = todaysRecords.filter(r => r.status === 'Present').length;
                        const total = todaysRecords.length;
                        setDailyReport({
                            status: presentCount === total ? 'Regular' : presentCount > 0 ? 'Irregular' : 'Absent',
                            details: `${presentCount}/${total} Sessions`,
                            raw: todaysRecords
                        });
                    } else {
                        setDailyReport({ status: 'Pending', details: 'No Sessions Yet', raw: [] });
                    }
                }
            } catch (e) { console.error(e); }
        };

        fetchDaily();

        const unsub = sseClient.onUpdate((ev) => {
            if (ev.resource === 'attendance' && (ev.studentId === studentId || ev.metadata?.studentId === studentId)) {
                fetchDaily();
            }
        });

        return () => unsub();
    }, [studentId]);

    useEffect(() => {
        if (selectedSubject) {
            const fetchHistory = async () => {
                setLoadingHistory(true);
                try {
                    const data = await apiGet(`/api/students/${studentId}/attendance`);
                    if (Array.isArray(data)) {
                        const filtered = data.filter(a => a.subject === selectedSubject.name).slice(0, 5);
                        setAttendanceHistory(filtered);
                    }
                } catch (e) {
                    console.error("Failed to fetch history", e);
                } finally {
                    setLoadingHistory(false);
                }
            };
            fetchHistory();
        } else {
            setAttendanceHistory([]);
        }
    }, [selectedSubject, studentId]);

    useEffect(() => {
        const attDetails = overviewData.attendance?.details || {};
        const acaDetails = overviewData.academics?.details || {};
        const subjectMap = new Map();

        if (Array.isArray(enrolledSubjects)) {
            enrolledSubjects.forEach(sub => {
                subjectMap.set(sub.name, {
                    code: sub.code || sub.name.substring(0, 5).toUpperCase(),
                    name: sub.name,
                    attendance: { total: 0, present: 0, absent: 0, percentage: 0 },
                    marks: { average: 0, percentage: 0, categorized: { cla: {}, module1: {}, module2: {} } },
                    faculty: null
                });
            });
        }

        const allKeys = new Set([...subjectMap.keys(), ...Object.keys(attDetails), ...Object.keys(acaDetails)]);
        allKeys.forEach(key => {
            const existing = subjectMap.get(key) || {
                code: key.substring(0, 5).toUpperCase(),
                name: key,
                attendance: { total: 0, present: 0, absent: 0, percentage: 0 },
                marks: { average: 0, percentage: 0, categorized: { cla: {}, module1: {}, module2: {} } }
            };

            if (attDetails[key]) {
                const att = attDetails[key];
                existing.attendance = {
                    total: att.totalClasses || 0,
                    present: att.totalPresent || 0,
                    absent: att.totalAbsent || 0,
                    percentage: att.percentage || 0
                };
            }

            if (acaDetails[key]) {
                const aca = acaDetails[key];
                existing.marks = {
                    percentage: aca.percentage || 0,
                    categorized: aca.categorized || { cla: {}, module1: {}, module2: {} }
                };

                const allMarks = [
                    ...Object.values(existing.marks.categorized.cla),
                    ...Object.values(existing.marks.categorized.module1),
                    ...Object.values(existing.marks.categorized.module2)
                ];
                existing.marks.average = allMarks.length ? (allMarks.reduce((a, b) => a + b, 0) / allMarks.length).toFixed(1) : 0;
            }

            if (assignedFaculty && assignedFaculty.length > 0) {
                const sName = String(existing.name || '').trim().toUpperCase();
                const sCode = String(existing.code || '').trim().toUpperCase();

                const match = assignedFaculty.find(f =>
                    (f.assignments || []).some(a => {
                        const aSub = String(a.subject || '').trim().toUpperCase();
                        return aSub === sName || aSub === sCode || sName.includes(aSub) || aSub.includes(sName);
                    })
                );

                if (match) existing.faculty = match.name;
            }

            subjectMap.set(key, existing);
        });

        setSubjectData(Array.from(subjectMap.values()));
    }, [overviewData, enrolledSubjects, assignedFaculty]);

    const renderMarksRow = (title, data, max, prefix) => (
        <div className="marks-breakdown-row">
            <div className="row-label">{title}</div>
            <div className="marks-pill-container">
                {[1, 2, 3, 4, 5].map(num => {
                    if (title === 'MODULES' && num === 5) return null;
                    const key = `${prefix}${num}`;
                    const val = data[key];
                    return (
                        <div key={key} className={`mark-pill ${val !== undefined ? 'active' : 'empty'}`}>
                            <span className="p-label">{prefix.toUpperCase()}{num}</span>
                            <span className="p-val">{val !== undefined ? val : '-'}</span>
                            <small>/{max}</small>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="nexus-intel-dashboard fade-in">
            <header className="nexus-page-header">
                <div>
                    <div className="nexus-page-subtitle"><FaBolt /> NEURAL ACADEMIC PIPELINE</div>
                    <h1 className="nexus-page-title">ACADEMIC <span>SYNOPSIS</span></h1>
                </div>
                {dailyReport && (
                    <div className="nexus-intel-badge" style={{
                        background: dailyReport.status === 'Regular' ? '#dcfce7' : dailyReport.status === 'Pending' ? '#ffedd5' : '#fee2e2',
                        color: dailyReport.status === 'Regular' ? '#166534' : dailyReport.status === 'Pending' ? '#9a3412' : '#b91c1c',
                        border: '1px solid currentColor'
                    }}>
                        <span>TODAY: {dailyReport.status.toUpperCase()}</span>
                        <span>{dailyReport.details}</span>
                    </div>
                )}
            </header>

            <div className="intel-subjects-grid">
                {subjectData.length > 0 ? subjectData.map((sub, idx) => (
                    <motion.div
                        key={sub.code}
                        className="subject-intel-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                    >
                        <div className="subject-header">
                            <div className="sub-title">
                                <h3>{sub.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{sub.code}</span>
                                    {sub.faculty && (
                                        <span style={{ fontSize: '0.85rem', color: '#4f46e5', display: 'flex', alignItems: 'center', gap: '5px', background: '#eef2ff', padding: '2px 8px', borderRadius: '12px', fontWeight: 500 }}>
                                            <FaChalkboardTeacher /> {sub.faculty}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className={`status-orb ${sub.attendance.percentage >= 75 ? 'optimal' : 'critical'}`}></div>
                        </div>

                        <div className="intel-sections-split">
                            <div className="intel-sub-section attendance">
                                <div className="section-head"><FaCalendarCheck /> ATTENDANCE INTEL</div>
                                <div className="att-stats-grid">
                                    <div className="stat-node"><label>TOTAL</label><span>{sub.attendance.total}</span></div>
                                    <div className="stat-node present"><label>PRESENT</label><span>{sub.attendance.present}</span></div>
                                    <div className="stat-node absent"><label>ABSENT</label><span>{sub.attendance.absent}</span></div>
                                    <div className="stat-node percent"><label>AVG %</label><span>{sub.attendance.percentage}%</span></div>
                                </div>
                                <div className="intel-progress-mini">
                                    <div className="progress-track">
                                        <div className={`progress-fill ${sub.attendance.percentage >= 75 ? 'good' : 'bad'}`} style={{ width: `${sub.attendance.percentage}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="intel-sub-section marks">
                                <div className="section-head"><FaChartBar /> MASTERY INTEL</div>
                                <div className="detailed-marks-v3">
                                    {renderMarksRow('CLA MARKS', sub.marks.categorized.cla, 20, 'cla')}
                                    {renderMarksRow('MOD-1 (T1-4)', sub.marks.categorized.module1, 10, 'm1t')}
                                    {renderMarksRow('MOD-2 (T1-4)', sub.marks.categorized.module2, 10, 'm2t')}
                                </div>
                                <div className="marks-footer-stats">
                                    <div className="f-stat"><label>AVERAGE SCORE</label><span>{sub.marks.average}</span></div>
                                    <div className="f-stat highlight"><label>OVERALL %</label><span>{sub.marks.percentage}%</span></div>
                                </div>
                            </div>
                        </div>

                        <div className="card-actions-row">
                            <button className="intel-btn primary" onClick={() => openAiWithPrompt(`Analyze my performance in ${sub.name}. Attendance: ${sub.attendance.percentage}%, Marks: ${sub.marks.percentage}%.`)}><FaRobot /> AI COUNSELOR</button>
                            <button className="intel-btn secondary" onClick={() => setSelectedSubject(sub)}><FaCalculator /> DETAILED REPORT</button>
                            <button className="intel-btn accent" onClick={() => { setOtpSubject(sub); setShowOtpInput(true); }} style={{ background: '#fff7ed', color: '#ea580c' }}><FaBolt /> MARK ATTENDANCE</button>
                        </div>
                    </motion.div>
                )) : (
                    <div style={{ gridColumn: '1 / -1', marginTop: '2rem' }}>
                        <ProfessionalEmptyState
                            title="NO SUBJECTS ENROLLED"
                            description="Deep scan complete. We couldn't find any subjects mapped to your profile for this semester. Contact admin to verify your curriculum sync."
                            icon={<FaBolt />}
                            theme="warning"
                        />
                    </div>
                )}
            </div>

            <AnimatePresence>
                {selectedSubject && (
                    <motion.div className="intel-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedSubject(null)}>
                        <motion.div className="intel-modal-window" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                            <header><h2>{selectedSubject.name}</h2><button onClick={() => setSelectedSubject(null)}>×</button></header>
                            <div className="modal-content">
                                <div className="ai-forecast-card">
                                    <h4><FaBolt /> NEURAL PERFORMANCE FORECAST</h4>
                                    <p>Based on your current attendance of <strong>{selectedSubject.attendance.percentage}%</strong> and average score of <strong>{selectedSubject.marks.average}</strong>, your projected final grade is <strong>{selectedSubject.marks.percentage >= 80 ? 'A+' : 'A'}</strong>.</p>
                                </div>
                                <div className="history-timeline">
                                    <h4><FaHistory /> RECENT ATTENDANCE LOG</h4>
                                    {loadingHistory ? <div className="mini-spinner"></div> : attendanceHistory.length > 0 ? (
                                        <div className="timeline-items">
                                            {attendanceHistory.map((item, i) => (
                                                <div key={i} className="timeline-item">
                                                    <span className="t-date">{item.date}</span>
                                                    <span className={`t-status ${item.status.toLowerCase()}`}>{item.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <ProfessionalEmptyState title="NO RECENT LOGS" description="Digital surveillance shows no recent attendance records." icon={<FaCalendarCheck />} theme="info" />}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* OTP Modal */}
            <AnimatePresence>
                {showOtpInput && (
                    <motion.div className="intel-modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowOtpInput(false)}>
                        <motion.div className="intel-modal-window" style={{ maxWidth: '400px', textAlign: 'center', padding: '0' }} initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
                            <div style={{ padding: '2rem', background: '#fff7ed' }}>
                                <div style={{ width: '60px', height: '60px', background: '#ffedd5', color: '#ea580c', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', margin: '0 auto 1rem' }}><FaBolt /></div>
                                <h3 style={{ margin: 0, color: '#9a3412', fontWeight: 950 }}>SESSION CHECK-IN</h3>
                                <p style={{ fontSize: '0.8rem', color: '#c2410c', marginTop: '0.5rem' }}>Enter the 4-digit code projected by your faculty for <strong>{otpSubject?.name}</strong>.</p>
                            </div>
                            <div style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
                                    {[0, 1, 2, 3].map(idx => (
                                        <input key={idx} id={`otp-${idx}`} type="text" maxLength="1" value={otpCode[idx]} onChange={(e) => {
                                            const val = e.target.value;
                                            if (!/^\d*$/.test(val)) return;
                                            const newOtp = [...otpCode];
                                            newOtp[idx] = val;
                                            setOtpCode(newOtp);
                                            if (val && idx < 3) document.getElementById(`otp-${idx + 1}`).focus();
                                        }} style={{ width: '50px', height: '60px', fontSize: '1.5rem', textAlign: 'center', border: '2px solid #e2e8f0', borderRadius: '12px', fontWeight: 900, outline: 'none' }} />
                                    ))}
                                </div>
                                <button className="nexus-btn-primary" style={{ width: '100%', padding: '1rem', background: '#ea580c' }} onClick={async () => {
                                    if (otpCode.join('').length !== 4) return alert("Enter 4-digit code");
                                    try {
                                        await apiPost('/api/attendance/otp/verify', { code: otpCode.join(''), studentId, subject: otpSubject.name });
                                        alert("Attendance Marked!");
                                        setShowOtpInput(false);
                                        setOtpCode(['', '', '', '']);
                                    } catch (e) { alert("Invalid Code"); }
                                }}>VERIFY PRESENCE</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            <StudentDailyAttendance studentId={studentId} />
        </div>
    );
};

export default SubjectAttendanceMarks;
