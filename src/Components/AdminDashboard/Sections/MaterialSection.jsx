import React from 'react';
import { motion } from 'framer-motion';
import { FaPlus, FaEdit, FaTrash, FaEye, FaDownload, FaDatabase, FaBoxOpen } from 'react-icons/fa';

/**
/**
 * Material Repository
 * Repository for academic files and notes.
 */
const MaterialSection = ({ materials, openModal, handleDeleteMaterial, getFileUrl, allSubjects = [] }) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [subjectFilter, setSubjectFilter] = React.useState('All');
    const [sortKey, setSortKey] = React.useState('date');

    const filteredMaterials = React.useMemo(() => {
        let filtered = materials.filter(m => {
            const matchesSearch = (m.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (m.topic || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSubject = subjectFilter === 'All' || m.subject === subjectFilter;
            return matchesSearch && matchesSubject;
        });

        if (sortKey === 'title') {
            return filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        }
        return filtered.sort((a, b) => new Date(b.uploadedAt || 0) - new Date(a.uploadedAt || 0));
    }, [materials, searchTerm, subjectFilter, sortKey]);

    return (
        <div className="animate-fade-in">
            <header className="admin-page-header">
                <div className="admin-page-title">
                    <h1>ASSET <span>REPOSITORY</span></h1>
                    <p>Strategic management of academic data nodes and resources</p>
                </div>
                <div className="admin-action-bar" style={{ margin: 0 }}>
                    <button className="admin-btn admin-btn-primary" onClick={() => openModal('material')}>
                        <FaPlus /> UPLOAD ASSET
                    </button>
                </div>
            </header>

            {/* Asset Telemetry */}
            <div className="admin-stats-grid mb-lg">
                <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '0s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{ background: '#f5f3ff', color: '#8b5cf6', width: '50px', height: '50px', borderRadius: '14px' }}><FaDatabase /></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{materials.filter(m => m.type !== 'videos').length}</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>DOCUMENT NODES</div>
                </div>
                <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-1s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{ background: '#eff6ff', color: '#6366f1', width: '50px', height: '50px', borderRadius: '14px' }}><FaEye /></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{materials.filter(m => m.type === 'videos').length}</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>VIDEO STREAMS</div>
                </div>
            </div>

            <div className="admin-filter-bar">
                <div style={{ flex: 1 }}>
                    <input
                        className="admin-filter-select full-width"
                        placeholder="Search by title or topic..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ marginBottom: 0 }}
                    />
                </div>
                <select className="admin-filter-select" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} style={{ width: '250px', marginBottom: 0 }}>
                    <option value="All">All Subjects</option>
                    {allSubjects.map(s => <option key={s.code} value={s.name}>{s.name}</option>)}
                </select>
                <select className="admin-filter-select" value={sortKey} onChange={(e) => setSortKey(e.target.value)} style={{ width: '180px', marginBottom: 0 }}>
                    <option value="date">Latest Uploads</option>
                    <option value="title">Alphabetical</option>
                </select>
            </div>

            <div className="admin-card sentinel-floating">
                <div className="sentinel-scanner"></div>
                <div className="admin-table-wrap">
                    <table className="admin-grid-table">
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ fontWeight: 950, letterSpacing: '0.05em' }}>TITLE</th>
                                <th style={{ fontWeight: 950, letterSpacing: '0.05em' }}>SUBJECT</th>
                                <th style={{ fontWeight: 950, letterSpacing: '0.05em' }}>YEAR/SEC</th>
                                <th style={{ fontWeight: 950, letterSpacing: '0.05em' }}>TOPIC</th>
                                <th style={{ fontWeight: 950, letterSpacing: '0.05em' }}>TYPE</th>
                                <th style={{ fontWeight: 950, letterSpacing: '0.05em' }}>ACTIONS</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMaterials.map((m, idx) => (
                                <motion.tr
                                    key={m.id || m._id || idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                >
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <div className="summary-icon-box" style={{ width: '38px', height: '38px', borderRadius: '10px', fontSize: '0.9rem', background: '#f5f3ff', color: '#7c3aed' }}>
                                                {m.type === 'videos' ? <FaEye /> : <FaDatabase />}
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>{m.title}</div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', fontWeight: 500 }}>Uploaded by: {m.uploadedBy?.name || m.uploadedBy || 'Admin'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="admin-badge primary">{m.subject}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <span className="admin-badge primary" style={{ background: '#eff6ff', color: '#1e40af' }}>Y{m.year}</span>
                                            <span className="admin-badge primary" style={{ background: '#f0fdf4', color: '#15803d' }}>SEC {m.section}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{m.topic || 'General'}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--admin-text-muted)', fontWeight: 500 }}>MOD {m.module || 0} | UNIT {m.unit || 0}</div>
                                    </td>
                                    <td>
                                        <span className={`admin-badge ${m.type === 'videos' ? 'accent' : 'primary'}`} style={{ opacity: 0.8 }}>
                                            {(m.type || 'ASSET').toUpperCase()}
                                        </span>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button className="admin-action-btn" title="View" onClick={() => openModal('material-view', m)}><FaEye /></button>
                                            <button className="admin-action-btn secondary" title="Edit" onClick={() => openModal('material', m)}><FaEdit /></button>
                                            <button className="admin-action-btn danger" title="Delete" onClick={() => handleDeleteMaterial(m._id || m.id)}><FaTrash /></button>
                                            {(m.url || m.fileUrl) && (m.url !== '#' || m.fileUrl) && (
                                                <a
                                                    href={getFileUrl(m)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="admin-action-btn"
                                                    style={{ background: 'var(--admin-primary)', color: 'white', borderColor: 'var(--admin-primary)' }}
                                                    title="Download"
                                                >
                                                    <FaDownload />
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                            {filteredMaterials.length === 0 && (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '6rem' }}>
                                        <FaBoxOpen style={{ fontSize: '4rem', color: 'var(--admin-border)', marginBottom: '1.5rem', opacity: 0.5 }} />
                                        <div className="f-empty-text" style={{ fontWeight: 950, color: 'var(--admin-text-muted)' }}>NO MATERIALS FOUND</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MaterialSection;
