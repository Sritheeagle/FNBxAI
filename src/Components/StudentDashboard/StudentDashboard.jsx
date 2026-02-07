import React, { useEffect, useMemo, useState, useCallback, Suspense, lazy } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiGet } from '../../utils/apiClient';
import sseClient from '../../utils/sseClient';
import { FaChartBar, FaLayerGroup, FaRobot, FaBriefcase, FaGraduationCap, FaChalkboardTeacher, FaBullhorn, FaCalendarAlt } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

// --- Assets & Icons ---
import VuAiAgent from '../VuAiAgent/VuAiAgent';
import { getYearData } from './branchData';
import AcademicPulse from './AcademicPulse';
import './StudentDashboard.css';
import SkillsRadar from './Sections/SkillsRadar';
import GlobalNotifications from '../GlobalNotifications/GlobalNotifications';
import PersonalDetailsBall from '../PersonalDetailsBall/PersonalDetailsBall';
import CareerReadiness from './Sections/CareerReadiness';
import CommandPalette from '../CommandPalette/CommandPalette';

// --- Section Imports ---
import StudentSidebar from './Sections/StudentSidebar';
import StudentProfileCard from './Sections/StudentProfileCard';
import AcademicBrowser from './Sections/AcademicBrowser';
import SemesterNotes from './Sections/SemesterNotes';
import SubjectAttendanceMarks from './Sections/SubjectAttendanceMarks';
import StudentResults from './Sections/StudentResults';
import AdvancedLearning from './Sections/AdvancedLearning';
import StudentHeader from './Sections/StudentHeader';
import StudentExams from './StudentExams';
import StudentFacultyList from './StudentFacultyList';
import StudentSchedule from './StudentSchedule';
import PlacementPrep from './Sections/PlacementPrep';
import StudentRoadmaps from './Sections/StudentRoadmaps';
import StudentAnnouncements from './Sections/StudentAnnouncements';
import StudentSettings from './Sections/StudentSettings';
import StudentSupport from './Sections/StudentSupport';
import StudentTasks from './Sections/StudentTasks';
import CollegeFees from './Sections/CollegeFees';

const getFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
    return `${API_URL.replace(/\/$/, '')}${cleanUrl}`;
};

/**
 * NEXUS NEXGEN STUDENT ECOSYSTEM (V3 FINAL)
 * A world-class academic operating system with real-time neural synchrony.
 */
