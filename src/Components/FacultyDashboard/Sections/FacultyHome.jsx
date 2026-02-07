import React from 'react';
import {
    FaUserGraduate, FaLayerGroup, FaFileAlt, FaEye, FaHistory,
    FaBullhorn, FaBookReader, FaChalkboardTeacher, FaCalendarAlt, FaRobot, FaVideo
} from 'react-icons/fa';
import './FacultyHome.css';

/**
 * FACULTY DASHBOARD (OVERVIEW)
 */
const FacultyHome = ({
    studentsList = [],
    materialsList = [],
    myClasses = [],
    schedule = [],
    facultyData = {},
    messages = [],
    getFileUrl,
    setView,
    openAiWithPrompt,
    currentTime = new Date()
}) => {
    const getGreetingDetails = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return { msg: "Good Morning", icon: "🌅" };
        if (hour < 17) return { msg: "Good Afternoon", icon: "☀️" };
        return { msg: "Good Evening", icon: "🌙" };
    };

    const nextClass = React.useMemo(() => {
        if (!schedule.length) return null;
        const now = currentTime;
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDay = days[now.getDay()];
        const timeInMinutes = now.getHours() * 60 + now.getMinutes();

        // Sort schedule by time
        const todayClasses = schedule
            .filter(c => c.day === currentDay)
            .sort((a, b) => {
                const [hA, mA] = a.startTime.split(':').map(Number);
                const [hB, mB] = b.startTime.split(':').map(Number);
                return (hA * 60 + mA) - (hB * 60 + mB);
            });

        // Find next or current
        return todayClasses.find(c => {
            const [h, m] = c.startTime.split(':').map(Number);
            return (h * 60 + m) > timeInMinutes;
        }) || todayClasses[0];
    }, [schedule, currentTime]);

    const studentCount = studentsList.length;
    const courseCount = myClasses.length;
    const resourceCount = materialsList.length;

    return (
        <div className="faculty-home-viewport">
            <div className="faculty-bento-grid">
                {/* 🚀 Welcome Hero */}
                <div className="f-bento-card f-bento-hero animate-bento sentinel-floating">
                    <div className="sentinel-scanner"></div>
                    <div className="hero-faculty-greeting">
                        <div className="f-tag-badge" style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none' }}>
                            {getGreetingDetails().icon} {getGreetingDetails().msg} • {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </div>
                        <h2>Welcome, <span>Prof. {(facultyData.facultyName || facultyData.name || 'Faculty').split(' ')[0]}</span></h2>
                        <p>
                            You have <strong>{courseCount} active courses</strong> this semester.
                            Currently supervising <strong>{studentCount} students</strong> across {courseCount} sections.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1.2rem' }}>
                            {myClasses.map(c => (
                                <div key={c.id} style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '12px',
                                    fontSize: '0.75rem',
                                    fontWeight: 700,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    backdropFilter: 'blur(5px)'
                                }}>
                                    <span style={{ color: '#818cf8' }}>{c.subject}</span> • Year {c.year} • Sec {c.sections.join(', ')}
                                </div>
                            ))}
                        </div>
                        <div className="hero-quick-actions">
                            <button className="nexus-btn-primary" onClick={() => setView('attendance')} style={{ padding: '0.9rem 2rem' }}>
                                Take Attendance
                            </button>
                            <button className="f-quick-btn outline" onClick={() => setView('broadcast')}>
                                <FaBullhorn /> Broadcast
                            </button>
                            <button
                                className="f-quick-btn outline"
                                onClick={() => {
                                    const classList = myClasses.map(c => `${c.subject} (Year ${c.year})`).join(', ');
                                    const prompt = `I am Prof. ${facultyData.facultyName}. I am teaching ${classList}. I have ${studentCount} students under my supervision. Can you give me some insights on how to optimize my teaching schedule and resource distribution?`;
                                    openAiWithPrompt(prompt);
                                }}
                            >
                                <FaRobot /> AI Insights
                            </button>
                        </div>
                    </div>
                </div>



                {/* 📊 Total Students Stat */}
                <div className="f-bento-card f-bento-stat animate-bento sentinel-floating" style={{ animationDelay: '0s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="f-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                        <FaUserGraduate />
                    </div>
                    <div className="f-stat-info">
                        <div className="f-stat-value">{studentCount}</div>
                        <div className="f-stat-label">SUPERVISED NODES</div>
                    </div>
                </div>

                <div className="f-bento-card f-bento-stat animate-bento sentinel-floating" style={{ animationDelay: '-1.5s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="f-stat-icon" style={{ background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                        <FaLayerGroup />
                    </div>
                    <div className="f-stat-info">
                        <div className="f-stat-value">{resourceCount}</div>
                        <div className="f-stat-label">KNOWLEDGE ASSETS</div>
                    </div>
                </div>

                <div className="f-bento-card f-bento-stat animate-bento sentinel-floating" style={{ animationDelay: '-3s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="f-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                        <FaChalkboardTeacher />
                    </div>
                    <div className="f-stat-info">
                        <div className="f-stat-value">{courseCount}</div>
                        <div className="f-stat-label">ACTIVE MODULES</div>
                    </div>
                </div>

                <div className="f-bento-card f-bento-stat animate-bento sentinel-floating" style={{ animationDelay: '-4.5s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="f-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <FaBullhorn />
                    </div>
                    <div className="f-stat-info">
                        <div className="f-stat-value">{messages.length}</div>
                        <div className="f-stat-label">SIGNAL UPLINKS</div>
                    </div>
                </div>

                {/* 🕒 Recent Activities */}
                <div className="f-bento-card f-bento-wide animate-bento sentinel-floating" style={{ animationDelay: '0.6s', background: 'white' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="card-header-row">
                        <h3><FaHistory /> Resource Feed</h3>
                        <button className="view-all-btn" onClick={() => setView('materials')}>Manage All</button>
                    </div>
                    <div className="f-mini-feed">
                        {materialsList.slice(0, 4).map((m, i) => (
                            <div key={m.id || m._id} className="f-feed-node" onClick={() => window.open(getFileUrl(m), '_blank')}>
                                <div className="node-icon-wrap">
                                    {m.type === 'videos' ? <FaVideo /> : <FaFileAlt />}
                                </div>
                                <div className="node-main-info">
                                    <div className="node-title">{m.title}</div>
                                    <div className="node-meta">{m.subject} • {new Date(m.createdAt || m.uploadedAt).toLocaleDateString()}</div>
                                </div>
                                <FaEye style={{ color: '#cbd5e1' }} />
                            </div>
                        ))}
                        {materialsList.length === 0 && <div className="no-content">No recent resources</div>}
                    </div>
                </div>

                {/* 👥 Top Students / Roster Snippet */}
                <div className="f-bento-card f-bento-wide animate-bento sentinel-floating" style={{ animationDelay: '0.7s', background: 'white' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="card-header-row">
                        <h3><FaBookReader /> Student Hub</h3>
                        <button className="view-all-btn" onClick={() => setView('students')}>Roster</button>
                    </div>
                    <div className="f-mini-feed">
                        {studentsList.slice(0, 4).map((student, i) => (
                            <div key={student.sid || i} className="f-feed-node">
                                <div className="node-icon-wrap" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                                    <FaUserGraduate />
                                </div>
                                <div className="node-main-info">
                                    <div className="node-title">{student.name}</div>
                                    <div className="node-meta">{student.sid} • Year {student.year} - {student.section}</div>
                                </div>
                                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#94a3b8' }}>ACTIVE</div>
                            </div>
                        ))}
                        {studentsList.length === 0 && <div className="no-content">No students assigned</div>}
                    </div>
                </div>

                {/* 🛰️ Sentinel Node Status (Futuristic Footer) */}
                <div className="f-bento-card animate-bento" style={{ gridColumn: 'span 4', padding: '1.5rem', background: 'rgba(15, 23, 42, 0.02)', border: '1px dashed var(--admin-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div className="pulse" style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                            <span style={{ fontSize: '0.7rem', fontWeight: 950, color: 'var(--admin-text-muted)', letterSpacing: '1px' }}>SENTINEL NODE STATUS: STABLE</span>
                        </div>
                        <div style={{ display: 'flex', gap: '2rem' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.6rem', color: 'var(--admin-text-muted)', fontWeight: 850 }}>UPLINK SPEED</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 950, color: 'var(--admin-secondary)' }}>856 MBPS</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.6rem', color: 'var(--admin-text-muted)', fontWeight: 850 }}>LATENCY</div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 950, color: 'var(--admin-secondary)' }}>12 MS</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FacultyHome;
