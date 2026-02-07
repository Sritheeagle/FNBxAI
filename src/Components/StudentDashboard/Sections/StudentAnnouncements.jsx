import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBullhorn, FaUniversity, FaChalkboardTeacher, FaCalendarAlt, FaExclamationCircle, FaInfoCircle, FaCheckCircle, FaBell } from 'react-icons/fa';
import './StudentAnnouncements.css';
import ProfessionalEmptyState from './ProfessionalEmptyState';

const StudentAnnouncements = ({ messages = [], userData }) => {
    // Proactive hardening
    userData = userData || { year: '1', section: 'A', branch: 'CSE' };

    // Helper: Check if comma-separated value matches
    const matchesField = (fieldValue, targetValue) => {
        if (!fieldValue) return true; // If not specified, match all
        const values = String(fieldValue).toUpperCase().split(/[,\s]+/).map(v => v.trim());
        const target = String(targetValue).toUpperCase().trim();
        return values.includes('ALL') || values.includes(target) || values.some(v => v === target);
    };

    const sortedMessages = useMemo(() => {
        // Filter messages relevant to the student (already filtered by backend API usually, but double check)
        return messages.filter(msg => {
            if (msg.target === 'all') return true;
            if (msg.target === 'students') return true;
            if (msg.target === 'students-specific') {
                const yearMatch = !msg.targetYear || String(msg.targetYear) === String(userData.year);
                const sectionMatch = !msg.targetSections || msg.targetSections.length === 0 || msg.targetSections.includes(userData.section);
                const branchMatch = matchesField(msg.targetBranch, userData.branch);
                return yearMatch && sectionMatch && branchMatch;
            }
            return false;
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }, [messages, userData]);

    const getIcon = (type) => {
        switch (type) {
            case 'urgent': return <FaExclamationCircle className="sa-icon urgent" />;
            case 'warning': return <FaExclamationCircle className="sa-icon warning" />;
            case 'success': return <FaCheckCircle className="sa-icon success" />;
            default: return <FaInfoCircle className="sa-icon info" />;
        }
    };

    const getSenderIcon = (role) => {
        if (role === 'admin' || role === 'system') return <FaUniversity />;
        return <FaChalkboardTeacher />;
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Recently'; // Fallback for invalid date
            return new Intl.DateTimeFormat('en-US', {
                month: 'short', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            }).format(date);
        } catch (e) {
            return 'Recently';
        }
    };

    return (
        <div className="sa-container">
            <header className="sa-header">
                <div>
                    <h2 className="sa-title">
                        <FaBullhorn /> Campus <span>Broadcasts</span>
                    </h2>
                    <p className="sa-subtitle">Official announcements from Admin & Faculty</p>
                </div>
                <div className="sa-badge">
                    <FaBell /> {sortedMessages.length} Messages
                </div>
            </header>

            <div className="sa-grid">
                <AnimatePresence>
                    {sortedMessages.length > 0 ? (
                        sortedMessages.map((msg, index) => (
                            <motion.div
                                key={msg._id || index}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className={`sa-card sentinel-floating ${msg.type || 'info'}`}
                                style={{ animationDelay: `${index * -0.5}s`, position: 'relative', overflow: 'hidden' }}
                            >
                                <div className="sentinel-scanner" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: msg.type === 'urgent' ? '#ef4444' : 'var(--v-primary)', opacity: 0.2 }}></div>
                                <div className="sa-card-header">
                                    <div className="sa-sender-info">
                                        <div className={`sa-avatar ${msg.senderRole || 'admin'}`} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                                            {getSenderIcon(msg.senderRole)}
                                        </div>
                                        <div>
                                            <span className="sa-sender-name" style={{ fontWeight: 950, fontSize: '0.9rem', color: '#1e293b' }}>{msg.sender?.toUpperCase() || 'ADMINISTRATION'}</span>
                                            <span className="sa-sender-role" style={{ fontWeight: 850, fontSize: '0.6rem', color: '#64748b' }}>{msg.senderRole === 'faculty' ? 'FACULTY NODE' : 'SYSTEM OVERSEER'}</span>
                                        </div>
                                    </div>
                                    <div className="sa-time" style={{ fontWeight: 850, fontSize: '0.65rem', color: '#94a3b8' }}>
                                        <FaCalendarAlt /> {formatDate(msg.createdAt).toUpperCase()}
                                    </div>
                                </div>

                                <div className="sa-content" style={{ marginTop: '1.5rem' }}>
                                    {msg.subject && <h3 className="sa-msg-subject" style={{ fontWeight: 950, color: '#1e293b', fontSize: '1.1rem', marginBottom: '0.75rem' }}>{msg.subject}</h3>}
                                    <p className="sa-msg-text" style={{ fontSize: '0.9rem', lineHeight: '1.6', color: '#4d5c6f' }}>{msg.message}</p>
                                </div>

                                <div className="sa-footer" style={{ marginTop: '1.5rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                                    <span className={`sa-type-badge ${msg.type || 'info'}`} style={{ fontWeight: 950, fontSize: '0.6rem', letterSpacing: '0.05em' }}>
                                        {getIcon(msg.type)} {(msg.type || 'Notice').toUpperCase()}
                                    </span>
                                    {msg.target === 'students-specific' && (
                                        <span className="sa-target-badge" style={{ fontWeight: 850, fontSize: '0.6rem', color: '#94a3b8' }}>
                                            SECTOR: {msg.targetBranch ? `${msg.targetBranch} • ` : ''}YEAR {msg.targetYear}{msg.targetSections?.length > 0 ? ` • SEC ${msg.targetSections.join(', ')}` : ''}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <ProfessionalEmptyState
                            title="ALL CLEAR"
                            description="You're all caught up! No active broadcasts found in your sector. Check back later for official updates."
                            icon={<FaCheckCircle />}
                            theme="success"
                        />
                    )}
                </AnimatePresence>
            </div>

        </div>
    );
};

export default StudentAnnouncements;
