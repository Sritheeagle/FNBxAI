import React from 'react';
import { FaBullhorn } from 'react-icons/fa';
import { motion } from 'framer-motion';
import '../FacultyDashboard.css';

const FacultyMessages = ({ messages }) => {
    // Safety check
    messages = messages || [];
    return (
        <div className="animate-fade-in">
            <div className="nexus-mesh-bg"></div>
            <header className="f-view-header">
                <div>
                    <h2>ADMINISTRATIVE <span>NOTICES</span></h2>
                    <p className="nexus-subtitle">Official communications from administration</p>
                </div>
            </header>
            <div className="f-messages-container" style={{ marginTop: '2.5rem' }}>
                {messages.length > 0 ? (
                    <div className="f-message-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                        {messages.map((msg, i) => (
                            <motion.div
                                key={msg.id || i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="f-node-card message-node"
                                style={{
                                    padding: '2rem',
                                    borderLeft: '6px solid var(--accent-primary)',
                                    background: 'rgba(255,255,255,0.8)',
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <div className="f-tag-badge" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--accent-primary)' }}>
                                        {msg.target?.toUpperCase() || 'GLOBAL NOTICE'}
                                    </div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8' }}>
                                        {new Date(msg.createdAt || msg.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 850, color: '#1e293b', lineHeight: 1.6, marginBottom: '1rem' }}>
                                    {msg.message || msg.text}
                                </div>
                                <div style={{ height: '3px', width: '40px', background: 'var(--accent-primary)', borderRadius: '10px' }}></div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <div className="f-node-card f-center-empty" style={{ padding: '6rem 2rem' }}>
                        <FaBullhorn style={{ fontSize: '4rem', color: '#cbd5e1', marginBottom: '2rem', opacity: 0.5 }} />
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 950, color: '#1e293b' }}>No Administrative Notices</h3>
                        <p style={{ color: '#94a3b8', fontWeight: 850, marginTop: '1rem' }}>Official communications will appear here when issued.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FacultyMessages;
