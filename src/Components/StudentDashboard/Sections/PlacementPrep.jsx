import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaBriefcase, FaUserTie, FaChevronRight, FaSpinner, FaArrowLeft, FaLaptopCode, FaServer, FaCodeBranch, FaCloud, FaChartBar, FaCheckCircle, FaUniversity
} from 'react-icons/fa';
import api from '../../../utils/apiClient';
import './PlacementPrep.css';
import ProfessionalEmptyState from './ProfessionalEmptyState';

/**
 * PLACEMENT PREP HUB
 */
const PlacementPrep = ({ userData }) => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    // Navigation State
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedDomain, setSelectedDomain] = useState(null);

    useEffect(() => {
        fetchCompanies();
    }, []);

    const fetchCompanies = async () => {
        try {
            const data = await api.apiGet('/api/placements');
            if (Array.isArray(data)) setCompanies(data);
        } catch (err) {
            console.error('Failed to fetch placement data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getFilteredQuestions = () => {
        if (!selectedCompany) return [];
        if (!selectedDomain) return [];
        return selectedCompany.questions.filter(q =>
            q.domain === selectedDomain || q.domain === 'General' || q.domain === 'Aptitude'
        );
    };

    const getDomainIcon = (domain) => {
        const d = (domain || '').toLowerCase();
        if (d.includes('frontend')) return <FaCodeBranch />;
        if (d.includes('backend') || d.includes('java') || d.includes('node')) return <FaServer />;
        if (d.includes('cloud') || d.includes('aws')) return <FaCloud />;
        if (d.includes('data') || d.includes('analytics')) return <FaChartBar />;
        if (d.includes('net') || d.includes('security')) return <FaUserTie />;
        return <FaLaptopCode />;
    };

    const QuestionCard = ({ q, idx, color }) => {
        const [isOpen, setIsOpen] = useState(false);
        return (
            <motion.div
                layout
                onClick={() => setIsOpen(!isOpen)}
                className={`q-card-premium ${isOpen ? 'open' : ''}`}
                style={{ borderLeftColor: isOpen ? color : '#e2e8f0', '--company-color': color }}
            >
                <div className="q-card-header-row" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                    <div className="q-index-box" style={{ background: isOpen ? color : '#cbd5e1' }}>
                        {idx + 1}
                    </div>
                    <h4 className="q-text">{q.question}</h4>
                    <FaChevronRight style={{
                        transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                        transition: 'transform 0.4s', fontSize: '0.8rem', color: '#94a3b8'
                    }} />
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div className="q-answer-wrapper" style={{ borderLeftColor: `${color}30` }}>
                                <p className="q-answer-text">{q.answer}</p>
                                <div className="q-metadata">
                                    <span className="meta-pill">{q.category}</span>
                                    <span className="meta-pill">{q.difficulty}</span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        );
    };

    if (loading) {
        return (
            <div className="nexus-loading-center">
                <FaSpinner className="spinner-icon" />
                <p>Establishing Pipeline...</p>
            </div>
        );
    }

    if (!selectedCompany) {
        return (
            <div className="placement-container">
                <div className="placement-hero">
                    <div className="hero-content">
                        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
                            <div className="hero-badge">
                                <FaBriefcase /> PLACEMENT COMMAND CENTER
                            </div>
                            <h2 className="hero-title">
                                Master Your <br /><span>Strategic Career</span>
                            </h2>
                            <p className="hero-subtitle">
                                Welcome, <strong>{userData?.studentName}</strong>. Your roadmap to Google, Microsoft, and Amazon begins here.
                            </p>
                        </motion.div>
                    </div>
                </div>

                <div className="company-grid">
                    {companies.length > 0 ? (
                        companies.map((company, i) => (
                            <motion.div
                                key={company._id || i}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="premium-company-card"
                                onClick={() => {
                                    setSelectedCompany(company);
                                    setSelectedDomain((company.domains || [])[0] || null);
                                }}
                            >
                                <div className="card-banner" style={{ background: `linear-gradient(135deg, ${company.color} 0%, ${company.color}dd 100%)` }}>
                                    <div className="logo-wrapper">
                                        <div style={{ width: '100%', height: '100%', background: company.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 950 }}>
                                            {company.name.substring(0, 1)}
                                        </div>
                                    </div>
                                </div>

                                <div className="card-main-content">
                                    <div className="company-name-row">
                                        <h3>{company.name}</h3>
                                        <div className="package-pill">{company.package || '6.5 LPA'}</div>
                                    </div>
                                    <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                                        {company.description ? company.description.substring(0, 70) : 'Elite recruitment partner'}...
                                    </p>

                                    <div className="role-info-box">
                                        <FaUserTie className="role-icon" style={{ color: company.color }} />
                                        <div className="role-details">
                                            <label>Active Role</label>
                                            <span>{company.hiringRole || 'SDE / Intern'}</span>
                                        </div>
                                    </div>

                                    <div className="domain-tags-row">
                                        {(company.domains || ['General']).slice(0, 3).map(d => (
                                            <span key={d} className="tag-lite">{d}</span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <ProfessionalEmptyState
                                title="NO PLACEMENTS ACTIVE"
                                description="The recruitment pipeline is currently optimizing. Check back later for new company drives and interview schedules."
                                icon={<FaBriefcase />}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="placement-container">
            <header className="prep-header-premium">
                <button className="back-circle-btn" onClick={() => { setSelectedCompany(null); setSelectedDomain(null); }}>
                    <FaArrowLeft />
                </button>
                <div style={{ flex: 1 }}>
                    <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: '#1e293b' }}>
                        {selectedCompany.name} <span style={{ fontWeight: 400, color: '#94a3b8' }}>Ecosystem</span>
                    </h2>
                    <p style={{ margin: '0.3rem 0 0', fontSize: '1rem', color: '#64748b', fontWeight: 500 }}>{selectedCompany.hiringRole} • Prep Materials</p>
                </div>
                <div style={{ textAlign: 'right', padding: '0.75rem 1.5rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 950, color: selectedCompany.color }}>{selectedCompany.package}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase' }}>Top Package</div>
                </div>
            </header>

            <div className="prep-main-layout">
                <aside className="prep-sidebar-glass">
                    <h4 style={{ margin: '0 0 1.5rem', fontSize: '0.75rem', fontWeight: 900, color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase' }}>
                        Neural Filters
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {(selectedCompany.domains || ['General']).map(domain => (
                            <button
                                key={domain}
                                onClick={() => setSelectedDomain(domain)}
                                className={`domain-nav-item ${selectedDomain === domain ? 'active' : ''}`}
                            >
                                <div className="nav-icon">{getDomainIcon(domain)}</div>
                                <span className="nav-label">{domain}</span>
                                {selectedDomain === domain && <FaCheckCircle style={{ marginLeft: 'auto', fontSize: '0.9rem', color: '#6366f1' }} />}
                            </button>
                        ))}
                    </div>

                    <div className="prep-strategy-box">
                        <h5>🚀 AI STRATEGY</h5>
                        <p>Most students spend <strong>7.4 hours</strong> on software domains. Start with Aptitude for the screening round.</p>
                    </div>
                </aside>

                <main className="prep-content-area">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedDomain}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#1e293b' }}>
                                        {selectedDomain} Intelligence
                                    </h3>
                                    <p style={{ margin: '0.3rem 0 0', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>
                                        {getFilteredQuestions().length} High-Probability Questions
                                    </p>
                                </div>
                                <div className="secure-sync-badge">
                                    <FaCheckCircle /> SECURE SYNC
                                </div>
                            </div>

                            <div className="questions-container">
                                {getFilteredQuestions().map((q, idx) => (
                                    <QuestionCard key={idx} q={q} idx={idx} color={selectedCompany.color} />
                                ))}

                                {getFilteredQuestions().length === 0 && (
                                    <ProfessionalEmptyState
                                        title="PIPELINE EMPTY"
                                        description={`No specific data tags for the ${selectedDomain} domain in this ecosystem.`}
                                        icon={<FaUniversity />}
                                        theme="info"
                                    />
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default PlacementPrep;
