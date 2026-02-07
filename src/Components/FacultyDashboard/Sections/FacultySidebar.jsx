import React from 'react';
import {
    FaGraduationCap, FaEnvelope, FaSignOutAlt,
    FaLayerGroup, FaBolt, FaChartLine, FaUserCheck, FaBullhorn, FaShieldAlt, FaUserGraduate,
    FaRobot, FaClipboardList, FaPencilAlt, FaTimes, FaBookOpen, FaCalendarAlt,
    FaThLarge, FaBook, FaCog
} from 'react-icons/fa';
import './FacultySidebar.css';

/**
 * PREMIUM NEXUS SIDEBAR (FACULTY)
 * Updated to match Student Sidebar aesthetics (Sentinel Theme)
 */
const FacultySidebar = ({
    facultyData,
    view,
    setView,
    collapsed,
    setCollapsed,
    onLogout,
    onNavigate,
    getFileUrl
}) => {
    facultyData = facultyData || { facultyName: 'Faculty', department: 'Academic' };

    const handleItemClick = (id) => {
        setView(id);
        if (onNavigate) onNavigate();
    };

    const menuGroups = [
        {
            title: 'CORE',
            items: [
                { id: 'overview', label: 'Dashboard', icon: <FaThLarge /> },
                { id: 'messages', label: 'Messages', icon: <FaEnvelope /> },
                { id: 'broadcast', label: 'Announcements', icon: <FaBullhorn /> },
            ]
        },
        {
            title: 'ACADEMICS',
            items: [
                { id: 'curriculum', label: 'Curriculum', icon: <FaLayerGroup /> },
                { id: 'materials', label: 'Materials', icon: <FaBook /> },
                { id: 'assignments', label: 'Assignments', icon: <FaClipboardList /> },
                { id: 'marks', label: 'Marks', icon: <FaPencilAlt /> },
                { id: 'attendance', label: 'Attendance', icon: <FaUserCheck /> },
                { id: 'exams', label: 'Exams', icon: <FaShieldAlt /> },
                { id: 'schedule', label: 'Schedule', icon: <FaCalendarAlt /> },
                { id: 'students', label: 'Students', icon: <FaUserGraduate /> },
            ]
        },
        {
            title: 'ACCOUNT',
            items: [
                { id: 'settings', label: 'Settings', icon: <FaCog /> }
            ]
        }
    ];

    return (
        <aside className={`nexus-sidebar ${collapsed ? 'collapsed' : ''}`}>
            {/* Mobile Close Button - Only visible on mobile via CSS if needed, but we rely on parent overlay mainly. 
                However, keeping a close button inside sidebar is good for UX on mobile. 
                We'll add a specific class for it or rely on sidebar header toggle. 
            */}

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
                            <h1>FACULTY NODE</h1>
                            <span>Sentinel System</span>
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
                                onClick={() => handleItemClick(item.id)}
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
                                src={facultyData.profilePic ? getFileUrl(facultyData.profilePic) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${facultyData.facultyName || facultyData.name}`}
                                alt="Profile"
                                style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--v-border)' }}
                                onError={(e) => { e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${facultyData.facultyName || facultyData.name}`; }}
                            />
                            <div className="sidebar-status-beacon" style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', border: '2px solid white' }}></div>
                        </div>
                        <div className="user-profile-text">
                            <div className="u-name">{(facultyData.facultyName || facultyData.name || 'Faculty')}</div>
                            <div className="u-meta">{facultyData.department || 'ACADEMIC'}</div>
                        </div>
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
                    {!collapsed && <span className="fade-in">LOGOUT</span>}
                </button>
            </div>
        </aside>
    );
};

export default FacultySidebar;
