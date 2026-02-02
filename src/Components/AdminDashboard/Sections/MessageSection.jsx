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
                    <h1>MESSAGES <span>& ANNOUNCEMENTS</span></h1>
                    <p>Total Messages: {messages.length}</p>
                </div>
                <div className="admin-action-bar" style={{ margin: 0 }}>
                    <button className="admin-btn admin-btn-primary" onClick={() => openModal('message')}>
                        <FaBroadcastTower /> NEW ANNOUNCEMENT
                    </button>
                </div>
            </header>

            <div className="admin-list-container">
                {messages.map((msg, i) => (
                    <div key={msg.id || i} className="admin-card animate-slide-up" style={{ animationDelay: `${i * 0.05}s`, marginBottom: '1rem', borderLeft: msg.type === 'urgent' ? '4px solid var(--admin-danger)' : '1px solid var(--admin-border)' }}>
                        <div className="admin-msg-meta" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                                <span className={`admin-badge ${msg.target === 'all' ? 'success' : 'primary'}`}>
                                    {(msg.target || 'ANNOUNCEMENT').toUpperCase()}
                                </span>
                                {msg.type === 'urgent' && (
                                    <span className="admin-badge accent" style={{ background: '#fecdd3', color: '#be123c' }}>URGENT</span>
                                )}
                                {msg.targetYear && <span className="admin-badge secondary">YEAR {msg.targetYear}</span>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontWeight: 600 }}>
                                <FaClock /> {new Date(msg.createdAt || msg.date).toLocaleString()}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--admin-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-primary)', fontSize: '0.9rem' }}>
                                <FaUserShield />
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--admin-secondary)' }}>
                                {msg.facultyId ? `Faculty: ${msg.sender || msg.facultyId}` : 'Admin'}
                            </div>
                        </div>

                        <div className="admin-msg-body" style={{ color: 'var(--admin-text)', fontSize: '0.95rem', lineHeight: '1.6', fontWeight: 500 }}>
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
