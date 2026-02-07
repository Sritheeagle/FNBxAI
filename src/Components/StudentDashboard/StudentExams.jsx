import React, { useState, useEffect } from 'react';
import { FaClock, FaListAlt, FaArrowLeft, FaRocket, FaShieldAlt, FaHistory, FaChevronRight, FaChalkboardTeacher } from 'react-icons/fa';
import { apiGet, apiPost } from '../../utils/apiClient';
import ProfessionalEmptyState from './Sections/ProfessionalEmptyState';
import './StudentExams.css';

/**
 * EXAM DASHBOARD (Student Exams)
 * A premium interface for exams, quizzes, and academic assessments.
 */
const StudentExams = ({ studentData, preloadedData, assignedFaculty = [] }) => {
    const [view, setView] = useState('list'); // 'list', 'taking', 'result', 'history'
    const [exams, setExams] = useState([]);
    const [results, setResults] = useState([]);
    const [currentExam, setCurrentExam] = useState(null);
    const [userAnswers, setUserAnswers] = useState({});
    const [examResult, setExamResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);

    const { branch = 'CSE', year = '1', section = 'A', sid = '' } = studentData || {};

    const fetchExams = async () => {
        setLoading(true);
        try {
            const qs = new URLSearchParams({ branch, year, section: section || '' });
            const data = await apiGet(`/api/exams/student?${qs.toString()}`);
            if (data) setExams(data);
        } catch (error) {
            console.error("Exam Sync Failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const data = await apiGet(`/api/exams/results/student/${sid}`);
            if (data) setResults(data);
        } catch (error) {
            console.error("History Sync Failed:", error);
        } finally {
            setLoading(false);
        }
    };

    const startExam = async (exam) => {
        setCurrentExam(exam);
        setUserAnswers({});
        setTimeLeft(exam.durationMinutes * 60);
        setView('taking');

        // Notify Sentinel
        try {
            await apiPost('/api/exams/monitor', { event: 'start', examId: exam._id, studentId: sid });
        } catch (e) {
            console.warn("Sentinel Monitor failed to init", e);
        }
    };

    // Sentinel Integrity Monitor (Tab Switch Detection)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden && view === 'taking' && currentExam) {
                apiPost('/api/exams/monitor', {
                    event: 'flag',
                    examId: currentExam._id,
                    studentId: sid,
                    details: 'Tab Switch / Background Violation'
                }).catch(e => console.warn("Flag failed", e));
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [view, currentExam, sid]);

    const handleAnswer = (qIndex, optionIndex) => {
        setUserAnswers(prev => ({ ...prev, [qIndex]: optionIndex }));
    };

    const submitExam = async () => {
        if (!currentExam) return;
        const answersArray = currentExam.questions.map((_, i) =>
            userAnswers[i] !== undefined ? userAnswers[i] : null
        );
        try {
            const result = await apiPost('/api/exams/submit', {
                studentId: sid,
                examId: currentExam._id,
                answers: answersArray
            });
            setExamResult(result);
            setView('result');
        } catch (error) {
            console.error("Exam Submission Failed:", error);
        }
    };

    useEffect(() => {
        if (view === 'list') {
            if (preloadedData) {
                setExams(preloadedData);
                setLoading(false);
            } else {
                fetchExams();
            }
        }
        if (view === 'history') fetchHistory();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, preloadedData]);

    useEffect(() => {
        let timer;
        if (view === 'taking' && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        submitExam();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [view, timeLeft]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (!studentData) {
        return (
            <div className="loading-container">
                <div className="nexus-loading-ring"></div>
                <p className="loading-text">LOADING STUDENT DATA...</p>
            </div>
        );
    }

    // --- TAKING EXAM VIEW ---
    if (view === 'taking' && currentExam) {
        return (
            <div className="nexus-exam-taking-env animate-fade-in">
                <div className="exam-sticky-header">
                    <div className="header-left">
                        <div className="exam-id-badge">ACTIVE EXAM</div>
                        <h2>{currentExam.title} <span className="subject-pipe">{currentExam.subject}</span></h2>
                    </div>
                    <div className="header-center">
                        <div className={`nexus-timer ${timeLeft < 60 ? 'critical' : ''}`}>
                            <FaClock /> {formatTime(timeLeft)}
                        </div>
                    </div>
                    <div className="header-right">
                        <button onClick={submitExam} className="nexus-btn-finish">SUBMIT EXAM <FaRocket /></button>
                    </div>
                </div>

                <div className="exam-questions-viewport">
                    {currentExam.questions.map((q, i) => (
                        <div key={i} className="nexus-q-card">
                            <div className="q-label">QUESTION {i + 1} <span className="q-marks">[{q.marks} Marks]</span></div>
                            <h4 className="q-text">{q.questionText}</h4>
                            <div className="options-matrix">
                                {q.options.map((opt, optIdx) => (
                                    <label key={optIdx} className={`option-item ${userAnswers[i] === optIdx ? 'selected' : ''}`}>
                                        <input type="radio" name={`q-${i}`} checked={userAnswers[i] === optIdx} onChange={() => handleAnswer(i, optIdx)} />
                                        <div className="opt-marker">{String.fromCharCode(65 + optIdx)}</div>
                                        <span className="opt-text">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button onClick={submitExam} className="nexus-mega-submit">SUBMIT EXAM</button>
                </div>
            </div>
        );
    }

    // --- RESULT VIEW ---
    if (view === 'result' && examResult) {
        const percentage = Math.round((examResult.score / examResult.totalMarks) * 100);
        return (
            <div className="nexus-result-center animate-fade-in">
                <div className="nexus-result-card">
                    <div className="nexus-stamp">
                        {percentage >= 75 ? '🎖️' : percentage >= 40 ? '✅' : '📉'}
                    </div>
                    <h2 className="result-title">EXAM COMPLETE</h2>
                    <p className="result-desc">Student assessment complete. Your results have been saved to the database.</p>

                    <div className="result-stats-grid">
                        <div className="res-stat-card">
                            <div className="val">{examResult.score} / {examResult.totalMarks}</div>
                            <div className="lab">SCORE</div>
                        </div>
                        <div className="res-stat-card">
                            <div className={`val highlight-big ${percentage >= 40 ? 'rating pass' : 'rating fail'}`}>{percentage}%</div>
                            <div className="lab">PERCENTAGE</div>
                        </div>
                    </div>

                    <div className="result-actions">
                        <button onClick={() => setView('list')} className="nexus-btn-pri">BACK TO LIST</button>
                        <button onClick={() => setView('history')} className="nexus-btn-sec">EXAM HISTORY</button>
                    </div>
                </div>
            </div>
        );
    }

    // --- HISTORY VIEW ---
    if (view === 'history') {
        return (
            <div className="nexus-assessment-history animate-fade-in">
                <div className="history-header">
                    <button onClick={() => setView('list')} className="nexus-back-btn"><FaArrowLeft /></button>
                    <h1 className="history-title">EXAM <span>HISTORY</span></h1>
                </div>

                {loading ? <div className="nexus-loading-ring"></div> : (
                    <div className="nexus-history-list">
                        {results.length === 0 ? <p className="empty-msg">No exam records found.</p> : results.map((res) => (
                            <div key={res._id} className="nexus-history-card">
                                <div className="card-left">
                                    <div className="subject-dot"></div>
                                    <div className="info">
                                        <h4>{res.examId?.title || 'Unknown Exam'}</h4>
                                        <span className="info-sub">{new Date(res.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} • {res.examId?.subject}</span>
                                    </div>
                                </div>
                                <div className="card-right">
                                    <div className="score">{res.score} / {res.totalMarks}</div>
                                    <div className={`rating ${res.score / res.totalMarks >= 0.4 ? 'pass' : 'fail'}`}>
                                        {Math.round((res.score / res.totalMarks) * 100)}% SCORE
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // --- DEFAULT LIST VIEW ---
    return (
        <div className="nexus-exams-list animate-fade-in">
            <div className="nexus-exams-header">
                <div>
                    <div className="nexus-journal-subtitle">
                        <FaShieldAlt /> Academic Assessments <div className="pulse-dot"></div>
                    </div>
                    <h1 className="nexus-journal-title">
                        AVAILABLE <span>EXAMS</span>
                    </h1>
                </div>
                <div className="header-actions">
                    <button onClick={fetchExams} className="nexus-history-trigger">
                        <FaClock /> REFRESH
                    </button>
                    <button onClick={() => setView('history')} className="nexus-history-trigger">
                        <FaHistory /> EXAM HISTORY
                    </button>
                </div>
            </div>

            {loading ? <div className="nexus-loading-ring"></div> : (
                <div className="nexus-challenges-grid">
                    {exams.length === 0 ? (
                        <div style={{ padding: '2rem' }}>
                            <ProfessionalEmptyState
                                title="NO ACTIVE EXAMS"
                                description={`The examination portal is currently clear for your branch (${branch}). No active challenges or quizzes were detected in the uplink.`}
                                icon={<FaRocket />}
                                theme="sentinel"
                            />
                            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                                <button onClick={fetchExams} className="nexus-btn-pri-mini">REFRESH PIPELINE</button>
                            </div>
                        </div>
                    ) : (
                        <div className="nexus-notes-grid">
                            {exams.map((exam, idx) => (
                                <div key={exam._id} className="challenge-node-card sentinel-floating" style={{ animationDelay: `${idx * -1.5}s`, position: 'relative', overflow: 'hidden' }}>
                                    <div className="sentinel-scanner" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--v-primary)', opacity: 0.2 }}></div>
                                    <div className="node-accent"></div>
                                    <div className="node-head">
                                        <span className="subject-tag">{exam.subject.toUpperCase()}</span>
                                        {(() => {
                                            const fac = assignedFaculty.find(f => f._id === exam.facultyId || f.facultyId === exam.facultyId);
                                            return fac ? (
                                                <span className="week-tag" style={{ background: '#eef2ff', color: '#4f46e5', border: 'none' }}>
                                                    <FaChalkboardTeacher /> {fac.name}
                                                </span>
                                            ) : null;
                                        })()}
                                        <span className="week-tag">{exam.week || 'CORE ASSESSMENT'}</span>
                                    </div>
                                    <h3 className="node-title">{exam.title}</h3>
                                    <div className="node-metrics">
                                        <div className="node-metric-item"><FaListAlt /> {exam.questions.length} DATA NODES</div>
                                        <div className="node-metric-item"><FaClock /> {exam.durationMinutes} MINUTES</div>
                                    </div>
                                    <button onClick={() => startExam(exam)} className="node-launch-btn">
                                        INITIALIZE UPLINK <FaChevronRight />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentExams;
