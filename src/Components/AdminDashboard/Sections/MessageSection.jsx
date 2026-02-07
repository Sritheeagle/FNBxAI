import React from 'react';
import { FaEnvelope, FaBroadcastTower, FaUserShield, FaClock } from 'react-icons/fa';

/**
 * Communications Center
 * Hub for messages and global announcements.
 */
const MessageSection = ({ messages, openModal }) => {
    return (
        <div className="animate-fade-in">
            <header className="admin-page-header">
                <div className="admin-page-title">
                    <h1>S-LINK <span>COMMUNICATIONS</span></h1>
                    <p>Strategic signal broadcast and administrative relay</p>
                </div>
                <div className="admin-action-bar" style={{ margin: 0 }}>
                    <button className="admin-btn admin-btn-primary" onClick={() => openModal('message')}>
                        <FaBroadcastTower /> NEW TRANSMISSION
                    </button>
                </div>
            </header>

            {/* Signal Telemetry */}
            <div className="admin-stats-grid mb-lg">
                <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '0s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{ background: '#f5f3ff', color: '#8b5cf6', width: '50px', height: '50px', borderRadius: '14px' }}><FaBroadcastTower /></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{messages.filter(m => m.type === 'announcement' || m.type === 'info').length}</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>GLOBAL SIGNALS</div>
                </div>
                <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-1s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="summary-icon-box" style={{ background: '#fee2e2', color: '#ef4444', width: '50px', height: '50px', borderRadius: '14px' }}><FaEnvelope /></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{messages.filter(m => m.type === 'urgent' || m.priority === 'high').length}</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>URGENT RELAYS</div>
                </div>
            </div>

            <div className="admin-list-container">
                {messages.map((msg, i) => (
                    <div key={msg.id || i} className="admin-card sentinel-floating" style={{ animationDelay: `${i * 0.05}s`, marginBottom: '1rem', borderLeft: msg.type === 'urgent' ? '4px solid #ef4444' : '1px solid #e2e8f0' }}>
                        <div className="sentinel-scanner"></div>
                        <div className="admin-msg-meta" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                                <span className={`admin-badge ${msg.target === 'all' ? 'success' : 'primary'}`} style={{ fontWeight: 950, fontSize: '0.6rem' }}>
                                    {(msg.target || 'ANNOUNCEMENT').toUpperCase()}
                                </span>
                                {msg.type === 'urgent' && (
                                    <span className="admin-badge accent" style={{ background: '#ef4444', color: 'white', fontWeight: 950, fontSize: '0.6rem' }}>URGENT</span>
                                )}
                                {msg.targetYear && <span className="admin-badge secondary" style={{ fontWeight: 950, fontSize: '0.6rem' }}>YEAR {msg.targetYear}</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700 }}>
                                <FaClock /> {new Date(msg.createdAt || msg.date).toLocaleString()}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontSize: '1rem' }}>
                                <FaUserShield />
                            </div>
                            <div style={{ fontWeight: 950, fontSize: '0.9rem', color: '#1e293b' }}>
                                {msg.facultyId ? `Personnel Ref: ${msg.sender || msg.facultyId}` : 'Nexus Control'}
                            </div>
                        </div>

                        <div className="admin-msg-body" style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', fontWeight: 650 }}>
                            {msg.message || msg.text}
                        </div>
                    </div>
                ))}

                {messages.length === 0 && (
                    <div className="admin-empty-state">
                        <FaEnvelope className="admin-empty-icon" />
                        <h2 className="admin-empty-title">No Messages</h2>
                        <p className="admin-empty-text">No announcements or messages found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageSection;
