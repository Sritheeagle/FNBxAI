import React, { useState, useEffect } from 'react';
import { FaChartBar, FaUserGraduate, FaFileSignature, FaPlus, FaEdit, FaTrash, FaSave } from 'react-icons/fa';
import { apiGet, apiPost, apiDelete, apiPut } from '../../utils/apiClient';
import sseClient from '../../utils/sseClient';

/**
 * ADMIN EXAM MANAGEMENT
 * Evaluation and management of academic assessments.
 */
const AdminExams = () => {
    const [view, setView] = useState('analytics'); // 'analytics', 'manage', 'create', 'edit'
    const [results, setResults] = useState([]);
    const [exams, setExams] = useState([]);

    // Exam Form Entry State
    const [examForm, setExamForm] = useState({
        title: '',
        subject: '',
        topic: '', // Optional
        branch: 'CSE',
        year: '1',
        section: 'A',
        durationMinutes: 30,
        totalMarks: 0,
        questions: []
    });
    const [currentQuestion, setCurrentQuestion] = useState({
        questionText: '',
        options: ['', '', '', ''],
        correctOptionIndex: 0,
        marks: 1
    });

    useEffect(() => {
        if (view === 'analytics') fetchAnalytics();
        if (view === 'manage') fetchAllExams();
    }, [view]);

    useEffect(() => {
        const unsub = sseClient.onUpdate((ev) => {
            if (ev.resource === 'exams') {
                if (view === 'analytics') fetchAnalytics();
                if (view === 'manage') fetchAllExams();
            }
        });
        return unsub;
    }, [view]);

    // --- ANALYTICS ---
    const fetchAnalytics = async () => {
        try {
            const data = await apiGet('/api/exams/analytics');
            if (data) setResults(data);
        } catch (error) {
            console.error(error);
        }
    };

    // --- EXAM MANAGEMENT ---
    const fetchAllExams = async () => {
        try {
            const data = await apiGet('/api/exams/all');
            if (data) setExams(data);
        } catch (error) {
            console.error("Fetch exams failed:", error);
        }
    };

    const handleDeleteExam = async (id) => {
        if (!window.confirm("Are you sure you want to delete this exam?")) return;
        try {
            await apiDelete(`/api/exams/${id}`);
            alert("Exam deleted successfully");
        } catch (e) {
            alert("Failed to delete exam: " + e.message);
        } finally {
            fetchAllExams();
        }
    };

    const handleEditExam = (exam) => {
        setExamForm({
            ...exam,
            id: exam._id
        });
        setView('edit');
    };

    // --- FORM HANDLING ---
    const addQuestion = () => {
        if (!currentQuestion.questionText) return alert("Question text required");
        setExamForm(prev => ({
            ...prev,
            questions: [...prev.questions, currentQuestion],
            totalMarks: prev.totalMarks + Number(currentQuestion.marks)
        }));
        setCurrentQuestion({
            questionText: '',
            options: ['', '', '', ''],
            correctOptionIndex: 0,
            marks: 1
        });
    };

    const deleteQuestion = (idx) => {
        const q = examForm.questions[idx];
        setExamForm(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== idx),
            totalMarks: prev.totalMarks - q.marks
        }));
    };

    const saveExam = async () => {
        if (!examForm.title || !examForm.subject || examForm.questions.length === 0) {
            return alert("Error: Title, Subject and Questions required.");
        }

        try {
            if (view === 'edit') {
                await apiPut(`/api/exams/${examForm.id}`, examForm);
                alert("Exam updated successfully!");
            } else {
                await apiPost('/api/exams/create', examForm);
                alert("New exam created!");
            }
            setView('manage');
        } catch (e) {
            console.error(e);
            alert("Operation failed: " + e.message);
        }
    };

    // --- RENDER HELPERS ---
    const renderAnalytics = () => {
        const totalAttempts = results.length;
        const avgScore = totalAttempts > 0
            ? Math.round((results.reduce((acc, curr) => acc + (curr.score / curr.totalMarks), 0) / totalAttempts) * 100)
            : 0;

        return (
            <div className="animate-fade-in">
                <div className="admin-stats-grid mb-lg">
                    <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '0s' }}>
                        <div className="sentinel-scanner"></div>
                        <div className="summary-icon-box" style={{ background: '#eff6ff', color: '#6366f1', width: '50px', height: '50px', borderRadius: '14px' }}><FaUserGraduate /></div>
                        <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{totalAttempts}</div>
                        <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>TOTAL EVALUATIONS</div>
                    </div>
                    <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-1.5s' }}>
                        <div className="sentinel-scanner"></div>
                        <div className="summary-icon-box" style={{ background: '#ecfdf5', color: '#10b981', width: '50px', height: '50px', borderRadius: '14px' }}><FaChartBar /></div>
                        <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{isNaN(avgScore) ? 0 : avgScore}%</div>
                        <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>AVERAGE PROFICIENCY</div>
                    </div>
                </div>

                <div className="admin-card">
                    <div className="admin-page-header compact" style={{ border: 'none', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--admin-secondary)' }}>Recent Student Results</h3>
                    </div>
                    <div className="admin-table-wrap">
                        <table className="admin-grid-table">
                            <thead>
                                <tr>
                                    <th>STUDENT</th>
                                    <th>EXAM</th>
                                    <th>RATING</th>
                                    <th>DATE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.slice(0, 10).map((row, i) => {
                                    const percentage = row.totalMarks > 0 ? (row.score / row.totalMarks) : 0;
                                    let dateStr = 'N/A';
                                    try {
                                        if (row.submittedAt) dateStr = new Date(row.submittedAt).toLocaleDateString();
                                    } catch (e) { dateStr = 'Invalid Date'; }

                                    return (
                                        <tr key={i}>
                                            <td>{row.studentId?.name || 'Unknown'}</td>
                                            <td>{row.examId?.title || 'Archive'}</td>
                                            <td>
                                                <span className={`admin-badge ${percentage >= 0.75 ? 'success' : percentage >= 0.4 ? 'primary' : 'danger'}`}>
                                                    {Math.round(percentage * 100)}%
                                                </span>
                                            </td>
                                            <td>{dateStr}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderManage = () => (
        <div className="animate-fade-in">
            <div className="admin-action-bar compact" style={{ padding: '0.5rem 1.5rem', marginBottom: '2.5rem' }}>
                <button onClick={() => {
                    setExamForm({ title: '', subject: '', topic: '', branch: 'CSE', year: '1', section: 'A', durationMinutes: 30, totalMarks: 0, questions: [] });
                    setView('create');
                }} className="admin-btn admin-btn-primary" style={{ height: '48px', fontWeight: 950 }}>
                    <FaPlus /> INITIALIZE ASSESSMENT
                </button>
            </div>
            <div className="admin-card sentinel-floating" style={{ animationDelay: '0s' }}>
                <div className="sentinel-scanner"></div>
                <div className="admin-table-wrap">
                    <table className="admin-grid-table">
                        <thead>
                            <tr>
                                <th>EXAM TITLE</th>
                                <th>CLASS</th>
                                <th>QUESTIONS/MARKS</th>
                                <th>DURATION</th>
                                <th>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exams.map((ex, idx) => (
                                <tr key={ex._id}>
                                    <td style={{ fontWeight: 950, color: '#1e293b' }}>{ex.title}</td>
                                    <td>
                                        <span className="admin-badge primary" style={{ fontWeight: 950, fontSize: '0.6rem' }}>{ex.branch}-Y{ex.year}</span>
                                    </td>
                                    <td style={{ fontWeight: 800, fontSize: '0.85rem' }}>{ex.questions?.length || 0} Qs / {ex.totalMarks} MP</td>
                                    <td style={{ fontWeight: 850, fontSize: '0.85rem' }}>{ex.durationMinutes}M</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                                            <button onClick={() => handleEditExam(ex)} className="action-btn edit-btn" style={{ padding: '0.4rem', borderRadius: '8px' }}><FaEdit /></button>
                                            <button onClick={() => handleDeleteExam(ex._id)} className="action-btn" style={{ padding: '0.4rem', color: '#ef4444', borderColor: '#fee2e2', borderRadius: '8px' }}><FaTrash /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderForm = () => (
        <div className="animate-fade-in">
            <div className="admin-card">
                <div className="admin-page-header compact" style={{ border: 'none', marginBottom: '1.5rem', paddingBottom: 0 }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '1.3rem', fontWeight: 800, color: 'var(--admin-secondary)' }}>
                        <FaFileSignature style={{ color: 'var(--admin-primary)' }} /> {view === 'create' ? 'CREATE EXAM' : 'EDIT EXAM'}
                    </h3>
                </div>

                <div className="admin-grid-2" style={{ marginBottom: '2.5rem' }}>
                    <div className="admin-form-group">
                        <label className="admin-form-label">TITLE</label>
                        <input className="admin-form-input" value={examForm.title} onChange={e => setExamForm({ ...examForm, title: e.target.value })} placeholder="e.g. Mid-Term Assessment" />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-form-label">SUBJECT</label>
                        <input className="admin-form-input" value={examForm.subject} onChange={e => setExamForm({ ...examForm, subject: e.target.value })} placeholder="e.g. Mathematics-I" />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-form-label">BRANCH</label>
                        <input className="admin-form-input" value={examForm.branch} onChange={e => setExamForm({ ...examForm, branch: e.target.value })} placeholder="e.g. CSE, ECE" />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-form-label">YEAR</label>
                        <select className="admin-form-input" value={examForm.year} onChange={e => setExamForm({ ...examForm, year: e.target.value })}>
                            {[1, 2, 3, 4].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-form-label">SECTION</label>
                        <input className="admin-form-input" value={examForm.section} onChange={e => setExamForm({ ...examForm, section: e.target.value })} placeholder="e.g. A, B" />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-form-label">DURATION (MIN)</label>
                        <input type="number" className="admin-form-input" value={examForm.durationMinutes} onChange={e => setExamForm({ ...examForm, durationMinutes: Number(e.target.value) })} />
                    </div>
                </div>

                <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '2rem' }}>
                    <h4 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: 800, color: 'var(--admin-secondary)' }}>QUESTIONS ({examForm.questions.length} Added)</h4>

                    <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid var(--admin-border)' }}>
                        <div className="form-group">
                            <input
                                className="admin-filter-select full-width"
                                style={{ marginBottom: '1.5rem', background: 'white' }}
                                placeholder="Enter Question Text..."
                                value={currentQuestion.questionText}
                                onChange={e => setCurrentQuestion({ ...currentQuestion, questionText: e.target.value })}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            {currentQuestion.options.map((opt, i) => (
                                <input
                                    key={i}
                                    className="admin-filter-select full-width"
                                    style={{ borderColor: currentQuestion.correctOptionIndex === i ? 'var(--admin-success)' : '', borderWidth: currentQuestion.correctOptionIndex === i ? '2px' : '1px', background: 'white' }}
                                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                    value={opt}
                                    onChange={e => {
                                        const newOpts = [...currentQuestion.options];
                                        newOpts[i] = e.target.value;
                                        setCurrentQuestion({ ...currentQuestion, options: newOpts });
                                    }}
                                />
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <label className="admin-detail-label block-label" style={{ marginBottom: 0 }}>CORRECT OPTION</label>
                                <select
                                    value={currentQuestion.correctOptionIndex}
                                    onChange={e => setCurrentQuestion({ ...currentQuestion, correctOptionIndex: Number(e.target.value) })}
                                    className="admin-filter-select"
                                    style={{ width: '80px', background: 'white' }}
                                >
                                    <option value={0}>A</option><option value={1}>B</option><option value={2}>C</option><option value={3}>D</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <label className="admin-detail-label block-label" style={{ marginBottom: 0 }}>MARKS</label>
                                <input
                                    type="number"
                                    style={{ width: '80px', background: 'white' }}
                                    className="admin-filter-select"
                                    value={currentQuestion.marks}
                                    onChange={e => setCurrentQuestion({ ...currentQuestion, marks: Number(e.target.value) })}
                                />
                            </div>
                            <button onClick={addQuestion} className="admin-btn admin-btn-primary" style={{ marginLeft: 'auto' }}>
                                <FaPlus /> ADD QUESTION
                            </button>
                        </div>
                    </div>

                    <div className="added-questions" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                        {examForm.questions.map((q, i) => (
                            <div key={i} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, color: 'var(--admin-secondary)', fontSize: '0.95rem' }}>
                                    <strong style={{ color: 'var(--admin-primary)', marginRight: '0.5rem' }}>{i + 1}.</strong>
                                    {q.questionText}
                                    <span className="admin-badge primary" style={{ marginLeft: '0.8rem', fontSize: '0.75em' }}>{q.marks}M</span>
                                </span>
                                <button onClick={() => deleteQuestion(i)} className="action-btn" style={{ color: 'var(--admin-danger)', borderColor: 'var(--admin-danger)' }}><FaTrash /></button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="form-actions">
                    <button onClick={() => setView('manage')} className="admin-btn admin-btn-outline">CANCEL</button>
                    <button onClick={saveExam} className="admin-btn admin-btn-primary"><FaSave /> SAVE EXAM</button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in">
            <header className="admin-page-header">
                <div className="admin-page-title">
                    <h1>EVALUATION <span>MATRIX</span></h1>
                    <p>Intelligence-driven assessment protocols and evaluation tracking</p>
                </div>
                <div className="admin-action-bar" style={{ margin: 0 }}>
                    <button onClick={() => setView('analytics')} className={`admin-btn ${view === 'analytics' ? 'admin-btn-primary' : 'admin-btn-outline'}`} style={{ fontWeight: 950, height: '48px' }}>
                        <FaChartBar /> ANALYTICS
                    </button>
                    <button onClick={() => setView('manage')} className={`admin-btn ${view !== 'analytics' ? 'admin-btn-primary' : 'admin-btn-outline'}`} style={{ fontWeight: 950, height: '48px' }}>
                        <FaFileSignature /> MANAGE PROTOCOLS
                    </button>
                </div>
            </header>

            {view === 'analytics' && renderAnalytics()}
            {view === 'manage' && renderManage()}
            {(view === 'create' || view === 'edit') && renderForm()}
        </div>
    );
};

export default AdminExams;
