import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBriefcase, FaPlus, FaTrash, FaEdit, FaChevronRight, FaCheckCircle, FaBuilding, FaDollarSign, FaSearch, FaHistory } from 'react-icons/fa';
import api from '../../utils/apiClient';
import sseClient from '../../utils/sseClient';

const AdminPlacements = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        color: '#4f46e5',
        package: '',
        description: '',
        hiringRole: 'Software Engineer',
        domains: ['General'],
        questions: []
    });

    useEffect(() => {
        fetchCompanies();
        const unsub = sseClient.onUpdate((ev) => {
            if (ev.resource === 'placements') fetchCompanies();
        });
        return unsub;
    }, []);

    const fetchCompanies = async () => {
        try {
            const data = await api.apiGet('/api/placements');
            if (Array.isArray(data)) setCompanies(data);
        } catch (err) {
            console.error('Failed to fetch placements:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (company = null) => {
        if (company) {
            setFormData({ ...company });
            setEditMode(true);
            setSelectedCompany(company);
        } else {
            setFormData({
                name: '',
                color: '#4f46e5',
                package: '',
                description: '',
                hiringRole: 'Software Engineer',
                domains: ['General'],
                questions: []
            });
            setEditMode(false);
            setSelectedCompany(null);
        }
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await api.apiPut(`/api/placements/${selectedCompany._id}`, formData);
            } else {
                await api.apiPost('/api/placements', formData);
            }
            setShowModal(false);
            fetchCompanies();
        } catch (err) {
            alert('Error saving company: ' + err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this company?')) return;
        try {
            await api.apiDelete(`/api/placements/${id}`);
            fetchCompanies();
        } catch (err) {
            alert('Error deleting company: ' + err.message);
        }
    };

    const addQuestion = () => {
        setFormData({
            ...formData,
            questions: [...formData.questions, { question: '', answer: '', domain: 'General', category: 'Technical', difficulty: 'Medium' }]
        });
    };

    const removeQuestion = (idx) => {
        const q = [...formData.questions];
        q.splice(idx, 1);
        setFormData({ ...formData, questions: q });
    };

    const updateQuestion = (idx, field, value) => {
        const q = [...formData.questions];
        q[idx][field] = value;
        setFormData({ ...formData, questions: q });
    };

    const filteredCompanies = companies.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.hiringRole.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="admin-loading-screen"><div className="spinner"></div><p>Synchronizing Career Hub...</p></div>;

    return (
        <div className="admin-placements-layout animate-fade-in">
            <header className="admin-page-header">
                <div className="admin-page-title">
                    <h1>CAREER <span>NEXUS</span></h1>
                    <p>Strategic recruitment intelligence and placement pipeline</p>
                </div>
                <div className="admin-action-bar compact">
                    <button className="admin-btn admin-btn-primary" onClick={() => handleOpenModal()}>
                        <FaPlus /> ENROLL PARTNER
                    </button>
                </div>
            </header>

            {/* Strategic Analytics */}
            {/* Strategic Analytics */}
            <div className="admin-stats-grid mb-lg">
                <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '0s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{ background: '#eff6ff', color: '#6366f1', width: '50px', height: '50px', borderRadius: '14px' }}><FaBuilding /></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{companies.length}</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>TARGET CORPORATIONS</div>
                </div>
                <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-1s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{ background: '#dcfce7', color: '#10b981', width: '50px', height: '50px', borderRadius: '14px' }}><FaDollarSign /></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{companies.sort((a, b) => parseFloat(b.package) - parseFloat(a.package))[0]?.package || '0'}</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>PEAK PACKAGE ALT</div>
                </div>
                <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-2s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{ background: '#fef3c7', color: '#f59e0b', width: '50px', height: '50px', borderRadius: '14px' }}><FaHistory /></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{companies.reduce((acc, c) => acc + (c.questions?.length || 0), 0)}</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>INTEL ASSETS</div>
                </div>
            </div>

            <div className="admin-card mb-lg">
                <div className="admin-filter-bar" style={{ gap: '1rem' }}>
                    <div className="admin-search-wrapper" style={{ flex: 1 }}>
                        <FaSearch />
                        <input
                            className="admin-search-input"
                            placeholder="SEARCH BY COMPANY IDENTITY OR ROLE..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="admin-placements-grid">
                {filteredCompanies.map((company, idx) => (
                    <motion.div
                        key={company._id}
                        className="admin-company-card-v2 sentinel-floating"
                        style={{ animationDelay: `${idx * -0.4}s` }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                    >
                        <div className="sentinel-scanner"></div>
                        <div className="card-top-accent" style={{ background: company.color }}></div>
                        <div className="card-main-info">
                            <div className="company-branding">
                                <div className="company-logo-stub" style={{ background: company.color, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>{company.name[0]}</div>
                                <div>
                                    <h3 style={{ fontWeight: 950 }}>{company.name}</h3>
                                    <span className="role-chip" style={{ fontWeight: 850 }}>{company.hiringRole.toUpperCase()}</span>
                                </div>
                            </div>
                            <div className="package-info" style={{ fontWeight: 950, color: '#10b981' }}>
                                <FaDollarSign /> <span>{company.package}</span>
                            </div>
                        </div>

                        <div className="card-stats-row" style={{ borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9' }}>
                            <div className="stat-node">
                                <label style={{ fontWeight: 950 }}>ACTIVE SECTORS</label>
                                <span style={{ fontWeight: 950 }}>{company.domains?.length || 0}</span>
                            </div>
                            <div className="stat-node">
                                <label style={{ fontWeight: 950 }}>INTEL ASSETS</label>
                                <span style={{ fontWeight: 950 }}>{company.questions?.length || 0} Qs</span>
                            </div>
                        </div>

                        <div className="card-actions-v2">
                            <button className="icon-btn-v2" onClick={() => handleOpenModal(company)} title="Edit Intelligence" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', width: '36px', height: '36px', borderRadius: '10px' }}>
                                <FaEdit />
                            </button>
                            <button className="icon-btn-v2 danger" onClick={() => handleDelete(company._id)} title="Evict Company" style={{ background: '#fff1f2', border: '1px solid #fee2e2', color: '#ef4444', width: '36px', height: '36px', borderRadius: '10px' }}>
                                <FaTrash />
                            </button>
                        </div>
                    </motion.div>
                ))}

                {filteredCompanies.length === 0 && (
                    <div className="admin-empty-state" style={{ gridColumn: '1 / -1' }}>
                        <FaBriefcase size={80} color="#e2e8f0" />
                        <h2>No recruitment targets found</h2>
                        <p>Search yield returned zero results or pipeline is empty.</p>
                    </div>
                )}
            </div>

            {/* MANAGEMENT MODAL */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="admin-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="admin-modal-window large"
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                        >
                            <div className="modal-header">
                                <h3>{editMode ? 'RECONFIGURE' : 'COMMISSION'} COMPANY INTELLIGENCE</h3>
                                <button onClick={() => setShowModal(false)} className="close-btn">&times;</button>
                            </div>
                            <form onSubmit={handleSave} className="admin-form-v2">
                                <div className="form-split">
                                    <div className="form-column">
                                        <div className="admin-form-group">
                                            <label>COMPANY NAME</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="admin-form-grid-2">
                                            <div className="admin-form-group">
                                                <label>HIRE ROLE</label>
                                                <input
                                                    type="text"
                                                    value={formData.hiringRole}
                                                    onChange={(e) => setFormData({ ...formData, hiringRole: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="admin-form-group">
                                                <label>PACKAGE</label>
                                                <input
                                                    type="text"
                                                    value={formData.package}
                                                    onChange={(e) => setFormData({ ...formData, package: e.target.value })}
                                                    placeholder="e.g. 12 LPA"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="admin-form-group">
                                            <label>BRAND COLOR</label>
                                            <div className="color-picker-row">
                                                <input
                                                    type="color"
                                                    value={formData.color}
                                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                                />
                                                <span>{formData.color}</span>
                                            </div>
                                        </div>
                                        <div className="admin-form-group">
                                            <label>DESCRIPTION</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                rows="3"
                                            ></textarea>
                                        </div>
                                    </div>

                                    <div className="form-column">
                                        <div className="admin-form-group">
                                            <div className="f-between">
                                                <label>INTERVIEW INTELLIGENCE (QUESTIONS)</label>
                                                <button type="button" className="text-btn" onClick={addQuestion}>
                                                    <FaPlus /> ADD CASE
                                                </button>
                                            </div>
                                            <div className="questions-scroll-area">
                                                {formData.questions.map((q, idx) => (
                                                    <div key={idx} className="question-entry-item">
                                                        <div className="q-entry-head">
                                                            <input
                                                                placeholder="Question Text"
                                                                value={q.question}
                                                                onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                                                            />
                                                            <button type="button" onClick={() => removeQuestion(idx)}><FaTrash /></button>
                                                        </div>
                                                        <textarea
                                                            placeholder="Model Answer"
                                                            value={q.answer}
                                                            onChange={(e) => updateQuestion(idx, 'answer', e.target.value)}
                                                        ></textarea>
                                                        <div className="q-entry-grid">
                                                            <select value={q.domain} onChange={(e) => updateQuestion(idx, 'domain', e.target.value)}>
                                                                <option value="General">General</option>
                                                                <option value="Aptitude">Aptitude</option>
                                                                <option value="Frontend">Frontend</option>
                                                                <option value="Backend">Backend</option>
                                                                <option value="Data Science">Data Science</option>
                                                            </select>
                                                            <select value={q.difficulty} onChange={(e) => updateQuestion(idx, 'difficulty', e.target.value)}>
                                                                <option value="Easy">Easy</option>
                                                                <option value="Medium">Medium</option>
                                                                <option value="Hard">Hard</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                ))}
                                                {formData.questions.length === 0 && (
                                                    <div className="mini-empty">No interview intelligence assets added.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="admin-btn secondary" onClick={() => setShowModal(false)}>ABORT</button>
                                    <button type="submit" className="admin-btn primary">COMMIT INTEL</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                .admin-placements-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 1.5rem;
                    padding: 0 0.5rem;
                }
                .admin-company-card-v2 {
                    background: white;
                    border-radius: 20px;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    position: relative;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }
                .admin-company-card-v2:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 25px -10px rgba(0,0,0,0.1);
                    border-color: #cbd5e1;
                }
                .card-top-accent {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                }
                .company-branding {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }
                .company-logo-stub {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: 950;
                    font-size: 1.5rem;
                }
                .company-branding h3 {
                    margin: 0;
                    font-size: 1.1rem;
                    font-weight: 900;
                    color: #1e293b;
                }
                .role-chip {
                    font-size: 0.75rem;
                    color: #64748b;
                    font-weight: 600;
                }
                .package-info {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #10b981;
                    font-size: 1rem;
                }
                .card-stats-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    padding: 1rem 0;
                    border-top: 1px dashed #e2e8f0;
                    border-bottom: 1px dashed #e2e8f0;
                }
                .stat-node label {
                    display: block;
                    font-size: 0.65rem;
                    font-weight: 900;
                    color: #94a3b8;
                    letter-spacing: 1px;
                }
                .stat-node span {
                    font-weight: 900;
                    color: #1e293b;
                    font-size: 1.1rem;
                }
                .card-actions-v2 {
                    display: flex;
                    justify-content: flex-end;
                    gap: 0.75rem;
                }
                .questions-scroll-area {
                    max-height: 400px;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    padding-right: 0.5rem;
                }
                .question-entry-item {
                    background: #f8fafc;
                    padding: 1rem;
                    border-radius: 12px;
                    border: 1px solid #e2e8f0;
                }
                .q-entry-head {
                    display: flex;
                    gap: 1rem;
                    margin-bottom: 0.5rem;
                }
                .q-entry-head input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    font-weight: 700;
                    font-size: 0.9rem;
                    padding: 0;
                }
                .q-entry-head button {
                    color: #ef4444;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                }
                .question-entry-item textarea {
                    width: 100%;
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 0.5rem;
                    font-size: 0.85rem;
                    margin-bottom: 0.5rem;
                    resize: vertical;
                }
                .q-entry-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.5rem;
                }
                .q-entry-grid select {
                    background: white;
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    font-size: 0.75rem;
                    padding: 0.25rem;
                }
                .mini-empty {
                    padding: 2rem;
                    text-align: center;
                    color: #94a3b8;
                    font-size: 0.85rem;
                    font-style: italic;
                    border: 1px dashed #cbd5e1;
                    border-radius: 12px;
                }
                .form-split {
                    display: grid;
                    grid-template-columns: 1fr 1.5fr;
                    gap: 2.5rem;
                }
                .admin-modal-window.large {
                    width: 90%;
                    max-width: 1100px;
                }
            `}</style>
        </div>
    );
};

export default AdminPlacements;
