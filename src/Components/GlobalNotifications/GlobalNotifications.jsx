import React, { useState, useEffect } from 'react';
import { FaUserPlus, FaBook, FaBullhorn, FaTimes, FaBell } from 'react-icons/fa';
import sseClient from '../../utils/sseClient';
import { motion, AnimatePresence } from 'framer-motion';
import './GlobalNotifications.css';

const GlobalNotifications = ({ userRole, userData }) => {
    const [notifications, setNotifications] = useState([]);
    const [activeTransmission, setActiveTransmission] = useState(null);

    useEffect(() => {
        const unsubscribe = sseClient.onUpdate((data) => {
            handleNotification(data);
        });
        return () => unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userRole, userData]);

    const handleNotification = (data) => {
        let newNotif = null;
        const timestamp = new Date().toLocaleTimeString();

        // -----------------------------
        // 1. STUDENT CREATED EVENTS
        // -----------------------------
        if (data.resource === 'students' && data.action === 'create') {
            const student = data.data;

            // Admin: Always sees this
            if (userRole === 'admin') {
                newNotif = {
                    id: Date.now(),
                    type: 'info',
                    iconType: 'user-plus',
                    title: 'INTELLIGENCE SYNC',
                    message: `New Student: ${student.studentName} has initialized in sector Year ${student.year} (${student.branch} - Sec ${student.section})`,
                    time: timestamp
                };
            }
            // Faculty: Sees if student is in their class sections
            else if (userRole === 'faculty' && userData?.assignments) {
                // Check if faculty teaches this year/section
                // assignments example: [{ year: '2', section: 'A' }, ...]
                const isRelevant = userData.assignments.some(a =>
                    String(a.year) === String(student.year) &&
                    (a.section === 'All' || a.section === student.section)
                );

                if (isRelevant) {
                    newNotif = {
                        id: Date.now(),
                        type: 'success',
                        iconType: 'user-plus',
                        title: 'PERSONNEL UPLINK',
                        message: `New Subject: ${student.studentName} has been assigned to your sector (Year ${student.year} Section ${student.section}).`,
                        time: timestamp
                    };
                }
            }
        }

        // -----------------------------
        // 2. MATERIAL UPLOAD EVENTS
        // -----------------------------
        if (data.resource === 'materials' && data.action === 'create') {
            const material = data.data;

            // Admin: Sees upload log
            if (userRole === 'admin') {
                newNotif = {
                    id: Date.now(),
                    type: 'info',
                    iconType: 'book',
                    title: 'KNOWLEDGE UPLOAD',
                    message: `Faculty uploaded "${material.title}" for tactical sector Year ${material.year} ${material.subject}.`,
                    time: timestamp
                };
            }
            // Student: Sees if it matches their year/section
            else if (userRole === 'student' && userData) {
                const yearMatch = String(userData.year) === String(material.year);
                const branchMatch = !material.branch || material.branch === 'All' || material.branch === userData.branch;
                const sectionMatch = !material.section || material.section === 'All' || material.section === userData.section;

                if (yearMatch && branchMatch && sectionMatch) {
                    newNotif = {
                        id: Date.now(),
                        type: 'accent',
                        iconType: 'book',
                        title: 'New Study Material',
                        message: `New Notes: "${material.title}" available in ${material.subject}.`,
                        time: timestamp
                    };
                }
            }
        }

        // -----------------------------
        // 3. BROADCAST MESSAGES
        // -----------------------------
        if (data.resource === 'messages' && (data.action === 'create' || data.action === 'broadcast')) {
            const msg = data.data;
            // Filter based on target
            let show = false;

            if (userRole === 'admin') show = true;
            else if (msg.target === 'all') show = true;
            else if (msg.target === 'students' && userRole === 'student') show = true;
            else if (msg.target === 'faculty' && userRole === 'faculty') show = true;
            else if (msg.target === 'students-specific' && userRole === 'student') {
                const yearMatch = String(userData?.year) === String(msg.targetYear);
                const sectionMatch = !msg.targetSections || msg.targetSections.length === 0 ||
                    msg.targetSections.includes(String(userData?.section)) ||
                    msg.targetSections.includes('All');
                if (yearMatch && sectionMatch) show = true;
            }

            if (show) {
                newNotif = {
                    id: Date.now(),
                    type: msg.senderRole === 'faculty' ? 'success' : 'warning',
                    iconType: 'bullhorn',
                    title: msg.senderRole === 'faculty' ? 'Faculty Announcement' : 'System Announcement',
                    message: msg.message || msg.text,
                    time: timestamp
                };
            }
        }

        // -----------------------------
        // 4. SENTINEL TRANSMISSIONS
        // -----------------------------
        if (data.resource === 'transmission' && data.action === 'active') {
            const trans = data.data;
            // High-priority transmissions take over the screen
            if (trans.target === 'all' ||
                (trans.target === 'students' && userRole === 'student') ||
                (trans.target === 'faculty' && userRole === 'faculty')) {
                setActiveTransmission(trans);

                // Also add to history if needed, but primary is the overlay
                // Auto-clear after 10 seconds if it's not and emergency
                if (trans.type !== 'emergency') {
                    setTimeout(() => setActiveTransmission(null), 10000);
                }
            }
        }

        if (newNotif) {
            addNotification(newNotif);
        }
    };

    const addNotification = (notif) => {
        setNotifications(prev => {
            // Remove duplicates by message content if recent
            const isDuplicate = prev.some(n => n.message === notif.message && (Date.now() - n.id < 5000));
            if (isDuplicate) return prev;
            return [notif, ...prev].slice(0, 5); // Keep max 5
        });

        // Auto remove after 7 seconds
        setTimeout(() => {
            removeNotification(notif.id);
        }, 7000);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    if (notifications.length === 0) return null;

    return (
        <div className="global-notification-container">
            <AnimatePresence initial={false}>
                {notifications.map(n => {
                    const getIcon = () => {
                        switch (n.iconType) {
                            case 'user-plus': return <FaUserPlus />;
                            case 'book': return <FaBook />;
                            case 'bullhorn': return <FaBullhorn />;
                            default: return <FaBell />;
                        }
                    };

                    return (
                        <motion.div
                            key={n.id}
                            layout
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                            className={`glass-toast toast-${n.type}`}
                            style={{ position: 'relative', overflow: 'hidden' }}
                        >
                            <div className="sentinel-scanner" style={{ opacity: 0.15 }}></div>
                            <div className="toast-icon-box" style={{ borderRadius: '10px' }}>
                                {getIcon()}
                            </div>
                            <div className="toast-content">
                                <div className="toast-header">
                                    <span className="toast-title" style={{ fontWeight: 950, letterSpacing: '0.05em' }}>{n.title.toUpperCase()}</span>
                                    <span className="toast-time">{n.time}</span>
                                </div>
                                <div className="toast-message" style={{ fontWeight: 600, fontSize: '0.8rem' }}>{n.message}</div>
                            </div>
                            <button className="toast-close" onClick={() => removeNotification(n.id)}>
                                <FaTimes />
                            </button>
                        </motion.div>
                    );
                })}
            </AnimatePresence>

            {/* HIGH IMPACT SENTINEL TRANSMISSION OVERLAY */}
            <AnimatePresence>
                {activeTransmission && (
                    <motion.div
                        className={`sentinel-transmission-overlay p-${activeTransmission.priority} type-${activeTransmission.type}`}
                        initial={{ opacity: 0, scale: 1.1, backdropFilter: 'blur(0px)' }}
                        animate={{ opacity: 1, scale: 1, backdropFilter: 'blur(10px)' }}
                        exit={{ opacity: 0, scale: 0.9, backdropFilter: 'blur(0px)' }}
                    >
                        <div className="transmission-scanner"></div>
                        <div className="transmission-content">
                            <div className="transmission-glitch-header" data-text={activeTransmission.title}>
                                {activeTransmission.title}
                            </div>
                            <div className="transmission-status-bar">
                                <div className="pulse-dot"></div>
                                <span>LIVE UPLINK: {new Date(activeTransmission.timestamp).toLocaleTimeString()}</span>
                                <div className="transmission-divider"></div>
                                <span>PRIORITY: {activeTransmission.priority.toUpperCase()}</span>
                            </div>
                            <div className="transmission-body">
                                {activeTransmission.message}
                            </div>
                            <div className="transmission-footer">
                                <button className="acknowledge-btn" onClick={() => setActiveTransmission(null)}>
                                    ACKNOWLEDGE TRANSMISSION
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default GlobalNotifications;