export default function StudentDashboard({ studentData, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();

    // 🧠 Identity Hub
    const [userData, setUserData] = useState(() => {
        const stored = localStorage.getItem('userData');
        let base = { studentName: 'Student', sid: '---', branch: 'CSE', year: 1, section: 'A', role: 'student' };
        if (studentData) base = { ...base, ...studentData };
        else if (stored) try { base = { ...base, ...JSON.parse(stored) }; } catch (e) { }
        if (base.name && !base.studentName) base.studentName = base.name;
        return base;
    });

    // 🖥️ UI Control Center
    const [view, setView] = useState(() => new URLSearchParams(window.location.search).get('view') || 'overview');
    const [isDashboardLoaded, setIsDashboardLoaded] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // 🤖 AI Orchestration
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiInitialPrompt, setAiInitialPrompt] = useState('');
    const [aiDocumentContext, setAiDocumentContext] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [navTarget, setNavTarget] = useState('');

    // 📊 Data Stream States
    const [db, setDb] = useState({
        overview: null, courses: [], materials: [], tasks: [],
        assignments: [], messages: [], schedule: [], marks: [],
        exams: [], advanced: [], faculty: [], roadmaps: []
    });

    // 🚀 High-Speed Data Acquisition
    const fetchData = useCallback(async () => {
        const sYear = String(userData.year || '').replace(/[^0-9]/g, '');
        const sSec = String(userData.section || '').replace(/Section\s*/i, '').trim();
        const sBranch = String(userData.branch || '').trim();

        const endpoints = [
            { key: 'overview', url: `/api/students/${userData.sid}/overview` },
            { key: 'courses', url: `/api/courses?branch=${sBranch}&year=${sYear}&section=${sSec}` },
            { key: 'materials', url: `/api/materials?year=${sYear}&section=${sSec}&branch=${sBranch}` },
            { key: 'tasks', url: `/api/todos?role=student&userId=${userData.sid}` },
            { key: 'assignments', url: `/api/teaching-assignments/student?year=${sYear}&section=${sSec}&branch=${sBranch}` },
            { key: 'messages', url: `/api/messages?role=student&year=${sYear}&section=${sSec}` },
            { key: 'schedule', url: `/api/schedule?year=${sYear}&section=${sSec}&branch=${sBranch}` },
            { key: 'marks', url: `/api/students/${userData.sid}/marks-by-subject` },
            { key: 'exams', url: `/api/exams?year=${sYear}&section=${sSec}&branch=${sBranch}` },
            { key: 'advanced', url: `/api/materials?subject=Python&isAdvanced=true` },
            { key: 'faculty', url: `/api/faculty/teaching?year=${sYear}&section=${sSec}&branch=${sBranch}` },
            { key: 'roadmaps', url: '/api/roadmaps' }
        ];

        try {
            const results = await Promise.allSettled(endpoints.map(ep => apiGet(ep.url).then(data => ({ key: ep.key, data }))));
            const newDb = { ...db };
            results.forEach(res => {
                if (res.status === 'fulfilled') {
                    const { key, data } = res.value;
                    newDb[key] = Array.isArray(data) ? data : data;
                    if (key === 'overview' && data?.student) {
                        const up = { ...userData, ...data.student, studentName: data.student.name || userData.studentName };
                        setUserData(up); localStorage.setItem('userData', JSON.stringify(up));
                    }
                }
            });
            setDb(newDb);
        } catch (e) {
            console.error("Neural Sync Interrupted", e);
        } finally {
            setIsDashboardLoaded(true);
        }
    }, [userData.sid, userData.year, userData.section, userData.branch]);

    // 🔄 Neural Lifecycle Hooks
    useEffect(() => {
        fetchData();
        const poll = setInterval(fetchData, 30000);
        const clock = setInterval(() => setCurrentTime(new Date()), 1000);
        const kbd = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowCommandPalette(true); } };
        window.addEventListener('keydown', kbd);
        return () => { clearInterval(poll); clearInterval(clock); window.removeEventListener('keydown', kbd); };
    }, [fetchData]);

    useEffect(() => {
        return sseClient.onUpdate((ev) => {
            if (!ev || !ev.resource) return;
            if (ev.action === 'delete') {
                setDb(prev => ({ ...prev, [ev.resource]: (prev[ev.resource] || []).filter(x => (x._id !== ev.id) && (x.id !== ev.id)) }));
                return;
            }
            fetchData();
        });
    }, [fetchData]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('view') !== view) { params.set('view', view); navigate({ search: params.toString() }, { replace: true }); }
    }, [view, navigate, location.search]);

    // 🔍 Intelligent Derived Data
    const yearData = useMemo(() => {
        const base = getYearData(userData.year || 1, userData.branch);
        if (!base?.semesters) return { semesters: [] };
        return {
            ...base, semesters: base.semesters.map(sem => ({
                ...sem, subjects: sem.subjects.map(sub => ({
                    ...sub,
                    materials: (db.materials || []).filter(m => (m.subject === sub.name || m.subjectCode === sub.code) && (String(m.year) === String(userData.year))),
                    faculty: (db.faculty || []).find(f => (f.assignments || []).some(a => a.subject === sub.name))?.name
                }))
            }))
        };
    }, [userData.year, userData.branch, db.materials, db.faculty]);

    const enrolledSubjects = useMemo(() => (yearData.semesters || []).flatMap(s => s.subjects || []), [yearData]);
    const todayClasses = useMemo(() => (db.schedule || []).filter(s => s.day === ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentTime.getDay()]), [db.schedule, currentTime]);
    const nextClass = useMemo(() => {
        const sorted = [...todayClasses].sort((a, b) => a.time.localeCompare(b.time));
        return sorted.find(c => {
            const st = (c.time || '').split(':')[0];
            const cd = new Date(); cd.setHours(parseInt(st) || 0, 0, 0);
            return cd > currentTime;
        }) || sorted[0];
    }, [todayClasses, currentTime]);

    const handleAiNavigate = (t) => {
        setIsNavigating(true); setNavTarget(t);
        const map = { 'task': 'tasks', 'exam': 'exams', 'score': 'marks', 'faculty': 'faculty', 'note': 'semester', 'overview': 'overview' };
        let matched = 'overview';
        Object.keys(map).forEach(k => { if (String(t).toLowerCase().includes(k)) matched = map[k]; });
        setTimeout(() => { setView(matched); setIsNavigating(false); setShowAiModal(false); }, 800);
    };

    // 🖥️ Layout Components
    const renderContent = () => {
        const shared = { ...db, userData, setView, fetchData, enrolledSubjects, yearData, assignedFaculty: db.faculty };
        switch (view) {
            case 'overview': return (
                <div className="nexus-bento-viewport">
                    <motion.div className="bento-hero" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                        <div className="sentinel-scanner"></div>
                        <div className="hero-content">
                            <div className="hero-greeting">
                                <h2>{currentTime.getHours() < 12 ? 'Welcome back' : 'Good Evening'}, <span>{userData.studentName.split(' ')[0]}</span></h2>
                                <p>Operational status: <strong>NORMAL</strong>. Today's pipeline contains <strong>{todayClasses.length} class(es)</strong>.</p>
                            </div>
                            <div className="hero-actions">
                                <button className="quick-btn" onClick={() => setView('ai-agent')}>Summon AI</button>
                                <button className="quick-btn outline" onClick={() => handleAiNavigate('tasks')}>View Agenda</button>
                            </div>
                        </div>
                    </motion.div>
                    <div className="bento-grid">
                        <KPIRow overview={db.overview} />
                        <div className="bento-card span-grid-3"><div className="bento-card-header"><h3><FaChartBar /> Neural Health</h3></div><AcademicPulse data={db.overview} /></div>
                        <NextClassCard nextClass={nextClass} currentTime={currentTime} setView={setView} />
                        <div className="bento-card span-grid-2"><div className="bento-card-header"><h3><FaBriefcase /> Career Pipeline</h3></div><CareerReadiness score={db.overview?.activity?.careerReadyScore || 0} academics={db.overview?.academics || {}} attendance={db.overview?.attendance || {}} roadmapCount={6} /></div>
                        <div className="bento-card"><div className="bento-card-header"><h3><FaLayerGroup /> Skill Map</h3></div><SkillsRadar studentData={userData} /></div>
                        <div className="bento-card"><StudentProfileCard userData={userData} setView={setView} /></div>
                        <div className="bento-card span-grid-2"><div className="bento-card-header"><h3><FaChalkboardTeacher /> Faculty Nodes</h3><button className="bento-link-btn" onClick={() => setView('faculty')}>VIEW ALL</button></div><FacultyMiniWidget faculty={db.faculty} /></div>
                        <div className="bento-card span-grid-2"><div className="bento-card-header"><h3>< FaBullhorn /> Latest Broadcasts</h3><button className="bento-link-btn" onClick={() => setView('announcements')}>OPEN HUB</button></div><AnnouncementMiniWidget messages={db.messages} /></div>
                    </div>
                </div>
            );
            case 'announcements': return <StudentAnnouncements messages={db.messages} userData={userData} />;
            case 'semester': return <AcademicBrowser {...shared} serverMaterials={db.materials} openAiWithDoc={(t, u, v) => { setAiDocumentContext({ title: t, url: u, videoAnalysis: v }); setAiInitialPrompt(`Analysing ${t}...`); setView('ai-agent'); }} />;
            case 'journal': return <SemesterNotes {...shared} semester={userData.semester || 'Current'} serverMaterials={db.materials} />;
            case 'tasks': return <StudentTasks {...shared} tasks={[...(db.tasks || []), ...(db.assignments || []).map(a => ({ _id: a._id, text: `[ASSIGNMENT] ${a.title}`, completed: false, dueDate: a.dueDate, userId: null }))]} />;
            case 'attendance': return <SubjectAttendanceMarks {...shared} studentId={userData.sid} overviewData={db.overview} openAiWithPrompt={(p) => { setAiInitialPrompt(p); setShowAiModal(true); }} />;
            case 'exams': return <StudentExams {...shared} studentData={userData} preloadedData={db.exams} />;
            case 'faculty': return <StudentFacultyList {...shared} studentData={userData} preloadedFaculty={db.faculty} getFileUrl={getFileUrl} />;
            case 'schedule': return <StudentSchedule {...shared} studentData={userData} preloadedData={db.schedule} />;
            case 'placement': return <PlacementPrep {...shared} />;
            case 'roadmaps': return <StudentRoadmaps {...shared} studentData={userData} preloadedData={db.roadmaps} />;
            case 'settings': return <StudentSettings {...shared} onProfileUpdate={setUserData} />;
            case 'marks': return <StudentResults {...shared} studentData={userData} preloadedData={db.marks} />;
            case 'fees': return <CollegeFees {...shared} />;
            case 'support': return <StudentSupport {...shared} />;
            case 'ai-agent': return <div className="nexus-page-container" style={{ padding: 0 }}><VuAiAgent onNavigate={handleAiNavigate} initialMessage={aiInitialPrompt} documentContext={aiDocumentContext} /></div>;
            default: return null;
        }
    };

    if (!isDashboardLoaded) return <PortalPreloader />;

    return (
        <div className={`student-dashboard-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <StudentSidebar userData={userData} view={view} setView={setView} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} onLogout={onLogout} onNavigate={() => setMobileSidebarOpen(false)} getFileUrl={getFileUrl} />
            <div className="dashboard-content-area">
                <div className="nexus-mesh-bg" />
                <StudentHeader view={view} />
                <AnimatePresence mode="wait">
                    {isNavigating && <NeuralOverlay target={navTarget} />}
                    <motion.div key={view} style={{ minHeight: '100%' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
            <button className="ai-fab" onClick={() => setShowAiModal(p => !p)}><FaRobot /><span className="fab-label">AI ASSISTANT</span></button>
            {showAiModal && <div className="nexus-modal-overlay" onClick={() => setShowAiModal(false)}><div className="nexus-modal-content" onClick={e => e.stopPropagation()}><VuAiAgent onNavigate={handleAiNavigate} forcedRole="student" /></div></div>}
            <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} role="student" userData={userData} />
            <PersonalDetailsBall userData={userData} />
            <GlobalNotifications />
        </div>
    );
}

// --- High-Fidelity Sub-Components ---

const KPIRow = ({ overview }) => (
    <>
        <div className="bento-card stat-card-premium"><div className="stat-label">Neural Progress</div><div className="stat-value">{overview?.semesterProgress || 0}%</div><div className="stat-mini-chart"><div className="mini-bar-flow" style={{ width: `${overview?.semesterProgress || 0}%` }} /></div></div>
        <div className="bento-card stat-card-premium"><div className="stat-label">Cognitive CGPA</div><div className="stat-value">{overview?.activity?.calculatedCGPA || '8.20'}</div><div className="stat-sub">Sector Rank {overview?.ranking?.rank || '--'}</div></div>
        <div className="bento-card stat-card-premium"><div className="stat-label">Neural Streak</div><div className="stat-value">{overview?.activity?.streak || 0}d</div></div>
        <div className="bento-card stat-card-premium"><div className="stat-label">AI Affinity</div><div className="stat-value">{overview?.activity?.aiUsage || 94}</div></div>
    </>
);

const NextClassCard = ({ nextClass, currentTime, setView }) => {
    const cd = useMemo(() => {
        if (!nextClass?.time) return null;
        const st = (nextClass.time || '').split(':')[0];
        const d = new Date(); d.setHours(parseInt(st) || 0, 0, 0);
        const m = Math.floor((d - currentTime) / 60000);
        return m < 0 ? 'ONGOING' : m < 60 ? `IN ${m}M` : `IN ${Math.floor(m / 60)}H`;
    }, [nextClass, currentTime]);

    return (
        <div className="bento-card bento-mini-widget">
            <div className="bento-card-header"><h3>Pulse: Next Hub</h3>{cd && <span className="live-tag">{cd}</span>}</div>
            {nextClass ? (
                <div className="session-compact">
                    <h4 className="s-subject">{nextClass.subject}</h4>
                    <p className="s-meta">{nextClass.time} | NODE {nextClass.room}</p>
                    <span className="s-faculty">OPERATOR: {nextClass.faculty?.split(' ')[0] || 'AI NODE'}</span>
                    <button className="s-action" onClick={() => setView('schedule')}>GO TO HUB</button>
                </div>
            ) : <div className="session-empty">No active hubs in current window</div>}
        </div>
    );
};

const PortalPreloader = () => (
    <div className="student-dashboard-layout" style={{ background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
            <div className="sentinel-scanner" style={{ opacity: 1, height: '4px', top: '50%' }} />
            <h1 style={{ color: '#6366f1', fontFamily: 'Outfit', fontWeight: 950, letterSpacing: '-0.04em' }}>NEXUS INITIALIZING</h1>
            <p style={{ color: '#64748b' }}>Establishing neural uplink to campus nodes...</p>
        </div>
    </div>
);

const NeuralOverlay = ({ target }) => (
    <div className="navigating-overlay" style={{ background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(32px)' }}>
        <div className="navigating-pulse" style={{ borderColor: '#6366f1' }} />
        <h2 style={{ color: '#6366f1', marginTop: '2rem', fontWeight: 950 }}>TRANSMITTING TO {String(target).toUpperCase()}...</h2>
    </div>
);

const FacultyMiniWidget = ({ faculty }) => (
    <div className="faculty-preview-stack">
        {(faculty || []).slice(0, 2).map((f, i) => (
            <div key={i} className="f-preview-item">
                <div className="f-p-avatar">{f.name.substring(0, 1)}</div>
                <div className="f-p-text">
                    <span className="name">{f.name}</span>
                    <span className="subj">{(f.assignments || [])[0]?.subject || 'Faculty Node'}</span>
                </div>
                <div className={`f-p-status ${i === 0 ? 'online' : ''}`}></div>
            </div>
        ))}
        {(!faculty || faculty.length === 0) && <div className="f-p-empty">No faculty assigned to sector</div>}
    </div>
);

const AnnouncementMiniWidget = ({ messages }) => (
    <div className="announcement-preview-stack">
        {(messages || []).slice(0, 2).map((m, i) => (
            <div key={i} className="a-preview-item">
                <div className={`a-p-tag ${m.type || 'info'}`}></div>
                <div className="a-p-content">
                    <span className="subject">{m.subject || 'System Update'}</span>
                    <span className="time"><FaCalendarAlt /> {new Date(m.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        ))}
        {(!messages || messages.length === 0) && <div className="a-p-empty">No active broadcasts in buffer</div>}
    </div>
);