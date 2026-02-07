import React, { useState, useEffect } from 'react';
import {
    FaUserGraduate, FaChalkboardTeacher, FaBook, FaLayerGroup,
    FaCreditCard, FaRobot, FaCheckCircle, FaExclamationTriangle, FaBroadcastTower, FaShieldAlt
} from 'react-icons/fa';
import { apiPost } from '../../../utils/apiClient';
import SystemIntelligence from '../SystemIntelligence';
import SystemTelemetry from '../SystemTelemetry';
import SystemNodeMap from '../SystemNodeMap';
import './AdminHome.css';

/**
 * ADMIN COMMAND CENTER (OVERVIEW)
 */
const AdminHome = ({
    students = [],
    faculty = [],
    courses = [],
    materials = [],
    fees = [],
    placements = [],
    todos = [],
    setActiveSection,
    openAiWithPrompt
}) => {
    const revenue = fees.reduce((acc, f) => acc + (f.paidAmount || 0), 0);
    const pendingTasks = todos.filter(t => !t.completed).length;

    const [currentTime, setCurrentTime] = useState(new Date());
    const [isTransmitting, setIsTransmitting] = useState(false);
    const [transData, setTransData] = useState({
        title: 'SYSTEM ALERT',
        message: '',
        type: 'info',
        priority: 'high'
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const getTimeGreeting = () => {
        const hour = currentTime.getHours();
        if (hour < 12) return 'MORNING';
        if (hour < 18) return 'AFTERNOON';
        return 'EVENING';
    };

    const handleTransmission = async () => {
        if (!transData.message) return alert("SIGNAL CONTENT MANDATORY.");
        setIsTransmitting(true);
        try {
            await apiPost('/api/transmission', transData);
            setTransData({ ...transData, message: '' });
            alert("BROADCAST SYNCED. TRANSMISSION COMPLETED.");
        } catch (e) {
            alert("UPLINK FAILURE. CHECK NEXUS CORE.");
        } finally {
            setIsTransmitting(false);
        }
    };

    return (
        <div className="admin-home-viewport">
            <header className="admin-hero-header sentinel-floating" style={{ borderRadius: '24px', overflow: 'hidden', position: 'relative', marginBottom: '2.5rem' }}>
                <div className="sentinel-scanner"></div>
                <div className="admin-hero-content">
                    <h1 className="animate-slide-up" style={{ fontWeight: 950, fontSize: '2.8rem' }}>GOOD {getTimeGreeting()}, <span style={{ color: '#6366f1' }}>COMMANDER</span></h1>
                    <p className="animate-slide-up" style={{ animationDelay: '0.1s', fontWeight: 650, color: '#64748b' }}>
                        Nexus Core Status: <strong style={{ color: '#10b981' }}>OPTIMAL</strong>. Sector telemetry reports <strong style={{ color: '#6366f1' }}>{pendingTasks} actionable tasks</strong> requiring authorization.
                    </p>
                </div>
                <div className="admin-live-clock animate-fade-in" style={{ fontWeight: 950, letterSpacing: '0.1em', background: 'rgba(99, 102, 241, 0.05)', padding: '0.8rem 1.5rem', borderRadius: '14px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
            </header>

            {/* 🛰️ System Performance */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '3rem' }}>
                <SystemTelemetry />
                <SystemIntelligence />
            </div>



            {/* 📊 High Level Stats */}
            <div className="admin-bento-grid" style={{ gap: '1.5rem' }}>
                <div className="admin-bento-card stat-card blue sentinel-floating" style={{ animationDelay: '0s', borderRadius: '24px' }} onClick={() => setActiveSection('students')}>
                    <div className="sentinel-scanner"></div>
                    <div className="stat-icon-box" style={{ background: '#eff6ff', color: '#6366f1', width: '50px', height: '50px', borderRadius: '14px' }}><FaUserGraduate /></div>
                    <div className="stat-val" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{students.length}</div>
                    <div className="stat-label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>TOTAL PERSONNEL</div>
                    <div className="stat-footer-bar" style={{ width: '70%', background: '#6366f1', height: '4px', borderRadius: '10px', marginTop: '1rem' }}></div>
                </div>

                <div className="admin-bento-card stat-card green sentinel-floating" style={{ animationDelay: '-1s', borderRadius: '24px' }} onClick={() => setActiveSection('faculty')}>
                    <div className="sentinel-scanner"></div>
                    <div className="stat-icon-box" style={{ background: '#ecfdf5', color: '#10b981', width: '50px', height: '50px', borderRadius: '14px' }}><FaChalkboardTeacher /></div>
                    <div className="stat-val" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{faculty.length}</div>
                    <div className="stat-label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>ACTIVE NODES</div>
                    <div className="stat-footer-bar" style={{ width: '40%', background: '#10b981', height: '4px', borderRadius: '10px', marginTop: '1rem' }}></div>
                </div>

                <div className="admin-bento-card stat-card orange sentinel-floating" style={{ animationDelay: '-2s', borderRadius: '24px' }} onClick={() => setActiveSection('courses')}>
                    <div className="sentinel-scanner"></div>
                    <div className="stat-icon-box" style={{ background: '#fff7ed', color: '#f59e0b', width: '50px', height: '50px', borderRadius: '14px' }}><FaBook /></div>
                    <div className="stat-val" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>{courses.filter(c => !c.isHidden && c.status !== 'Inactive').length}</div>
                    <div className="stat-label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>KNOWLEDGE SECTORS</div>
                    <div className="stat-footer-bar" style={{ width: '55%', background: '#f59e0b', height: '4px', borderRadius: '10px', marginTop: '1rem' }}></div>
                </div>

                <div className="admin-bento-card stat-card purple sentinel-floating" style={{ animationDelay: '-3s', borderRadius: '24px' }} onClick={() => setActiveSection('fees')}>
                    <div className="sentinel-scanner"></div>
                    <div className="stat-icon-box" style={{ background: '#f5f3ff', color: '#8b5cf6', width: '50px', height: '50px', borderRadius: '14px' }}><FaCreditCard /></div>
                    <div className="stat-val" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>₹{(revenue / 1000).toFixed(1)}K</div>
                    <div className="stat-label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>CREDIT REVENUE</div>
                    <div className="stat-footer-bar" style={{ width: '30%', background: '#8b5cf6', height: '4px', borderRadius: '10px', marginTop: '1rem' }}></div>
                </div>

                {/* 🛠️ Management Hub */}
                <div className="admin-bento-card manage-hub sentinel-floating" style={{ animationDelay: '0.5s', gridColumn: 'span 2', gridRow: 'span 2', borderRadius: '24px' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="hub-header">
                        <h3 style={{ fontWeight: 950, fontSize: '1.2rem', color: '#1e293b' }}><FaLayerGroup style={{ color: '#6366f1' }} /> OPERATION HUB</h3>
                        <button className="hub-btn" onClick={() => setActiveSection('materials')} style={{ fontWeight: 950 }}>SYSTEM FILES</button>
                    </div>
                    <div className="hub-body">
                        <div className="hub-item" onClick={() => setActiveSection('students')}>
                            <div className="hub-indicator students"></div>
                            <h4 style={{ fontWeight: 950 }}>STUDENTS DATA</h4>
                            <p style={{ fontWeight: 650 }}>Manage enrollment and files</p>
                        </div>
                        <div className="hub-item" onClick={() => setActiveSection('faculty')}>
                            <div className="hub-indicator faculty"></div>
                            <h4 style={{ fontWeight: 950 }}>FACULTY NODES</h4>
                            <p style={{ fontWeight: 650 }}>Teaching assignments and access</p>
                        </div>
                        <div className="hub-item" onClick={() => setActiveSection('courses')}>
                            <div className="hub-indicator courses"></div>
                            <h4 style={{ fontWeight: 950 }}>CURRICULUM ARCH</h4>
                            <p style={{ fontWeight: 650 }}>Syllabus and subject map</p>
                        </div>
                        <div className="hub-item" onClick={() => setActiveSection('placements')}>
                            <div className="hub-indicator students" style={{ background: '#4f46e5' }}></div>
                            <h4 style={{ fontWeight: 950 }}>PLACEMENT HUB</h4>
                            <p style={{ fontWeight: 650 }}>Manage {placements.length} Company partners</p>
                        </div>
                    </div>
                </div>

                {/* ✅ Task Queue */}
                <div className="admin-bento-card task-hub sentinel-floating" style={{ animationDelay: '0.6s', gridColumn: 'span 2', gridRow: 'span 2', borderRadius: '24px' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="hub-header">
                        <h3><FaCheckCircle /> TASK PIPELINE</h3>
                        <button className="hub-btn" onClick={() => setActiveSection('todos')}>CALENDAR</button>
                    </div>
                    <div className="task-list">
                        {todos.filter(t => !t.completed).slice(0, 4).map(t => (
                            <div key={t.id} className="admin-task-node">
                                <div className="task-priority-dot"></div>
                                <div className="task-info">
                                    <div className="task-text">{t.text}</div>
                                    <div className="task-meta">Due: {new Date(t.date || Date.now()).toLocaleDateString()}</div>
                                </div>
                            </div>
                        ))}
                        {pendingTasks === 0 && (
                            <div className="admin-empty-state">
                                <FaCheckCircle size={40} color="#10b981" />
                                <p>ALL SYSTEMS UPDATED</p>
                            </div>
                        )}
                    </div>
                </div>                {/* 🌌 AI Assistant Banner */}
                <div className="admin-bento-card ai-banner sentinel-floating" style={{ gridColumn: 'span 4', animationDelay: '0.7s', borderRadius: '24px' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="ai-banner-content">
                        <div className="ai-icon-large" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 32px rgba(99, 102, 241, 0.4)' }}>
                            <FaRobot />
                        </div>
                        <div className="ai-text-hub" style={{ flex: 1 }}>
                            <h3 style={{ fontWeight: 950, fontSize: '1.4rem' }}>NEXUS AI COMMAND</h3>
                            <p style={{ fontWeight: 650, color: '#e2e8f0', fontSize: '0.9rem' }}>Automate administrative reports, analyze personnel telemetry, and synthesize tactical summaries instantly.</p>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button className="ai-launch-btn" style={{ background: 'white', color: '#1e293b', fontWeight: 950, border: 'none' }} onClick={() => {
                                const prompt = `Nexus System Diagnostic Report Request: 
                                - Total Students: ${students.length}
                                - Active Faculty: ${faculty.length}
                                - Total Courses: ${courses.length}
                                - Recruitment Partners: ${placements.length}
                                - Net Revenue: ₹${revenue.toLocaleString()}
                                Please provide a comprehensive system health assessment and recommendations for administrative optimization.`;
                                openAiWithPrompt(prompt);
                            }}>
                                RUN SYSTEM DIAGNOSTIC
                            </button>
                            <button className="ai-launch-btn" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 950, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => setActiveSection('ai-agent')}>LAUNCH AGENT</button>
                        </div>
                    </div>
                </div>

                {/* 📡 Sentinel Transmission Control */}
                <div className="admin-bento-card transmission-hub sentinel-floating" style={{ gridColumn: 'span 4', animationDelay: '0.8s', borderRadius: '24px' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="hub-header">
                        <h3 style={{ fontWeight: 950, fontSize: '1.2rem', color: '#1e293b' }}><FaBroadcastTower style={{ color: '#ef4444' }} /> SENTINEL COMMAND PROTOCOL</h3>
                        <div className="transmission-types">
                            <button className={`type-btn info ${transData.type === 'info' ? 'active' : ''}`} style={{ fontWeight: 950 }} onClick={() => setTransData({ ...transData, type: 'info', title: 'SYSTEM INFO' })}>INFO</button>
                            <button className={`type-btn alert ${transData.type === 'alert' ? 'active' : ''}`} style={{ fontWeight: 950 }} onClick={() => setTransData({ ...transData, type: 'alert', title: 'SYSTEM ALERT' })}>ALERT</button>
                            <button className={`type-btn emergency ${transData.type === 'emergency' ? 'active' : ''}`} style={{ fontWeight: 950 }} onClick={() => setTransData({ ...transData, type: 'emergency', title: 'CRITICAL EMERGENCY' })}>EMERGENCY</button>
                        </div>
                    </div>
                    <div className="transmission-input-box" style={{ background: '#f8fafc', padding: '0.3rem', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                        <div className="input-prefix" style={{ color: '#64748b', marginLeft: '1rem' }}><FaShieldAlt /></div>
                        <input
                            type="text"
                            placeholder="INITIALIZE SYSTEM-WIDE TRANSMISSION..."
                            style={{ background: 'transparent', border: 'none', fontWeight: 650, padding: '1rem' }}
                            value={transData.message}
                            onChange={(e) => setTransData({ ...transData, message: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && handleTransmission()}
                        />
                        <button className={`broadcast-btn ${isTransmitting ? 'loading' : ''}`} style={{ borderRadius: '12px', fontWeight: 950, background: '#1e293b' }} onClick={handleTransmission} disabled={isTransmitting}>
                            {isTransmitting ? 'TRANSMITTING...' : 'INITIATE BROADCAST'}
                        </button>
                    </div>
                    <div className="hub-footer-meta">
                        <span style={{ fontWeight: 950, fontSize: '0.65rem', letterSpacing: '0.1em' }}>ESTABLISHING SECURE UPLINK TO ALL ACTIVE NODES...</span>
                        <span style={{ fontWeight: 950, fontSize: '0.65rem', letterSpacing: '0.1em' }}>ENCRYPTION: AES-256 GCM</span>
                    </div>
                </div>
            </div>

            {/* 🌐 System Infrastructure Map */}
            <SystemNodeMap
                studentsCount={students.length}
                facultyCount={faculty.length}
                materialsCount={materials.length}
            />

        </div>
    );
};

export default AdminHome;
