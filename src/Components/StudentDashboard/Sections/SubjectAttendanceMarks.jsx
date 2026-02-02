import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBolt, FaCalculator, FaCalendarCheck, FaChartBar, FaHistory, FaRobot } from 'react-icons/fa';
import { apiGet } from '../../../utils/apiClient';
import './SubjectAttendanceMarks.css';

/**
 * NEXUS SUBJECT INTEL (Detailed Performance)
 * Completely redesigned for detailed attendance and marks breakdown.
 */
const SubjectAttendanceMarks = ({ studentId, overviewData, enrolledSubjects, setView, openAiWithPrompt }) => {
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [subjectData, setSubjectData] = useState([]);
    const [attendanceHistory, setAttendanceHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        if (selectedSubject) {
            const fetchHistory = async () => {
                setLoadingHistory(true);
                try {
                    const data = await apiGet(`/api/students/${studentId}/attendance`);
                    if (Array.isArray(data)) {
                        // Filter for this subject and take last 5
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

        // 1. Initialize from Enrolled Subjects
        if (Array.isArray(enrolledSubjects)) {
            enrolledSubjects.forEach(sub => {
                subjectMap.set(sub.name, {
                    code: sub.code || sub.name.substring(0, 5).toUpperCase(),
                    name: sub.name,
                    attendance: { total: 0, present: 0, absent: 0, percentage: 0 },
                    marks: { average: 0, percentage: 0, categorized: { cla: {}, module1: {}, module2: {} } }
                });
            });
        }

        // 2. Merge with Live Data
        const allKeys = new Set([...subjectMap.keys(), ...Object.keys(attDetails), ...Object.keys(acaDetails)]);
        allKeys.forEach(key => {
            const existing = subjectMap.get(key) || {
                code: key.substring(0, 5).toUpperCase(),
                name: key,
                attendance: { total: 0, present: 0, absent: 0, percentage: 0 },
                marks: { average: 0, percentage: 0, categorized: { cla: {}, module1: {}, module2: {} } }
            };

            // Attendance Integration
            if (attDetails[key]) {
                const att = attDetails[key];
                existing.attendance = {
                    total: att.totalClasses || 0,
                    present: att.totalPresent || 0,
                    absent: att.totalAbsent || 0,
                    percentage: att.percentage || 0
                };
            }

            // Academics Integration
            if (acaDetails[key]) {
                const aca = acaDetails[key];
                existing.marks = {
                    percentage: aca.percentage || 0,
                    categorized: aca.categorized || { cla: {}, module1: {}, module2: {} }
                };

                // Calculate average of available marks
                const allMarks = [
                    ...Object.values(existing.marks.categorized.cla),
                    ...Object.values(existing.marks.categorized.module1),
                    ...Object.values(existing.marks.categorized.module2)
                ];
                existing.marks.average = allMarks.length ? (allMarks.reduce((a, b) => a + b, 0) / allMarks.length).toFixed(1) : 0;
            }

            subjectMap.set(key, existing);
        });

        setSubjectData(Array.from(subjectMap.values()));
    }, [overviewData, enrolledSubjects]);

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
                    <div className="nexus-page-subtitle">
                        <FaBolt /> NEURAL ACADEMIC PIPELINE
                    </div>
                    <h1 className="nexus-page-title">
                        ACADEMIC <span>SYNOPSIS</span>
                    </h1>
                </div>
                <div className="nexus-intel-badge">
                    <span>SEMESTER {overviewData?.student?.semester || 'CURRENT'}</span>
                    <span>LINKED TO DB</span>
                </div>
            </header>

            <div className="intel-subjects-grid">
                {subjectData.map((sub, idx) => (
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
                                <span>{sub.code}</span>
                            </div>
                            <div className={`status-orb ${sub.attendance.percentage >= 75 ? 'optimal' : 'critical'}`}></div>
                        </div>

                        <div className="intel-sections-split">
                            {/* Attendance Section */}
                            <div className="intel-sub-section attendance">
                                <div className="section-head">
                                    <FaCalendarCheck /> ATTENDANCE INTEL
                                </div>
                                <div className="att-stats-grid">
                                    <div className="stat-node">
                                        <label>TOTAL</label>
                                        <span>{sub.attendance.total}</span>
                                    </div>
                                    <div className="stat-node present">
                                        <label>PRESENT</label>
                                        <span>{sub.attendance.present}</span>
                                    </div>
                                    <div className="stat-node absent">
                                        <label>ABSENT</label>
                                        <span>{sub.attendance.absent}</span>
                                    </div>
                                    <div className="stat-node percent">
                                        <label>AVG %</label>
                                        <span>{sub.attendance.percentage}%</span>
                                    </div>
                                </div>
                                <div className="intel-progress-mini">
                                    <div className="progress-track">
                                        <div
                                            className={`progress-fill ${sub.attendance.percentage >= 75 ? 'good' : 'bad'}`}
                                            style={{ width: `${sub.attendance.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>

                            {/* Marks Section */}
                            <div className="intel-sub-section marks">
                                <div className="section-head">
                                    <FaChartBar /> MASTERY INTEL
                                </div>

                                <div className="detailed-marks-v3">
                                    {renderMarksRow('CLA MARKS', sub.marks.categorized.cla, 20, 'cla')}
                                    {renderMarksRow('MOD-1 (T1-4)', sub.marks.categorized.module1, 10, 'm1t')}
                                    {renderMarksRow('MOD-2 (T1-4)', sub.marks.categorized.module2, 10, 'm2t')}
                                </div>

                                <div className="marks-footer-stats">
                                    <div className="f-stat">
                                        <label>AVERAGE SCORE</label>
                                        <span>{sub.marks.average}</span>
                                    </div>
                                    <div className="f-stat highlight">
                                        <label>OVERALL %</label>
                                        <span>{sub.marks.percentage}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card-actions-row">
                            <button className="intel-btn primary" onClick={() => {
                                const prompt = `Analyze my performance in ${sub.name}. Attendance: ${sub.attendance.percentage}%, Marks: ${sub.marks.percentage}%. Give me a study plan.`;
                                openAiWithPrompt(prompt);
                            }}>
                                <FaRobot /> AI COUNSELOR
                            </button>
                            <button className="intel-btn secondary" onClick={() => setSelectedSubject(sub)}>
                                <FaCalculator /> DETAILED REPORT
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Detailed Modal for deep dive */}
            <AnimatePresence>
                {selectedSubject && (
                    <motion.div
                        className="intel-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedSubject(null)}
                    >
                        <motion.div
                            className="intel-modal-window"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <header>
                                <h2>{selectedSubject.name}</h2>
                                <button onClick={() => setSelectedSubject(null)}>×</button>
                            </header>
                            <div className="modal-content">
                                <div className="ai-forecast-card">
                                    <h4><FaBolt /> NEURAL PERFORMANCE FORECAST</h4>
                                    <p>Based on your current attendance of <strong>{selectedSubject.attendance.percentage}%</strong> and average score of <strong>{selectedSubject.marks.average}</strong>, your projected final grade is <strong>{selectedSubject.marks.percentage >= 80 ? 'A+' : 'A'}</strong>.</p>
                                    <div className="forecast-actions">
                                        <button className="forecast-btn">Analyze Exam Readiness</button>
                                        <button className="forecast-btn outline">Identify Weak Units</button>
                                    </div>
                                </div>
                                <div className="detailed-metrics-grid">
                                    <div className="metric-box">
                                        <label>Session Stability</label>
                                        <div className="val">{selectedSubject.attendance.percentage >= 85 ? 'Highly Stable' : selectedSubject.attendance.percentage >= 75 ? 'Optimal' : 'Critical'}</div>
                                    </div>
                                    <div className="metric-box">
                                        <label>Academic Standing</label>
                                        <div className="val">{selectedSubject.marks.percentage >= 80 ? 'Mastery' : selectedSubject.marks.percentage >= 50 ? 'Proficient' : 'Improving'}</div>
                                    </div>
                                    <div className="metric-box">
                                        <label>Concept Mastery</label>
                                        <div className="val">{selectedSubject.marks.percentage}%</div>
                                    </div>
                                </div>

                                <div className="history-timeline">
                                    <h4><FaHistory /> RECENT ATTENDANCE LOG</h4>
                                    {loadingHistory ? (
                                        <div className="mini-spinner"></div>
                                    ) : attendanceHistory.length > 0 ? (
                                        <div className="timeline-items">
                                            {attendanceHistory.map((item, i) => (
                                                <div key={i} className="timeline-item">
                                                    <span className="t-date">{item.date}</span>
                                                    <span className={`t-status ${item.status.toLowerCase()}`}>{item.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="no-data">No recent logs found.</p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SubjectAttendanceMarks;

