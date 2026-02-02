// src/Components/FacultyDashboard/FacultyAssignments.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaPlus, FaSave, FaTrash, FaClipboardList, FaCalendarAlt, FaBook, FaUsers, FaFilter } from 'react-icons/fa';
import { apiGet, apiPost, apiDelete } from '../../utils/apiClient';
import './FacultyAssignments.css';

const FacultyAssignments = ({ facultyId }) => {
    const [assignments, setAssignments] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [selectedSectionFilter, setSelectedSectionFilter] = useState('All');
    const [formData, setFormData] = useState({
        year: '',
        section: '',
        subject: '',
        title: '',
        description: ''
    });

    const uniqueSections = [...new Set(assignments.map(a => `${a.year}-${a.section}`))];

    const fetchAssignments = async () => {
        try {
            const data = await apiGet(`/api/teaching-assignments/faculty/${facultyId}`);
            setAssignments(data || []);
        } catch (e) {
            console.error('Failed to load assignments', e);
        }
    };

    useEffect(() => {
        fetchAssignments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facultyId]);

    const handleChange = e => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async e => {
        e.preventDefault();
        const payload = { ...formData, facultyId };
        try {
            await apiPost('/api/teaching-assignments', payload);
            setShowForm(false);
            setFormData({ year: '', section: '', subject: '', title: '', description: '' });
            fetchAssignments();
        } catch (err) {
            console.error('Error creating assignment', err);
        }
    };

    const handleDelete = async assignmentId => {
        if (!window.confirm('Delete this assignment?')) return;
        try {
            await apiDelete(`/api/teaching-assignments/${assignmentId}`);
            fetchAssignments();
        } catch (e) {
            console.error('Delete failed', e);
        }
    };

    return (
        <div className="animate-fade-in">
            <header className="f-view-header">
                <div>
                    <h2>ASSIGNMENT <span>CONTROL</span></h2>
                    <p className="nexus-subtitle">Architect and deploy coursework to active pipelines</p>
                </div>
                <button
                    className="nexus-btn-primary"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? <><FaSave /> VIEW REPOSITORY</> : <><FaPlus /> NEW ASSIGNMENT</>}
                </button>
            </header>

            {showForm && (
                <div className="f-node-card animate-slide-up" style={{ maxWidth: '800px', margin: '0 auto 3rem', padding: '2.5rem' }}>
                    <div className="f-modal-header" style={{ marginBottom: '2.5rem' }}>
                        <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FaClipboardList style={{ fontSize: '2rem' }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 950, color: '#1e293b', margin: 0 }}>ORCHESTRATE COURSEWORK</h2>
                            <p style={{ color: '#94a3b8', fontWeight: 850, fontSize: '0.8rem', margin: '0.2rem 0 0' }}>Configure assignment parameters and instructions</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="nexus-form-grid" style={{ marginBottom: '2rem' }}>
                            <div className="nexus-group">
                                <label className="f-form-label"><FaCalendarAlt /> Academic Year</label>
                                <input name="year" className="f-form-select" placeholder="e.g. 3" value={formData.year} onChange={handleChange} required />
                            </div>
                            <div className="nexus-group">
                                <label className="f-form-label"><FaUsers /> Operational Section</label>
                                <input name="section" className="f-form-select" placeholder="e.g. A" value={formData.section} onChange={handleChange} required />
                            </div>
                            <div className="nexus-group">
                                <label className="f-form-label"><FaBook /> Subject Node</label>
                                <input name="subject" className="f-form-select" placeholder="e.g. Neural Networks" value={formData.subject} onChange={handleChange} required />
                            </div>
                            <div className="nexus-group">
                                <label className="f-form-label"><FaClipboardList /> Assignment Title</label>
                                <input name="title" className="f-form-select" placeholder="e.g. Lab Project 01" value={formData.title} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="nexus-group" style={{ marginBottom: '2.5rem' }}>
                            <label className="f-form-label">Deployment Instructions</label>
                            <textarea
                                name="description"
                                className="f-form-textarea"
                                placeholder="Detail the operational scope and requirements..."
                                value={formData.description}
                                onChange={handleChange}
                                style={{ height: '150px' }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                type="button"
                                className="f-node-btn secondary"
                                style={{ flex: 1, height: '54px' }}
                                onClick={() => {
                                    setShowForm(false);
                                    setFormData({ year: '', section: '', subject: '', title: '', description: '' });
                                }}
                            >
                                ABORT
                            </button>
                            <button type="submit" className="nexus-btn-primary" style={{ flex: 2, height: '54px' }}>
                                <FaSave /> DEPLOY ASSIGNMENT
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {assignments.length === 0 ? (
                <div className="f-node-card f-center-empty" style={{ padding: '6rem 2rem' }}>
                    <div style={{ background: 'rgba(99, 102, 241, 0.05)', color: '#cbd5e1', width: '100px', height: '100px', borderRadius: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '2rem' }}>
                        <FaClipboardList style={{ fontSize: '3rem' }} />
                    </div>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 950, color: '#1e293b', margin: 0 }}>REPOSITORY EMPTY</h3>
                    <p style={{ color: '#94a3b8', fontWeight: 850, marginTop: '0.8rem', textAlign: 'center' }}>No assignment nodes have been initialized in this repository.</p>
                    <button onClick={() => setShowForm(true)} className="nexus-btn-primary" style={{ marginTop: '2.5rem' }}>
                        <FaPlus /> INITIALIZE FIRST ASSIGNMENT
                    </button>
                </div>
            ) : (
                <>
                    <div className="f-node-card" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <div style={{ padding: '0 1rem', borderRight: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <FaFilter style={{ color: 'var(--accent-primary)' }} />
                            <span style={{ fontWeight: 950, fontSize: '0.7rem', color: '#94a3b8', letterSpacing: '0.05em' }}>REGISTRY FILTER</span>
                        </div>
                        <div className="section-buttons" style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className={`section-btn ${selectedSectionFilter === 'All' ? 'active' : ''}`} onClick={() => setSelectedSectionFilter('All')} style={{ fontSize: '0.7rem' }}>ALL ASSIGNMENTS</button>
                            {uniqueSections.map((sec, idx) => (
                                <button key={idx} className={`section-btn ${selectedSectionFilter === sec ? 'active' : ''}`} onClick={() => setSelectedSectionFilter(sec)} style={{ fontSize: '0.7rem' }}>
                                    YEAR {sec.split('-')[0]} • SEC {sec.split('-')[1]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="f-exam-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
                        {assignments.filter(a => selectedSectionFilter === 'All' || `${a.year}-${a.section}` === selectedSectionFilter).map(a => (
                            <div key={a.id || a._id} className="f-node-card animate-slide-up" style={{ padding: '2rem', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--accent-primary)' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        <div style={{ background: '#f1f5f9', color: '#475569', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 950 }}>Y{a.year}</div>
                                        <div style={{ background: '#f1f5f9', color: '#475569', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 950 }}>S{a.section}</div>
                                    </div>
                                    <button onClick={() => handleDelete(a.id || a._id)} className="f-quick-btn shadow delete" style={{ width: '32px', height: '32px' }}><FaTrash /></button>
                                </div>

                                <h4 style={{ fontSize: '1.15rem', fontWeight: 950, color: '#1e293b', margin: '0 0 0.5rem' }}>{a.title}</h4>
                                <div style={{ color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 900, marginBottom: '1.25rem', textTransform: 'uppercase' }}>{a.subject}</div>

                                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                    <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, margin: 0, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {a.description || 'No operational parameters provided.'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

FacultyAssignments.propTypes = {
    facultyId: PropTypes.string.isRequired
};

export default FacultyAssignments;
