import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaClipboardList, FaArrowLeft, FaShieldAlt, FaEdit, FaFilter } from 'react-icons/fa';
import './FacultyDashboard.css';
import { apiPost, apiGet, apiDelete, apiPut } from '../../utils/apiClient';
import sseClient from '../../utils/sseClient';

/**
 * FACULTY EXAM MANAGEMENT
 * Interface for creating and managing student assessments.
 */
const FacultyExams = ({ subject, year, sections, facultyId, branch }) => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [editId, setEditId] = useState(null);
    const [selectedSectionFilter, setSelectedSectionFilter] = useState('All');

    const [formData, setFormData] = useState({
        title: '', topic: '', week: 'Week 1',
        durationMinutes: 20, totalMarks: 10,
        section: sections && sections.length > 0 ? sections[0] : '', branch: branch || 'CSE',
        questions: []
    });

    const [currentQuestion, setCurrentQuestion] = useState({
        questionText: '', options: ['', '', '', ''],
        correctOptionIndex: 0, marks: 1
    });

    useEffect(() => {
        fetchExams();

        const unsub = sseClient.onUpdate((ev) => {
            if (ev.resource === 'exams') {
                fetchExams();
            }
        });
        return unsub;
    }, [facultyId]);

    const fetchExams = async () => {
        setLoading(true);
        try {
            const data = await apiGet(`/api/exams/faculty/${facultyId}`);
            if (data) setExams(data);
        } catch (error) {
            console.error("Failed to load assessments:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleQuestionChange = (e) => {
        const { name, value } = e.target;
        setCurrentQuestion(prev => ({ ...prev, [name]: value }));
    };

    const handleOptionChange = (index, value) => {
        const newOptions = [...currentQuestion.options];
        newOptions[index] = value;
        setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
    };

    const addQuestion = () => {
        if (!currentQuestion.questionText || currentQuestion.options.some(o => !o)) {
            alert("Error: Question fields incomplete. Please fill all fields.");
            return;
        }
        setFormData(prev => ({
            ...prev,
            questions: [...prev.questions, currentQuestion]
        }));
        setCurrentQuestion({
            questionText: '', options: ['', '', '', ''],
            correctOptionIndex: 0, marks: 1
        });
    };

    const removeQuestion = (index) => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.questions.length === 0) {
            alert("Error: Minimum one question required.");
            return;
        }

        try {
            const payload = {
                ...formData,
                totalMarks: formData.questions.reduce((acc, q) => acc + parseFloat(q.marks || 1), 0),
                subject, year, facultyId
            };

            if (editId) {
                await apiPut(`/api/exams/${editId}`, payload);
                alert("Exam Updated Successfully.");
            } else {
                await apiPost('/api/exams/create', payload);
                alert("Exam Created and Published.");
            }

            setShowCreate(false);
            setEditId(null);
            setFormData({
                title: '', topic: '', week: 'Week 1',
                durationMinutes: 20, totalMarks: 10,
                section: '', branch: branch || 'CSE',
                questions: []
            });
            fetchExams();
        } catch (err) {
            alert("Error: " + err.message);
        }
    };

    const handleEditExam = (exam) => {
        setFormData({
            title: exam.title,
            topic: exam.topic,
            week: exam.week,
            durationMinutes: exam.durationMinutes,
            totalMarks: exam.totalMarks,
            section: exam.section,
            branch: exam.branch,
            questions: exam.questions
        });
        setEditId(exam._id);
        setShowCreate(true);
    };

    const handleDeleteExam = async (id) => {
        if (!window.confirm("Are you sure you want to delete this exam?")) return;
        try {
            await apiDelete(`/api/exams/${id}`);
            fetchExams();
        } catch (err) {
            alert("Delete failed.");
        }
    };

    if (showCreate) {
        return (
            <div className="animate-fade-in">
                <header className="f-view-header">
                    <div>
                        <h2>{editId ? 'REFINING' : 'ORCHESTRATING'} <span>EXAM</span></h2>
                        <p className="nexus-subtitle">Architect a tactical assessment for your students</p>
                    </div>
                    <button onClick={() => { setShowCreate(false); setEditId(null); }} className="f-node-btn secondary">
                        <FaArrowLeft /> RETURN TO PORTAL
                    </button>
                </header>

                <div className="f-node-card animate-slide-up" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem' }}>
                    <div className="f-modal-header" style={{ marginBottom: '2.5rem' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaShieldAlt style={{ fontSize: '2rem' }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 950, color: '#1e293b', margin: 0 }}>EXAM SPECIFICATIONS</h2>
                            <p style={{ color: '#94a3b8', fontWeight: 850, fontSize: '0.8rem', margin: '0.2rem 0 0' }}>Define terms and tactical scope</p>
                        </div>
                    </div>

                    <div className="nexus-form-grid" style={{ marginBottom: '3rem' }}>
                        <div className="nexus-group">
                            <label className="f-form-label">Exam Title</label>
                            <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="f-form-select" placeholder="e.g. Mid-Term Assessment" />
                        </div>
                        <div className="nexus-group">
                            <label className="f-form-label">Subject Scope / Topic</label>
                            <input type="text" name="topic" value={formData.topic} onChange={handleInputChange} className="f-form-select" placeholder="e.g. Core System Architecture" />
                        </div>
                        <div className="nexus-group">
                            <label className="f-form-label">Academic Sequence</label>
                            <select name="week" value={formData.week} onChange={handleInputChange} className="f-form-select">
                                <option value="Week 1">Week 1</option>
                                <option value="Week 2">Week 2</option>
                                <option value="Week 3">Week 3</option>
                                <option value="Week 4">Week 4</option>
                                <option value="Mid Term">Mid Term</option>
                                <option value="Final">Final</option>
                            </select>
                        </div>
                        <div className="nexus-group">
                            <label className="f-form-label">Time Allocation (Minutes)</label>
                            <input type="number" name="durationMinutes" value={formData.durationMinutes} onChange={handleInputChange} className="f-form-select" />
                        </div>
                        <div className="nexus-group">
                            <label className="f-form-label">Branch Pipeline</label>
                            <input type="text" name="branch" value={formData.branch} onChange={handleInputChange} className="f-form-select" />
                        </div>
                        <div className="nexus-group">
                            <label className="f-form-label">Operational Section</label>
                            <select name="section" value={formData.section} onChange={handleInputChange} className="f-form-select">
                                <option value="">Universal (Global Deployment)</option>
                                {sections && sections.map(s => <option key={s} value={s}>Section {s}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="f-question-panel" style={{ background: '#f8fafc', borderRadius: '24px', padding: '2rem', border: '1px solid #e2e8f0' }}>
                        <div className="f-node-head" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ background: 'var(--accent-primary)', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 950, fontSize: '0.7rem' }}>STEP 02</div>
                                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 950, color: '#1e293b' }}>QUESTION ARCHITECT</h4>
                            </div>
                            <div className="f-flex-gap">
                                <span className="f-meta-badge type" style={{ background: '#6366f1', color: 'white' }}>{formData.questions.length} NODES</span>
                                <span className="f-meta-badge type" style={{ background: '#10b981', color: 'white' }}>{formData.questions.reduce((acc, q) => acc + parseFloat(q.marks || 1), 0)} TOTAL MARKS</span>
                            </div>
                        </div>

                        {/* Question Builder */}
                        <div className="builder-core" style={{ background: 'white', borderRadius: '20px', padding: '1.5rem', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="nexus-group">
                                    <label className="f-form-label">Inquiry Text</label>
                                    <input
                                        type="text"
                                        name="questionText"
                                        value={currentQuestion.questionText}
                                        onChange={handleQuestionChange}
                                        className="f-form-select"
                                        placeholder="Formulate the prompt..."
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                                <div className="nexus-group">
                                    <label className="f-form-label">Weight</label>
                                    <input
                                        type="number"
                                        name="marks"
                                        value={currentQuestion.marks}
                                        onChange={handleQuestionChange}
                                        className="f-form-select"
                                        placeholder="Marks"
                                        style={{ marginBottom: 0 }}
                                    />
                                </div>
                            </div>

                            <div className="nexus-form-grid" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
                                {currentQuestion.options.map((opt, idx) => (
                                    <div key={idx} className="nexus-group">
                                        <label className="f-form-label">Option {idx + 1}</label>
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => handleOptionChange(idx, e.target.value)}
                                            className="f-form-select"
                                            placeholder={`Entry ${idx + 1}...`}
                                            style={currentQuestion.correctOptionIndex === idx ? { borderColor: '#10b981', background: 'rgba(16, 185, 129, 0.05)', fontWeight: 800 } : {}}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '1rem', borderRadius: '14px' }}>
                                <div className="f-flex-gap">
                                    <span style={{ fontWeight: 850, fontSize: '0.75rem', color: '#64748b' }}>VALIDATED RESPONSE:</span>
                                    <select
                                        name="correctOptionIndex"
                                        value={currentQuestion.correctOptionIndex}
                                        onChange={(e) => setCurrentQuestion(prev => ({ ...prev, correctOptionIndex: parseInt(e.target.value) }))}
                                        className="f-form-select"
                                        style={{ width: '150px', marginBottom: 0, padding: '0.4rem 0.8rem', height: '36px', fontSize: '0.75rem', fontWeight: 900 }}
                                    >
                                        <option value={0}>Option 1</option>
                                        <option value={1}>Option 2</option>
                                        <option value={2}>Option 3</option>
                                        <option value={3}>Option 4</option>
                                    </select>
                                </div>
                                <button onClick={addQuestion} className="nexus-pill active" style={{ borderRadius: '10px', height: '40px', padding: '0 1.2rem' }}>
                                    <FaPlus /> APPEND NODE
                                </button>
                            </div>
                        </div>

                        {/* Roster of added questions */}
                        <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {formData.questions.map((q, i) => (
                                <div key={i} className="f-question-node animate-fade-in" style={{ position: 'relative', background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
                                    <div className="f-question-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                        <div className="f-question-text" style={{ fontWeight: 950, color: '#1e293b', fontSize: '0.95rem' }}>{i + 1}. {q.questionText}</div>
                                        <div className="f-question-marks" style={{ background: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 900, color: '#64748b' }}>{q.marks} PTS</div>
                                    </div>
                                    <div className="f-option-preview" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                                        {q.options.map((opt, idx) => (
                                            <div key={idx} style={{
                                                padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 850,
                                                background: q.correctOptionIndex === idx ? '#dcfce7' : '#f8fafc',
                                                color: q.correctOptionIndex === idx ? '#10b981' : '#64748b',
                                                border: `1px solid ${q.correctOptionIndex === idx ? '#10b981' : '#e2e8f0'}`,
                                                display: 'flex', alignItems: 'center'
                                            }}>
                                                <div style={{
                                                    width: '18px', height: '18px', borderRadius: '100%', marginRight: '0.75rem',
                                                    border: `2px solid ${q.correctOptionIndex === idx ? '#10b981' : '#cbd5e1'}`,
                                                    background: q.correctOptionIndex === idx ? '#10b981' : 'transparent'
                                                }}></div>
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                    <button onClick={() => removeQuestion(i)} style={{ position: 'absolute', top: '1rem', right: '1rem', color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = '#ef4444'} onMouseLeave={e => e.target.style.color = '#94a3b8'}>
                                        <FaTrash />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={handleSubmit} className="nexus-btn-primary" style={{ width: '100%', marginTop: '3.5rem', height: '60px', fontSize: '1rem' }}>
                        {editId ? 'CONFIRM ALL UPDATES' : 'DEPLOY EXAM TO ENVIRONMENT'}
                    </button>
                </div>
            </div >
        );
    }

    return (
        <div className="animate-fade-in">
            <header className="f-view-header">
                <div>
                    <h2>EXAM <span>PORTAL</span></h2>
                    <p className="nexus-subtitle">Orchestrate and deploy high-fidelity assessments</p>
                </div>
                <button onClick={() => { setShowCreate(true); setEditId(null); setFormData({ title: '', topic: '', week: 'Week 1', durationMinutes: 20, totalMarks: 10, section: '', branch: branch || 'CSE', questions: [] }); }} className="nexus-btn-primary">
                    <FaPlus /> INITIATE EXAM
                </button>
            </header>

            {loading ? (
                <div className="f-node-card f-center-empty">
                    <div className="spinner"></div>
                    <p style={{ marginTop: '1rem', fontWeight: 850 }}>Synchronizing Portal...</p>
                </div>
            ) : exams.length === 0 ? (
                <div className="f-node-card f-center-empty" style={{ padding: '6rem 2rem' }}>
                    <div style={{ background: 'rgba(99, 102, 241, 0.05)', color: '#cbd5e1', width: '100px', height: '100px', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                        <FaClipboardList style={{ fontSize: '3rem' }} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 950, color: '#1e293b', margin: 0 }}>NO ACTIVE ASSESSMENTS</h3>
                    <p style={{ color: '#94a3b8', fontWeight: 850, marginTop: '0.8rem', maxWidth: '400px', textAlign: 'center' }}>The assessment environment is currently clear. Deploy a new exam node to begin monitoring student progress.</p>
                    <button onClick={() => setShowCreate(true)} className="nexus-btn-primary" style={{ marginTop: '2.5rem' }}>
                        <FaPlus /> ORCHESTRATE NEW EXAM
                    </button>
                </div>
            ) : (
                <>
                    <div className="f-node-card" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ padding: '0 1rem', borderRight: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <FaFilter style={{ color: 'var(--accent-primary)' }} />
                            <span style={{ fontWeight: 950, fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.05em' }}>FILTER BY PIPELINE</span>
                        </div>
                        <div className="section-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className={`section-btn ${selectedSectionFilter === 'All' ? 'active' : ''}`} onClick={() => setSelectedSectionFilter('All')} style={{ fontSize: '0.7rem' }}>ALL DEPLOYMENTS</button>
                            {sections && sections.map((sec, idx) => (
                                <button key={idx} className={`section-btn ${selectedSectionFilter === sec ? 'active' : ''}`} onClick={() => setSelectedSectionFilter(sec)} style={{ fontSize: '0.7rem' }}>
                                    SEC {sec}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="f-exam-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        {exams.filter(exam => selectedSectionFilter === 'All' || exam.section === selectedSectionFilter).map(exam => (
                            <div key={exam._id} className="f-node-card animate-slide-up" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-primary)' }}></div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div className="f-exam-topic" style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{exam.topic || 'General Knowledge'}</div>
                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        <button onClick={() => handleEditExam(exam)} className="f-quick-btn shadow" style={{ width: '30px', height: '30px', fontSize: '0.8rem' }}><FaEdit /></button>
                                        <button onClick={() => handleDeleteExam(exam._id)} className="f-quick-btn shadow delete" style={{ width: '30px', height: '30px', fontSize: '0.8rem' }}><FaTrash /></button>
                                    </div>
                                </div>

                                <h3 style={{ fontSize: '1.25rem', fontWeight: 950, color: '#1e293b', margin: '0 0 0.4rem', lineHeight: 1.2 }}>{exam.title}</h3>
                                <div className="f-meta-badge type" style={{ marginBottom: '1.5rem', background: '#f1f5f9', color: '#475569', fontSize: '0.65rem' }}>{exam.week.toUpperCase()} SEQUENCE</div>

                                <div className="f-exam-stats" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                                    <div className="f-exam-stat-row">
                                        <div style={{ fontSize: '0.65rem', fontWeight: 850, color: '#94a3b8', marginBottom: '0.2rem' }}>QUESTIONS</div>
                                        <div style={{ fontWeight: 950, color: '#1e293b' }}>{exam.questions.length} NODES</div>
                                    </div>
                                    <div className="f-exam-stat-row">
                                        <div style={{ fontSize: '0.65rem', fontWeight: 850, color: '#94a3b8', marginBottom: '0.2rem' }}>ALLOCATION</div>
                                        <div style={{ fontWeight: 950, color: '#1e293b' }}>{exam.durationMinutes} MIN</div>
                                    </div>
                                    <div className="f-exam-stat-row">
                                        <div style={{ fontSize: '0.65rem', fontWeight: 850, color: '#94a3b8', marginBottom: '0.2rem' }}>WEIGHT</div>
                                        <div style={{ fontWeight: 950, color: '#1e293b' }}>{exam.totalMarks || exam.questions.length} MARKS</div>
                                    </div>
                                    <div className="f-exam-stat-row">
                                        <div style={{ fontSize: '0.65rem', fontWeight: 850, color: '#94a3b8', marginBottom: '0.2rem' }}>TARGET</div>
                                        <div style={{ fontWeight: 950, color: '#10b981' }}>{exam.section ? `SEC ${exam.section}` : 'UNIVERSAL'}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default FacultyExams;
