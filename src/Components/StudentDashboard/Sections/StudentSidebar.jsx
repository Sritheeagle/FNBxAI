import React from 'react';
import {
    FaGraduationCap, FaSignOutAlt, FaRocket, FaBook, FaChartBar, FaPen, FaShieldAlt, FaClipboardList, FaRobot, FaBriefcase, FaRoad, FaBullhorn, FaUniversity, FaHeadset, FaLayerGroup, FaBolt
} from 'react-icons/fa';
import './StudentSidebar.css';

/**
 * Student Sidebar
 * Collapsible sidebar for streamlined navigation.
 */
const StudentSidebar = ({
    userData,
    view,
    setView,
    collapsed,
    setCollapsed,
    onLogout,
    onNavigate,
    getFileUrl
}) => {

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

    const menuGroups = [
        {
            title: 'CORE',
            items: [
                { id: 'overview', label: 'Dashboard', icon: <FaLayerGroup /> },
                { id: 'tasks', label: 'Task List', icon: <FaClipboardList /> },
                { id: 'announcements', label: 'Announcements', icon: <FaBullhorn /> },
                { id: 'ai-agent', label: 'AI Tutor', icon: <FaBolt /> },
            ]
        },
        {
            title: 'ACADEMICS',
            items: [
                { id: 'semester', label: 'Classroom', icon: <FaBook /> },
                { id: 'journal', label: 'My Notes', icon: <FaPen /> },
                { id: 'marks', label: 'Grades & Results', icon: <FaChartBar /> },
                { id: 'attendance', label: 'Attendance Intel', icon: <FaClipboardList /> },
                { id: 'schedule', label: 'Daily Schedule', icon: <FaClipboardList /> },
                { id: 'faculty', label: 'My Faculty', icon: <FaGraduationCap /> },
                { id: 'exams', label: 'Exam Portal', icon: <FaShieldAlt /> },
            ]
        },
        {
            title: 'FINANCE',
            items: [
                { id: 'fees', label: 'College Fees', icon: <FaUniversity /> },
            ]
        },
        {
            title: 'PREPARATION',
            items: [
                { id: 'placement', label: 'Placement Prep', icon: <FaBriefcase /> },
                { id: 'roadmaps', label: 'Career Paths', icon: <FaRoad /> },
                { id: 'advanced', label: 'Skill Boost', icon: <FaRocket /> },
            ]
        },
        {
            title: 'ACCOUNT',
            items: [
                { id: 'settings', label: 'Settings', icon: <FaShieldAlt /> },
                { id: 'support', label: 'Support', icon: <FaHeadset /> },
            ]
        }
    ];

    return (
        <aside className={`nexus-sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div
                    className="brand-toggle"
                    onClick={() => setCollapsed(!collapsed)}
                    title={collapsed ? "Expand" : "Collapse"}
                >
                    <div className="brand-icon-box">
                        <FaGraduationCap />
                        <div className="sidebar-live-dot"></div>
                    </div>
                    {!collapsed && (
                        <div className="brand-text fade-in">
                            <h1>Friendly Notebook</h1>
                            <span>Student Dashboard</span>
                        </div>
                    )}
                </div>
            </div>

            <nav className="sidebar-nav">
                {menuGroups.map((group, gIdx) => (
                    <div key={gIdx} className="nav-group">
                        {!collapsed && <div className="group-title">{group.title}</div>}
                        {group.items.map(item => (
                            <button
                                key={item.id}
                                onClick={() => { setView(item.id); if (onNavigate) onNavigate(); }}
                                className={`nav-item ${view === item.id ? 'active' : ''}`}
                                title={collapsed ? item.label : ''}
                            >
                                <span className="nav-icon">{item.icon}</span>
                                {!collapsed && <span className="nav-label fade-in">{item.label}</span>}
                                {view === item.id && <div className="active-indicator"></div>}
                            </button>
                        ))}
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                {!collapsed && (
                    <div className="user-profile-mini fade-in">
                        <div className="sidebar-footer-avatar" style={{ position: 'relative' }}>
                            <img
                                src={userData.profilePic ? getFileUrl(userData.profilePic) : (userData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.studentName}`)}
                                alt="Profile"
                                style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--v-border)' }}
                                onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.studentName}`; }}
                            />
                            <div className="sidebar-status-beacon" style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', border: '2px solid white' }}></div>
                        </div>
                        <div className="user-profile-text">
                            <div className="u-name" style={{ fontWeight: 950, fontSize: '0.85rem' }}>{userData.studentName}</div>
                            <div className="u-meta" style={{ fontWeight: 800, fontSize: '0.65rem', color: 'var(--v-text-muted)' }}>{userData.sid} • Y{userData.year}</div>
                        </div>
                    </div>
                )}

                <button onClick={localHandleLogout} className="logout-btn" title="Logout">
                    <FaSignOutAlt />
                    {!collapsed && <span className="fade-in">LOGOUT</span>}
                </button>
            </div>
        </aside>
    );
};

export default StudentSidebar;
