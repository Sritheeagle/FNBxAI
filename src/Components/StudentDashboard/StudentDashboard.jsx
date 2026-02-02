import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiGet } from '../../utils/apiClient';
import sseClient from '../../utils/sseClient';
import {
    FaChartBar, FaLayerGroup, FaRobot, FaBriefcase
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import VuAiAgent from '../VuAiAgent/VuAiAgent';

// Sections
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
import { getYearData } from './branchData';
import AcademicPulse from './AcademicPulse';
import CollegeFees from './Sections/CollegeFees';

import './StudentDashboard.css';
import SkillsRadar from './Sections/SkillsRadar';
import GlobalNotifications from '../GlobalNotifications/GlobalNotifications';
import PersonalDetailsBall from '../PersonalDetailsBall/PersonalDetailsBall';
import StudentTasks from './Sections/StudentTasks';
import CareerReadiness from './Sections/CareerReadiness';
import CommandPalette from '../CommandPalette/CommandPalette';
// StudyTools intentionally removed (unused) to satisfy linting

/**
 * Friendly Notebook Student Dashboard
 * A high-fidelity, interactive workstation for modern students.
 */
export default function StudentDashboard({ studentData, onLogout }) {
    const navigate = useNavigate();
    const location = useLocation();

    // Auth & Data Initialization
    let stored = null;
    try {
        stored = (typeof window !== 'undefined' && window.localStorage && window.localStorage.getItem('userData'))
            ? JSON.parse(window.localStorage.getItem('userData'))
            : null;
    } catch (e) { stored = null; }

    const initialData = { ...(studentData || stored || { studentName: 'Vignan Student', sid: 'STU001', branch: 'CSE', year: 1, section: 'A', role: 'student' }) };
    const branch = String(initialData.branch || 'CSE').toUpperCase();

    // UI & App State
    const [view, setView] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('view') || 'overview';
    });
    const [isDashboardLoaded, setIsDashboardLoaded] = useState(false);
    const [userData, setUserData] = useState(initialData);
    const [overviewData, setOverviewData] = useState(null);
    const [extraCourses, setExtraCourses] = useState([]);
    const [serverMaterials, setServerMaterials] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [messages, setMessages] = useState([]);
    const [marksData, setMarksData] = useState(null);
    const [scheduleData, setScheduleData] = useState(null);
    const [examsData, setExamsData] = useState(null);
    const [nextClass, setNextClass] = useState(null);
    const [advancedData, setAdvancedData] = useState(null);
    const [roadmapData, setRoadmapData] = useState(null);
    const [assignedFaculty, setAssignedFaculty] = useState([]);

    // Modals & UI Flags
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiInitialPrompt, setAiInitialPrompt] = useState('');
    const [aiDocumentContext, setAiDocumentContext] = useState(null);
    const [isNavigating, setIsNavigating] = useState(false);
    const [navTarget, setNavTarget] = useState('');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    const openAiWithPrompt = (prompt) => {
        setAiInitialPrompt(prompt);
        setShowAiModal(true);
    };

    const openAiWithDoc = (title, url, videoAnalysis = null) => {
        setAiDocumentContext({ title, url, videoAnalysis });
        setAiInitialPrompt(`I have questions about this video/document: ${title}`);
        setView('ai-agent');
    };

    const toggleAiModal = () => {
        setShowAiModal(prev => {
            if (prev) setAiInitialPrompt('');
            return !prev;
        });
    };

    // Update time for countdowns
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);


    // Initial load animation & search param sync
    useEffect(() => {
        const timer = setTimeout(() => setIsDashboardLoaded(true), 100);

        // Sync view with search params if present
        const params = new URLSearchParams(location.search);
        const viewParam = params.get('view');
        if (viewParam) {
            setView(viewParam);
        }

        const handleOpenAi = () => setShowAiModal(true);
        window.addEventListener('open-ai-modal', handleOpenAi);

        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setShowCommandPalette(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('open-ai-modal', handleOpenAi);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [location.search]);

    // --- Data Fetching ---
    // --- Data Fetching (Optimized with Parallel Execution) ---
    const fetchData = useCallback(async () => {
        // console.debug('📊 StudentDashboard: Fetching data (Parallel)...');

        const endpoints = [
            { key: 'overview', url: `/api/students/${userData.sid}/overview` },
            { key: 'courses', url: `/api/students/${userData.sid}/courses` },
            {
                key: 'materials',
                url: `/api/materials?${new URLSearchParams({
                    year: userData.year,
                    section: userData.section,
                    branch: userData.branch
                }).toString()}`
            },
            { key: 'tasks', url: `/api/todos?role=student&userId=${userData.sid}` },
            {
                key: 'messages',
                url: `/api/messages?${new URLSearchParams({
                    role: 'student',
                    year: userData.year,
                    section: userData.section
                }).toString()}`
            },
            {
                key: 'schedule',
                url: `/api/schedule?${new URLSearchParams({
                    year: userData.year,
                    section: userData.section,
                    branch: userData.branch
                }).toString()}`
            },
            { key: 'marks', url: `/api/students/${userData.sid}/marks-by-subject` },
            {
                key: 'exams',
                url: `/api/exams?year=${userData.year}&section=${userData.section}&branch=${userData.branch}`
            },
            { key: 'advanced', url: `/api/materials?subject=Python&isAdvanced=true` },
            {
                key: 'faculty',
                url: `/api/faculty/teaching?year=${userData.year}&section=${userData.section}&branch=${userData.branch}`
            },
            { key: 'roadmaps', url: '/api/roadmaps' }
        ];

        try {
            const results = await Promise.allSettled(
                endpoints.map(ep => apiGet(ep.url).then(data => ({ key: ep.key, data })))
            );

            results.forEach(result => {
                if (result.status === 'fulfilled') {
                    const { key, data } = result.value;

                    switch (key) {
                        case 'overview':
                            if (data) {
                                setOverviewData(data);
                                if (data.student) {
                                    setUserData(prev => ({
                                        ...prev,
                                        studentName: data.student.name || prev.studentName,
                                        sid: data.student.sid || prev.sid,
                                        branch: data.student.branch || prev.branch,
                                        year: data.student.year || prev.year,
                                        section: data.student.section || prev.section,
                                        profilePic: data.student.profilePic || data.student.profileImage || prev.profilePic,
                                        avatar: data.student.avatar || prev.avatar,
                                        stats: data.student.stats || prev.stats
                                    }));
                                }
                            }
                            break;
                        case 'courses':
                            if (Array.isArray(data)) setExtraCourses(data);
                            break;
                        case 'materials':
                            if (Array.isArray(data)) setServerMaterials(data);
                            break;
                        case 'tasks':
                            if (Array.isArray(data)) setTasks(data);
                            break;
                        case 'messages':
                            if (Array.isArray(data)) setMessages(data);
                            break;
                        case 'schedule':
                            if (Array.isArray(data) && data.length > 0) {
                                setScheduleData(data);
                                const today = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
                                const futureClasses = data.filter(s => s.day === today).sort((a, b) => a.time.localeCompare(b.time));
                                const now = new Date();
                                const upcoming = futureClasses.find(c => {
                                    const startTime = c.time.split(' - ')[0];
                                    const [h, m] = startTime.split(':');
                                    const classDate = new Date();
                                    classDate.setHours(parseInt(h), parseInt(m), 0);
                                    return classDate > now;
                                });
                                setNextClass(upcoming || futureClasses[0]);
                            }
                            break;
                        case 'marks':
                            if (Array.isArray(data)) setMarksData(data);
                            break;
                        case 'exams':
                            if (Array.isArray(data)) setExamsData(data);
                            break;
                        case 'advanced':
                            if (Array.isArray(data)) setAdvancedData(data);
                            break;
                        case 'faculty':
                            if (Array.isArray(data)) setAssignedFaculty(data);
                            break;
                        case 'roadmaps':
                            if (Array.isArray(data)) setRoadmapData(data);
                            break;
                        default: break;
                    }
                } else {
                    // console.warn(`⚠️ Failed to fetch ${result.reason?.config?.url || 'endpoint'}`);
                }
            });

        } catch (e) {
            console.error("❌ StudentDashboard: Sync Failed:", e);
        }
    }, [userData.sid, userData.year, userData.section, userData.branch]);

    useEffect(() => {
        // console.debug('🚀 StudentDashboard: Initial data load started');
        fetchData();

        // Optimized polling: 5 seconds (more efficient than 2s)
        const interval = setInterval(() => {
            // console.debug('🔄 StudentDashboard: Polling data from database...');
            fetchData();
        }, 5000);

        // Fast messages update every 5s
        const msgInterval = setInterval(async () => {
            try {
                const query = new URLSearchParams({
                    userId: userData.sid,
                    role: 'student',
                    year: userData.year,
                    section: userData.section
                }).toString();
                const msgData = await apiGet(`/api/messages?${query}`);
                if (Array.isArray(msgData)) {
                    setMessages(msgData.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)));
                }
            } catch (e) {
                console.debug('Messages update failed', e);
            }
        }, 5000);

        return () => {
            // console.debug('🛑 StudentDashboard: Cleaning up intervals');
            clearInterval(interval);
            clearInterval(msgInterval);
        };
    }, [fetchData, userData.sid, userData.year, userData.section]);

    // SSE real-time updates for student data
    useEffect(() => {
        try {
            const unsub = sseClient.onUpdate((ev) => {
                if (!ev || !ev.resource) return;
                const updateResources = ['materials', 'messages', 'courses', 'attendance', 'marks', 'exams', 'fees', 'schedule', 'placements'];
                if (updateResources.includes(ev.resource)) {
                    fetchData();
                }
            });
            return unsub;
        } catch (e) {
            console.debug('SSE client error', e);
        }
    }, [fetchData]);

    // Sync URL with view state
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('view') !== view) {
            params.set('view', view);
            navigate({ search: params.toString() }, { replace: true });
        }
    }, [view, navigate, location.search]);

    // --- CURRICULUM LOGIC ---
    const selectedYear = userData.year || 1;
    const yearData = useMemo(() => {
        let base = getYearData(branch, selectedYear);
        const semesters = JSON.parse(JSON.stringify(base.semesters || []));

        const generateDefaultModules = (id) => [
            { id: `${id}-m1`, name: 'Module 1: Fundamental Concepts', description: 'Core principles and architectural basics.' },
            { id: `${id}-m2`, name: 'Module 2: Structural Analysis', description: 'Deep dive into patterns and structural logic.' },
            { id: `${id}-m3`, name: 'Module 3: Advanced Implementation', description: 'Real-world application and system scaling.' },
            { id: `${id}-m4`, name: 'Module 4: Optimization & Security', description: 'Ensuring performance and stability.' },
            { id: `${id}-m5`, name: 'Module 5: Capstone Synthesis', description: 'Integration of all core competencies.' }
        ];

        // 1. Identify Semesters with Dynamic Content (Overrides)
        const contentOverrides = new Set();
        extraCourses.forEach(c => {
            const cSec = c.section || 'All';
            if (cSec === 'All' || cSec === userData.section) {
                if (c.semester) contentOverrides.add(Number(c.semester));
            }
        });

        // 2. Clear Static Subjects for Overridden Semesters
        semesters.forEach(sem => {
            if (contentOverrides.has(sem.sem)) {
                sem.subjects = []; // Wipe static data
            }
        });

        // 3. Merge Extra Courses
        extraCourses.forEach(course => {
            // Filter by Section
            const courseSection = course.section || 'All';
            if (courseSection !== 'All' && courseSection !== userData.section) return;

            if (course.semester) {
                let sem = semesters.find(s => s.sem === Number(course.semester));
                if (!sem) {
                    sem = { sem: Number(course.semester), subjects: [] };
                    semesters.push(sem);
                }

                // No need to check 'existing' since we wiped static, unless duplicates in dynamic
                const existing = sem.subjects.find(s =>
                    s.name.toLowerCase() === course.name.toLowerCase() ||
                    (s.code && course.code && s.code.toLowerCase() === course.code.toLowerCase())
                );

                if (existing) {
                    existing.modules = course.modules && course.modules.length > 0 ? course.modules : existing.modules;
                    if (course.code) existing.code = course.code;
                } else {
                    sem.subjects.push({
                        id: course.id || course._id || `dyn-${course.code}`,
                        name: course.name,
                        code: course.courseCode || course.code,
                        modules: course.modules && course.modules.length > 0 ? course.modules : generateDefaultModules(course.id || course.code)
                    });
                }
            }
        });

        // 2. Merge Server Materials
        serverMaterials.forEach(m => {
            if (m.year && m.year !== 'All' && String(m.year) !== String(selectedYear)) return;
            const mBranch = (m.branch || 'All').toLowerCase();
            if (mBranch !== 'all' && mBranch !== branch.toLowerCase()) return;

            const studentSec = String(userData.section || 'A').toUpperCase();
            const mSec = m.section;
            let sectionMatch = !mSec || mSec === 'All' || mSec === studentSec;
            if (!sectionMatch) {
                if (Array.isArray(mSec)) sectionMatch = mSec.includes(studentSec);
                else if (typeof mSec === 'string') {
                    sectionMatch = mSec.split(',').map(s => s.trim().toUpperCase()).includes(studentSec);
                }
            }
            if (!sectionMatch) return;

            // If material has semester explicitly, use it
            if (m.subject && m.semester) {
                let sem = semesters.find(s => s.sem === Number(m.semester));
                if (!sem) {
                    sem = { sem: Number(m.semester), subjects: [] };
                    semesters.push(sem);
                }
                if (!sem.subjects.find(s =>
                    s.name.toUpperCase() === m.subject.toUpperCase() ||
                    (s.code && s.code.toUpperCase() === m.subject.toUpperCase())
                )) {
                    sem.subjects.push({
                        id: `shadow-${m.subject}`,
                        name: m.subject,
                        code: 'EXT-RES',
                        modules: generateDefaultModules(`shadow-${m.subject}`)
                    });
                }
            } else if (m.subject) {
                // Try to infer semester by matching material subject to existing subjects
                const subjNorm = String(m.subject).trim().toUpperCase();
                let placed = false;
                for (const sem of semesters) {
                    const match = (sem.subjects || []).find(s =>
                        (s.name && s.name.toUpperCase() === subjNorm) ||
                        (s.code && s.code.toUpperCase() === subjNorm)
                    );
                    if (match) {
                        // already present in this semester
                        placed = true;
                        break;
                    }
                }

                if (!placed) {
                    // No existing subject matched; attempt to place into semester 1 by default
                    let defaultSem = semesters.find(s => s.sem === 1) || semesters[0];
                    if (!defaultSem) {
                        defaultSem = { sem: 1, subjects: [] };
                        semesters.push(defaultSem);
                    }
                    if (!defaultSem.subjects.find(s => s.name.toUpperCase() === subjNorm)) {
                        defaultSem.subjects.push({
                            id: `shadow-${m.subject}`,
                            name: m.subject,
                            code: 'EXT-RES',
                            modules: generateDefaultModules(`shadow-${m.subject}`)
                        });
                    }
                }
            }
        });

        return { semesters };
    }, [extraCourses, serverMaterials, branch, selectedYear, userData.section]);

    const enrolledSubjects = useMemo(() => {
        return (yearData.semesters || []).flatMap(s => s.subjects || []);
    }, [yearData]);

    const todayClassesCount = useMemo(() => {
        if (!scheduleData) return 0;
        const today = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
        return scheduleData.filter(s => s.day === today).length;
    }, [scheduleData]);

    const activeFocus = useMemo(() => {
        if (nextClass) return nextClass.subject;
        if (enrolledSubjects.length > 0) return enrolledSubjects[0].name;
        return "Academic Excellence";
    }, [nextClass, enrolledSubjects]);

    // `StatCard` removed — it was defined but not used. Keep compact UI directly in JSX where needed.

    const handleAiNavigate = (target) => {
        const t = String(target).toLowerCase();
        setNavTarget(t);
        setIsNavigating(true);

        const viewMap = {
            'attendance': 'attendance',
            'schedule': 'schedule',
            'exam': 'exams',
            'mark': 'marks',
            'grade': 'marks',
            'result': 'marks',
            'task': 'tasks',
            'todo': 'tasks',
            'academic': 'semester',
            'classroom': 'semester',
            'library': 'semester',
            'placement': 'placement',
            'career': 'roadmaps',
            'roadmap': 'roadmaps',
            'settings': 'settings',
            'profile': 'settings',
            'support': 'support',
            'help': 'support',
            'advanced': 'advanced',
            'video': 'advanced',
            'note': 'semester',
            'journal': 'journal',
            'overview': 'overview'
        };

        let matchedView = 'overview';
        Object.keys(viewMap).forEach(key => {
            if (t.includes(key)) {
                matchedView = viewMap[key];
            }
        });

        setTimeout(() => {
            setView(matchedView);
            setIsNavigating(false);
            if (showAiModal) setShowAiModal(false);
        }, 800);
    };

    const renderOverview = () => (
        <div className="nexus-bento-viewport">

            {/* 🌅 Welcome Hero */}
            <motion.div
                className="bento-hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <div className="hero-content">
                    <div className="hero-greeting">
                        <div className="hero-badge-row">
                            {overviewData?.activity?.streak > 5 && (
                                <span className="hero-streak-badge">🔥 {overviewData.activity.streak} DAY STREAK</span>
                            )}
                            {examsData?.some(ex => {
                                const diff = new Date(ex.date) - new Date();
                                return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
                            }) && (
                                    <span className="hero-exam-warning">📅 EXAM THIS WEEK</span>
                                )}
                        </div>
                        <h2>Welcome back, <span>{(userData.studentName || 'Student').split(' ')[0]}</span></h2>
                        <p>You have <strong>{todayClassesCount} lectures</strong> today. Your current focus area is <strong>{activeFocus}</strong>.</p>
                    </div>
                    <div className="hero-actions">
                        <button className="quick-btn" onClick={() => setView('ai-agent')}>Ask Friendly AI</button>
                        <button className="quick-btn outline" onClick={() => handleAiNavigate('tasks')}>Today's Agenda</button>
                    </div>
                </div>
            </motion.div>

            <div className="bento-grid">
                {/* 📊 KPI Row */}
                <div className="bento-card stat-card-premium animate-bento" style={{ '--accent': 'var(--v-primary)' }}>
                    <div className="stat-label">Academic Progress</div>
                    <div className="stat-value">{overviewData?.semesterProgress || 0}%</div>
                    <div className="stat-mini-chart">
                        <div className="mini-bar-flow" style={{ width: `${overviewData?.semesterProgress || 0}%` }}></div>
                    </div>
                    <div className="stat-sub">Semester Completion</div>
                </div>

                <div className="bento-card stat-card-premium animate-bento" style={{ animationDelay: '0.1s', '--accent': 'var(--v-secondary)' }}>
                    <div className="stat-label">Current CGPA</div>
                    <div className="stat-value">{overviewData?.activity?.calculatedCGPA || '8.20'}</div>
                    <div className="stat-sub">Rank {overviewData?.ranking?.rank || '--'} in Class of {overviewData?.ranking?.total || '--'}</div>
                </div>

                <div className="bento-card stat-card-premium animate-bento" style={{ animationDelay: '0.2s', '--accent': '#f97316' }}>
                    <div className="stat-label">Study Streak</div>
                    <div className="stat-value">{overviewData?.activity?.streak || 0}d</div>
                    <div className="stat-sub">Consistency: Peak</div>
                </div>

                <div className="bento-card stat-card-premium animate-bento" style={{ animationDelay: '0.3s', '--accent': '#0ea5e9' }}>
                    <div className="stat-label">Intelligence Score</div>
                    <div className="stat-value">{overviewData?.activity?.aiUsage || 94}</div>
                    <div className="stat-sub">AI Engagement High</div>
                </div>

                {/* 💓 Main Data Pulse */}
                <div className="bento-card span-grid-3 bento-pulse animate-bento" style={{ animationDelay: '0.4s' }}>
                    <div className="bento-card-header">
                        <h3><FaChartBar /> Academic Vitality</h3>
                        <span>Live Analytics</span>
                    </div>
                    <AcademicPulse data={overviewData} />
                </div>

                {/* 🎯 Next Class */}
                <div className="bento-card bento-mini-widget animate-bento" style={{ animationDelay: '0.5s' }}>
                    <div className="bento-card-header">
                        <h3>Next Class</h3>
                        {nextClass && (
                            <span className="live-tag">
                                IN {(() => {
                                    const startTime = nextClass.time.split(' - ')[0];
                                    const [h, m] = startTime.split(':');
                                    const classDate = new Date();
                                    classDate.setHours(parseInt(h), parseInt(m), 0);
                                    const diff = classDate - currentTime;
                                    const diffMins = Math.floor(diff / 60000);
                                    if (diffMins < 0) return 'STARTED';
                                    if (diffMins < 60) return `${diffMins}M`;
                                    return `${Math.floor(diffMins / 60)}H`;
                                })()}
                            </span>
                        )}
                    </div>
                    {nextClass ? (
                        <div className="session-compact">
                            <h4 className="s-subject">{nextClass.subject}</h4>
                            <p className="s-meta">{nextClass.time} | Room {nextClass.room}</p>
                            <span className="s-faculty">with Prof. {nextClass.faculty.split(' ')[0]}</span>
                            <button className="s-action" onClick={() => setView('schedule')}>GO TO SCHEDULE</button>
                        </div>
                    ) : (
                        <div className="session-empty">No active classes today</div>
                    )}
                </div>

                {/* 💼 Career Insights */}
                <div className="bento-card span-grid-2 animate-bento" style={{ animationDelay: '0.6s' }}>
                    <div className="bento-card-header">
                        <h3><FaBriefcase /> Career Readiness</h3>
                        <button onClick={() => setView('placement')}>Track Prep</button>
                    </div>
                    <CareerReadiness
                        score={overviewData?.activity?.careerReadyScore || 0}
                        academics={overviewData?.academics || {}}
                        attendance={overviewData?.attendance || {}}
                        roadmapCount={Object.keys(overviewData?.roadmapProgress || {}).length}
                    />
                </div>

                {/* 🎯 Skill Radar */}
                <div className="bento-card animate-bento" style={{ animationDelay: '0.7s' }}>
                    <div className="bento-card-header">
                        <h3><FaLayerGroup /> Skill Mastery</h3>
                    </div>
                    <SkillsRadar studentData={userData} />
                </div>

                {/* 📡 Profile Mini */}
                <div className="bento-card animate-bento" style={{ animationDelay: '0.8s' }}>
                    <StudentProfileCard userData={userData} setView={setView} />
                </div>
            </div>
        </div >
    );


    const [focusMode] = useState(false);

    return (
        <div className={`student-dashboard-layout ${isDashboardLoaded ? 'loaded' : ''} ${focusMode ? 'focus-active' : ''} ${mobileSidebarOpen ? 'mobile-open' : ''}`}>

            {!focusMode && (
                <>
                    <button className="mobile-sidebar-toggle" onClick={() => setMobileSidebarOpen(true)} aria-label="Open menu">
                        ☰
                    </button>
                    {mobileSidebarOpen && (
                        <div className="mobile-overlay" onClick={() => setMobileSidebarOpen(false)}></div>
                    )}
                    <StudentSidebar
                        userData={userData}
                        view={view}
                        setView={setView}
                        collapsed={sidebarCollapsed}
                        setCollapsed={setSidebarCollapsed}
                        onLogout={onLogout}
                        onNavigate={() => setMobileSidebarOpen(false)}
                    />
                </>
            )}

            <div className="dashboard-content-area">
                {/* 🌌 Ambient Background Layer */}
                <div className="nexus-mesh-bg content-bg-fixed"></div>

                {/* Modern Dynamic Header with Glassmorphism */}
                <StudentHeader view={view} />

                <AnimatePresence mode="wait">
                    {isNavigating && (
                        <motion.div
                            key="navigating"
                            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
                            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                            transition={{ duration: 0.5 }}
                            className="navigating-overlay"
                        >
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="navigating-pulse"
                            ></motion.div>
                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                style={{ marginTop: '2.5rem', fontWeight: 950, color: 'var(--v-primary)', letterSpacing: '0.1em' }}
                            >
                                TRANSMITTING TO {navTarget.toUpperCase()}...
                            </motion.h2>
                        </motion.div>
                    )}

                    {view === 'overview' && (
                        <motion.div
                            key="overview"
                            initial={{ opacity: 0, scale: 0.98, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.02, y: -15 }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            style={{ height: '100%' }}
                        >
                            {renderOverview()}
                        </motion.div>
                    )}


                    {view === 'announcements' && (
                        <motion.div
                            key="announcements"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.05, y: -20 }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            className="nexus-page-container"
                        >
                            <StudentAnnouncements messages={messages} userData={userData} />
                        </motion.div>
                    )}


                    {view === 'semester' && (
                        <motion.div
                            key="semester"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.05, y: -20 }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            className="nexus-page-container"
                        >
                            <AcademicBrowser
                                yearData={getYearData(userData.branch, userData.year)}
                                selectedYear={userData.year}
                                serverMaterials={serverMaterials}
                                userData={userData}
                                setView={setView}
                                branch={userData.branch}
                                assignedFaculty={assignedFaculty}
                                onRefresh={fetchData}
                                openAiWithDoc={openAiWithDoc}
                            />
                        </motion.div>
                    )}

                    {view === 'journal' && (
                        <motion.div
                            key="journal"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.05, y: -20 }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            className="nexus-page-container"
                        >
                            <SemesterNotes
                                semester={userData.semester || 'Current'}
                                studentData={userData}
                                enrolledSubjects={enrolledSubjects}
                                serverMaterials={serverMaterials}
                                assignedFaculty={assignedFaculty}
                            />
                        </motion.div>
                    )}

                    {view === 'advanced' && (
                        <motion.div
                            key="advanced"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.05, y: -20 }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            className="nexus-page-container"
                        >
                            <AdvancedLearning userData={userData} overviewData={overviewData} preloadedData={advancedData} openAiWithDoc={openAiWithDoc} />
                        </motion.div>
                    )}

                    {view === 'tasks' && (
                        <motion.div
                            key="tasks"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.05, y: -20 }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            className="nexus-page-container"
                        >
                            <StudentTasks tasks={tasks} userData={userData} onRefresh={fetchData} />
                        </motion.div>
                    )}




                    {view === 'attendance' && (
                        <motion.div
                            key="attendance"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.05, y: -20 }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            className="nexus-page-container"
                        >
                            <SubjectAttendanceMarks
                                studentId={userData.sid}
                                overviewData={overviewData}
                                enrolledSubjects={enrolledSubjects}
                                setView={setView}
                                openAiWithPrompt={openAiWithPrompt}
                            />
                        </motion.div>
                    )}

                    {view === 'exams' && (
                        <motion.div
                            key="exams"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.05, y: -20 }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            className="nexus-page-container"
                        >
                            <StudentExams studentData={userData} preloadedData={examsData} />
                        </motion.div>
                    )}

                    {view === 'faculty' && (
                        <motion.div
                            key="faculty"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.05, y: -20 }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            className="nexus-page-container"
                        >
                            <StudentFacultyList studentData={userData} />
                        </motion.div>
                    )}

                    {view === 'schedule' && (
                        <motion.div
                            key="schedule"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.05, y: -20 }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            className="nexus-page-container"
                        >
                            <StudentSchedule studentData={userData} preloadedData={scheduleData} />
                        </motion.div>
                    )}


                    {view === 'placement' && (
                        <motion.div
                            key="placement"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.05, y: -20 }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            className="nexus-page-container"
                        >
                            <PlacementPrep userData={userData} />
                        </motion.div>
                    )}

                    {view === 'roadmaps' && (
                        <motion.div
                            key="roadmaps"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.05, y: -20 }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            className="nexus-page-container"
                        >
                            <StudentRoadmaps studentData={userData} preloadedData={roadmapData} />
                        </motion.div>
                    )}

                    {view === 'settings' && (
                        <motion.div
                            key="settings"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.05, y: -20 }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            className="nexus-page-container"
                        >
                            <StudentSettings
                                userData={userData}
                                onProfileUpdate={setUserData}
                            />
                        </motion.div>
                    )}

                    {view === 'marks' && (
                        <motion.div
                            key="marks"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.05, y: -20 }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            className="nexus-hub-viewport"
                        >
                            <StudentResults studentData={userData} preloadedData={marksData} />
                        </motion.div>
                    )}

                    {view === 'fees' && (
                        <motion.div
                            key="fees"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.05, y: -20 }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            className="nexus-page-container"
                        >
                            <CollegeFees userData={userData} />
                        </motion.div>
                    )}

                    {view === 'support' && (
                        <motion.div
                            key="support"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 1.05, y: -20 }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            className="nexus-page-container"
                        >
                            <StudentSupport userData={userData} />
                        </motion.div>
                    )}

                    {view === 'ai-agent' && (
                        <motion.div
                            key="ai-agent-view"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.3 }}
                            className="nexus-hub-viewport"
                            style={{ padding: '0 2rem', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}
                        >
                            <div style={{ flex: 1, height: '100%', paddingBottom: '2rem', position: 'relative', zIndex: 10 }}>
                                <VuAiAgent onNavigate={handleAiNavigate} initialMessage={aiInitialPrompt} documentContext={aiDocumentContext} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>


            {mobileSidebarOpen && <div className="mobile-sidebar-overlay" onClick={() => setMobileSidebarOpen(false)}></div>}

            <button className="ai-fab" onClick={toggleAiModal}>
                <FaRobot />
                <span className="fab-label">AI Tutor</span>
            </button>

            {showAiModal && (
                <div className="nexus-modal-overlay" onClick={() => setShowAiModal(false)}>
                    <div className="nexus-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="nexus-modal-close" onClick={() => setShowAiModal(false)}>
                            &times;
                        </button>
                        <div className="nexus-modal-body" style={{ padding: 0 }}>
                            <VuAiAgent onNavigate={handleAiNavigate} />
                        </div>
                    </div>
                </div>
            )}

            {/* ⌨️ Command Palette (Quick Navigation) */}
            <CommandPalette
                isOpen={showCommandPalette}
                onClose={() => setShowCommandPalette(false)}
                role="student"
                userData={userData}
            />

            {/* 🏗️ Core Global Components */}
            <PersonalDetailsBall userData={userData} />
            <GlobalNotifications />
        </div>
    );
}