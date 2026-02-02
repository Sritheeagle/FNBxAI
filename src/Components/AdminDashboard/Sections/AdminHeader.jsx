import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaEnvelope, FaClipboardList, FaSignOutAlt,
    FaChartLine, FaUserGraduate, FaChalkboardTeacher, FaLayerGroup, FaBullhorn, FaRobot, FaCog, FaCalendarAlt, FaFileAlt, FaShieldAlt,
    FaBars, FaCreditCard, FaBriefcase
} from 'react-icons/fa';

/**
 * Admin Sidebar
 * Main navigation for admin system.
 * Theme: Friendly Notebook
 */
const AdminHeader = ({
    adminData = { name: 'System Administrator', role: 'Administrator' },
    view,
    setView,
    openModal,
    onLogout,
    collapsed,
    setCollapsed
}) => {
    // Proactive hardening for null prop usage
    adminData = adminData || { name: 'System Administrator', role: 'Administrator' };

    const localHandleLogout = (e) => {
        e.preventDefault();
        if (window.confirm('Are you sure you want to log out?')) {
            if (onLogout) {
                onLogout();
            } else {
                localStorage.clear();
                window.location.reload();
            }
        }
    };

    const navGroups = [
        {
            label: 'Core',
            items: [
                { id: 'overview', label: 'Dashboard', icon: <FaChartLine /> },
                { id: 'students', label: 'Students', icon: <FaUserGraduate /> },
                { id: 'faculty', label: 'Faculty', icon: <FaChalkboardTeacher /> },
                { id: 'courses', label: 'Academic Hub', icon: <FaLayerGroup /> },
            ]
        },
        {
            label: 'Management',
            items: [
                { id: 'marks', label: 'Marks & Grades', icon: <FaFileAlt /> },
                { id: 'attendance', label: 'Attendance', icon: <FaClipboardList /> },
                { id: 'schedule', label: 'Schedule', icon: <FaCalendarAlt /> },
                { id: 'exams', label: 'Exams', icon: <FaFileAlt /> },
                { id: 'materials', label: 'Materials', icon: <FaLayerGroup /> },
                { id: 'placements', label: 'Placements', icon: <FaBriefcase /> },
                { id: 'fees', label: 'Finance', icon: <FaCreditCard /> },
            ]
        },
        {
            label: 'Communications',
            items: [
                { id: 'todos', label: 'Tasks', icon: <FaClipboardList /> },
                { id: 'broadcast', label: 'Announcements', icon: <FaBullhorn /> },
                { id: 'messages', label: 'Messages', icon: <FaEnvelope /> },
                { id: 'ai-agent', label: 'AI Assistant', icon: <FaRobot /> },
            ]
        }
    ];

    return (
        <motion.aside
            className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}
            initial={false}
            animate={{ width: collapsed ? 90 : 280 }}
            transition={{
                type: 'tween',
                duration: 0.2,
                ease: 'easeInOut'
            }}
        >
            <div className="admin-sidebar-header">
                <motion.div
                    className="admin-brand-group"
                    onClick={() => setCollapsed(!collapsed)}
                    layout
                >
                    <motion.div className="admin-brand-icon" layout>
                        {collapsed ? <FaBars /> : <FaShieldAlt />}
                    </motion.div>
                    <AnimatePresence>
                        {!collapsed && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="fade-in-text"
                            >
                                <h1 className="admin-brand-name">FNB Admin</h1>
                                <span className="admin-brand-subtitle">Friendly Notebook</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            <nav className="admin-nav" style={{ padding: collapsed ? '1rem 0.75rem' : '1.5rem' }}>
                {navGroups.map((group, idx) => (
                    <div key={idx} className="admin-nav-group">
                        <AnimatePresence>
                            {!collapsed && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="admin-nav-label"
                                >
                                    {group.label}
                                </motion.span>
                            )}
                        </AnimatePresence>
                        {group.items.map(item => (
                            <motion.div
                                key={item.id}
                                onClick={() => setView(item.id)}
                                className={`
                                    admin-nav-item 
                                    ${view === item.id ? 'active' : ''}
                                    ${item.id === 'ai-agent' ? 'ai-core-item' : ''}
                                `}
                                layout
                                whileHover={{ x: 5 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="nav-icon">{item.icon}</div>
                                <AnimatePresence>
                                    {!collapsed && (
                                        <motion.span
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            className="nav-item-label"
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                {!collapsed && item.id === 'ai-agent' && <div className="ai-pulse-dot"></div>}
                            </motion.div>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="admin-sidebar-footer" style={{ padding: collapsed ? '1rem' : '1.5rem' }}>
                <AnimatePresence>
                    {!collapsed && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="admin-user-profile"
                        >
                            <div className="user-name">{adminData.name}</div>
                            <div className="user-role">{adminData.role}</div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <motion.button
                    onClick={() => openModal('about')}
                    className="admin-btn admin-btn-outline full-width"
                    layout
                >
                    <FaCog /> {!collapsed && "SETTINGS"}
                </motion.button>

                <motion.button
                    onClick={localHandleLogout}
                    className="admin-btn admin-btn-danger full-width"
                    layout
                >
                    <FaSignOutAlt /> {!collapsed && "LOGOUT"}
                </motion.button>
            </div>
        </motion.aside>
    );
};

export default AdminHeader;
