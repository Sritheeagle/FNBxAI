import React from 'react';
import {
    FaGraduationCap, FaEnvelope, FaSignOutAlt,
    FaLayerGroup, FaBolt, FaChartLine, FaUserCheck, FaBullhorn, FaShieldAlt, FaUserGraduate,
    FaRobot, FaClipboardList, FaPencilAlt, FaTimes, FaBookOpen, FaCalendarAlt,
    FaThLarge, FaBook, FaCog
} from 'react-icons/fa';

/**
 * PREMIUM NEXUS SIDEBAR (FACULTY)
 */
const FacultySidebar = ({
    facultyData,
    view,
    setView,
    collapsed,
    setCollapsed,
    onLogout,
    onNavigate
}) => {
    facultyData = facultyData || { facultyName: 'Faculty', department: 'Academic' };

    const handleItemClick = (id) => {
        setView(id);
        if (onNavigate) onNavigate();
    };

    const navItems = [
        { id: 'overview', label: 'Dashboard', icon: <FaThLarge /> },
        { id: 'materials', label: 'Materials', icon: <FaBook /> },
        { id: 'assignments', label: 'Assignments', icon: <FaClipboardList /> },
        { id: 'marks', label: 'Marks', icon: <FaPencilAlt /> },
        { id: 'attendance', label: 'Attendance', icon: <FaUserCheck /> },
        { id: 'exams', label: 'Exams', icon: <FaShieldAlt /> },
        { id: 'schedule', label: 'Schedule', icon: <FaCalendarAlt /> },
        { id: 'students', label: 'Students', icon: <FaUserGraduate /> },
        { id: 'curriculum', label: 'Curriculum', icon: <FaLayerGroup /> },
        { id: 'broadcast', label: 'Announcements', icon: <FaBullhorn /> },
        { id: 'messages', label: 'Messages', icon: <FaEnvelope /> },
        { id: 'settings', label: 'Settings', icon: <FaCog /> }
    ];

    return (
        <aside className={`nexus-sidebar ${collapsed ? 'collapsed' : ''}`}>
            <button className="mobile-close-btn" onClick={onNavigate}><FaTimes /></button>

            <div className="sidebar-header">
                <div className="brand-box" onClick={() => setCollapsed(!collapsed)}>
                    <div className="brand-icon-box">
                        <FaGraduationCap />
                    </div>
                    {!collapsed && (
                        <div className="brand-text">
                            <h1>FACULTY</h1>
                            <span>SENTINEL NODE</span>
                        </div>
                    )}
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => handleItemClick(item.id)}
                        className={`nav-item ${view === item.id ? 'active' : ''}`}
                        title={collapsed ? item.label : ''}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {!collapsed && <span className="nav-label">{item.label}</span>}
                        {view === item.id && <div className="active-dot"></div>}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                {!collapsed && (
                    <div className="user-profile-mini">
                        <div className="u-name">{(facultyData.facultyName || 'Faculty')}</div>
                        <div className="u-meta">{facultyData.department || 'ACADEMIC'}</div>
                    </div>
                )}
                <button
                    onClick={() => {
                        if (window.confirm('Terminate faculty session?')) onLogout();
                    }}
                    className="logout-btn"
                    title="Logout"
                >
                    <FaSignOutAlt />
                    {!collapsed && <span>LOGOUT</span>}
                </button>
            </div>
        </aside>
    );
};

export default FacultySidebar;
