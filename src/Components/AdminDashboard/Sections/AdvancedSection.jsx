import React from 'react';
import { FaPlus, FaEye, FaMicrochip, FaCode } from 'react-icons/fa';

/**
/**
 * Advanced Studies
 * Manage specialized advanced topics and materials.
 */
const AdvancedSection = ({ topics, materials, openModal }) => {
    return (
        <div className="animate-fade-in">
            <header className="admin-page-header">
                <div className="admin-page-title">
                    <h1>ADVANCED <span>TOPICS</span></h1>
                    <p>Manage specialized topics.</p>
                </div>
                <div className="admin-action-bar" style={{ margin: 0 }}>
                    <button className="admin-btn admin-btn-primary" onClick={() => openModal('material', { isAdvanced: true })}>
                        <FaPlus /> ADD MATERIAL
                    </button>
                </div>
            </header>

            <div className="admin-grid">
                {topics.map(topic => {
                    const count = materials.filter(m => m.subject === topic).length;
                    return (
                        <div key={topic} className="admin-summary-card animate-slide-up" style={{ padding: '1.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div className="summary-icon-box" style={{ background: '#f5f3ff', color: 'var(--admin-primary)', width: '40px', height: '40px' }}>
                                        <FaMicrochip size={18} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, color: 'var(--admin-secondary)', fontSize: '1.1rem', fontWeight: 950 }}>{topic}</h3>
                                        <div style={{ fontSize: '0.65rem', color: 'var(--admin-text-muted)', fontWeight: 850 }}>SPECIALIZATION</div>
                                    </div>
                                </div>
                                <span className={`admin-badge ${count > 0 ? 'primary' : 'secondary'}`}>
                                    {count} ITEMS
                                </span>
                            </div>

                            <div style={{ marginTop: '2rem', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                                <button className="admin-btn admin-btn-outline" onClick={() => openModal('syllabus-view', { name: topic, isAdvanced: true })}>
                                    <FaEye /> VIEW
                                </button>
                                <button className="admin-btn admin-btn-primary" onClick={() => openModal('material', { subject: topic, isAdvanced: true })}>
                                    <FaPlus /> ADD
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AdvancedSection;
