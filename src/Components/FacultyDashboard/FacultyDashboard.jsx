import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import {
  FaUniversity, FaBullhorn, FaFileAlt, FaEye, FaTrash, FaFilter, FaRobot, FaChevronRight, FaVideo
} from 'react-icons/fa';
import sseClient from '../../utils/sseClient';
import MaterialManager from './MaterialManager';
import FacultySettings from './FacultySettings';
import FacultyAttendanceManager from './FacultyAttendanceManager';
import FacultyScheduleView from './FacultyScheduleView';
import FacultyExams from './FacultyExams';
import FacultyAssignments from './FacultyAssignments';
import FacultyMarks from './FacultyMarks';
// import FacultyAnalytics from './FacultyAnalytics'; // Unused
import VuAiAgent from '../VuAiAgent/VuAiAgent';
import { apiGet, apiDelete, apiPost } from '../../utils/apiClient';

// Sections
import FacultySidebar from './Sections/FacultySidebar';
import FacultyHome from './Sections/FacultyHome';
import FacultyCurriculumArch from './Sections/FacultyCurriculumArch';
import FacultyMessages from './Sections/FacultyMessages';
import FacultyStudents from './Sections/FacultyStudents';
import PersonalDetailsBall from '../PersonalDetailsBall/PersonalDetailsBall';

// Styles
import './FacultyDashboard.css';

const FacultyDashboard = ({ facultyData, setIsAuthenticated, setIsFaculty }) => {
  const [currentFaculty, setCurrentFaculty] = useState(facultyData);
  const [view, setView] = useState('overview');
  const [activeContext, setActiveContext] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState([]);
  const [materialsList, setMaterialsList] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showMsgModal, setShowMsgModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState('');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const openAiWithPrompt = (prompt) => {
    setAiInitialPrompt(prompt);
    setShowAiModal(true);
  };

  const toggleAiModal = () => {
    setShowAiModal(prev => {
      if (prev) setAiInitialPrompt('');
      return !prev;
    });
  };

  const navigate = useNavigate();

  const refreshAll = async () => {
    // console.debug('📊 FacultyDashboard: Syncing data...');
    const endpoints = [
      { key: 'profile', promise: apiGet(`/api/faculty/${facultyData.facultyId}`) },
      { key: 'materials', promise: apiGet('/api/materials') },
      {
        key: 'messages',
        promise: apiGet(`/api/messages?${new URLSearchParams({ userId: facultyData.facultyId, role: 'faculty' }).toString()}`)
      },
      { key: 'students', promise: apiGet(`/api/faculty-stats/${facultyData.facultyId}/students`) },
      { key: 'schedule', promise: apiGet(`/api/schedule?faculty=${encodeURIComponent(facultyData.facultyName || facultyData.name)}`) }
    ];

    try {
      const results = await Promise.allSettled(endpoints.map(e => e.promise.then(data => ({ key: e.key, data }))));

      results.forEach(res => {
        if (res.status === 'fulfilled') {
          const { key, data } = res.value;
          switch (key) {
            case 'profile':
              if (data) setCurrentFaculty(data);
              break;
            case 'materials':
              if (Array.isArray(data)) setMaterialsList(data);
              break;
            case 'messages':
              if (Array.isArray(data)) {
                setMessages(data.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0)).slice(0, 10));
              }
              break;
            case 'students':
              if (Array.isArray(data)) setStudentsList(data);
              break;
            case 'schedule':
              if (Array.isArray(data)) setSchedule(data);
              break;
            default:
              break;
          }
        }
      });
    } finally {
      setInitialLoad(false);
    }
  };

  useEffect(() => {
    // 🚩 PURGE LEGACY LOCAL DATA
    const keysToPurge = [
      'adminStudents', 'adminFaculty', 'courses', 'adminMessages',
      'adminTodos', 'localStudents', 'localFaculty', 'courseMaterials',
      'teachingAssignments', 'curriculumData'
    ];
    keysToPurge.forEach(key => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🧹 Faculty Node: Purged legacy local key: ${key}`);
      }
    });

    refreshAll();
    // const timer = setTimeout(() => setInitialLoad(false), 800);
    const interval = setInterval(refreshAll, 15000);
    return () => {
      // clearTimeout(timer);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unsub = sseClient.onUpdate((ev) => {
      if (!ev || !ev.resource) return;

      // Optimistic Deletes
      if (ev.action === 'delete' && ev.id) {
        if (ev.resource === 'materials') {
          setMaterialsList(prev => prev.filter(m => (m._id !== ev.id) && (m.id !== ev.id)));
        } else if (ev.resource === 'messages') {
          setMessages(prev => prev.filter(m => (m._id !== ev.id) && (m.id !== ev.id)));
        }
        return;
      }

      if (['materials', 'students', 'messages', 'faculty', 'exams', 'attendance', 'marks', 'schedule', 'assignments', 'curriculum', 'transmission', 'exam-monitor'].includes(ev.resource)) {
        refreshAll();
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facultyData.facultyId]);

  const myClasses = useMemo(() => {
    const grouped = {};
    const assignments = currentFaculty.assignments || [];
    assignments.forEach(assign => {
      // Group by Year, Subject, and Branch to keep contexts distinct
      const key = `${assign.year}-${assign.subject}-${assign.branch || 'All'}`;
      if (!grouped[key]) {
        grouped[key] = {
          id: key,
          year: assign.year,
          subject: assign.subject,
          branch: assign.branch || 'All',
          sections: new Set()
        };
      }
      grouped[key].sections.add(assign.section);
    });
    return Object.values(grouped).map(g => ({ ...g, sections: Array.from(g.sections).sort() }));
  }, [currentFaculty.assignments]);

  const handleLogout = () => {
    localStorage.clear();
    setIsAuthenticated(false);
    setIsFaculty(false);
    navigate('/');
  };

  const getFileUrl = (m) => {
    if (!m) return '#';
    // If it's a string, use it directly
    if (typeof m === 'string') {
      const url = m;
      if (!url || url === '#') return '#';
      if (url.startsWith('http') || url.startsWith('https') || url.startsWith('blob:') || url.startsWith('data:')) return url;
      const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
      return `${API_URL.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`;
    }
    // If it's an object, look for fileUrl/url
    const rawUrl = m.fileUrl || m.url || '#';
    if (!rawUrl || rawUrl === '#') return '#';
    if (rawUrl.startsWith('http') || rawUrl.startsWith('https') || rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) return rawUrl;
    const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
    return `${API_URL.replace(/\/$/, '')}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
  };

  const handleDeleteNode = async (id) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    try {
      await apiDelete(`/api/materials/${id}`);
      alert("File deleted successfully");
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      refreshAll();
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const message = formData.get('message');
    const targetClassId = formData.get('targetClass');

    const contextToUse = targetClassId ?
      myClasses.find(c => c.id === targetClassId) :
      (activeContext || myClasses[0]);

    if (!message) return;
    if (!contextToUse) return alert("Error: No classes assigned.");

    try {
      await apiPost('/api/faculty/messages', {
        message,
        year: contextToUse.year,
        sections: contextToUse.sections,
        branch: contextToUse.branch,
        subject: contextToUse.subject,
        type: 'announcement'
      });
      alert("Announcement sent to students.");
      setShowMsgModal(false);
      refreshAll();
    } catch (err) {
      alert("Failed to send: " + err.message);
    }
  };

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (initialLoad) {
    return (
      <div className="faculty-load-overlay">
        <div className="load-content">
          <div className="load-icon-box">
            <FaUniversity className="pulse" />
          </div>
          <h2 className="load-shimmer">Accessing Faculty Node...</h2>
          <div className="load-progress-wrap">
            <div className="load-progress-bar"></div>
          </div>
        </div>
      </div>
    );
  }

  const ensureContext = () => {
    if (!activeContext && myClasses.length > 0) {
      setActiveContext(myClasses[0]);
    }
    return activeContext || (myClasses.length > 0 ? myClasses[0] : null);
  };

  return (
    <div className={`faculty-dashboard-layout loaded ${mobileSidebarOpen ? 'mobile-open' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <button className="mobile-sidebar-toggle" onClick={() => setMobileSidebarOpen(true)}>☰</button>
      {mobileSidebarOpen && <div className="mobile-overlay" onClick={() => setMobileSidebarOpen(false)}></div>}

      <FacultySidebar
        facultyData={currentFaculty}
        view={view}
        setView={setView}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        onLogout={handleLogout}
        onNavigate={() => setMobileSidebarOpen(false)}
        getFileUrl={getFileUrl}
      />

      <div className="dashboard-content-area">
        <div className="nexus-mesh-bg content-bg-fixed"></div>

        <header className="nexus-glass-header">
          <div className="header-left">
            <div className="breadcrumb-box">
              <span className="bc-main">FACULTY</span>
              <FaChevronRight className="bc-sep" />
              <span className="bc-active">{view.toUpperCase()}</span>
            </div>
          </div>
          <div className="header-right">
            <div className="header-time-box">
              <span className="time-val">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              <span className="date-val">{currentTime.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            </div>
          </div>
        </header>

        <div className="view-content-layer">
          {view === 'overview' && (
            <FacultyHome
              studentsList={studentsList}
              materialsList={materialsList}
              myClasses={myClasses}
              schedule={schedule}
              facultyData={facultyData}
              messages={messages}
              getFileUrl={getFileUrl}
              setView={setView}
              openAiWithPrompt={openAiWithPrompt}
              currentTime={currentTime}
            />
          )}

          {view === 'materials' && (() => {
            const ctx = ensureContext();
            return ctx ? (
              <div className="nexus-hub-viewport">
                <header className="f-view-header">
                  <div>
                    <h2>COURSE <span>MATERIALS</span></h2>
                    <p className="nexus-subtitle">Manage study materials for {ctx.subject}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <FaFilter style={{ color: '#94a3b8' }} />
                    <select
                      className="f-context-select"
                      onChange={(e) => {
                        const targetCls = myClasses.find(c => c.id === e.target.value);
                        if (targetCls) setActiveContext(targetCls);
                      }}
                      value={ctx ? ctx.id : ''}
                    >
                      {myClasses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.subject} (Yr {c.year} • {c.branch})
                        </option>
                      ))}
                    </select>
                  </div>
                </header>

                <div className="f-upload-stage animate-slide-up">
                  <MaterialManager
                    selectedSubject={`${ctx.subject} - Year ${ctx.year}`}
                    selectedBranch={ctx.branch}
                    selectedSections={ctx.sections}
                    onUploadSuccess={refreshAll}
                  />
                </div>

                <div className="f-materials-grid">
                  {materialsList.filter(m => {
                    const mYear = String(m.year || '').toUpperCase();
                    const ctxYear = String(ctx.year || '').toUpperCase();
                    const yearMatch = mYear === ctxYear || mYear === 'ALL';
                    const subjectMatch = String(m.subject || '').includes(ctx.subject);
                    const mBranch = String(m.branch || 'All').toUpperCase();
                    const ctxBranch = String(ctx.branch || 'All').toUpperCase();
                    const branchMatch = mBranch === 'ALL' || ctxBranch === 'ALL' || mBranch === ctxBranch;
                    return yearMatch && subjectMatch && branchMatch;
                  }).map((node, index) => (
                    <div key={node.id || node._id} className="f-node-card animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                      <div className="f-node-head">
                        <div className="f-node-type-icon">
                          {node.type === 'videos' ? <FaVideo /> : <FaFileAlt />}
                        </div>
                        <div className="f-node-actions">
                          <a href={getFileUrl(node)} target="_blank" rel="noreferrer" className="f-node-btn view" title="View File"><FaEye /></a>
                          <button onClick={() => handleDeleteNode(node.id || node._id)} className="f-node-btn delete" title="Delete File"><FaTrash /></button>
                        </div>
                      </div>
                      <h4 className="f-node-title">{node.title}</h4>
                      <div className="f-node-meta">
                        <span className="f-meta-badge type">{node.type.toUpperCase()}</span>
                        <span className="f-meta-badge unit">UNIT {node.unit || 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : <div className="no-content">No classes assigned.</div>;
          })()}

          {view === 'assignments' && <FacultyAssignments facultyId={facultyData.facultyId} openAiWithPrompt={openAiWithPrompt} />}
          {view === 'marks' && <FacultyMarks facultyData={currentFaculty} openAiWithPrompt={openAiWithPrompt} />}


          {view === 'attendance' && (() => {
            const ctx = ensureContext();
            return ctx ? (
              <div className="nexus-hub-viewport">
                <header className="f-view-header">
                  <div>
                    <h2>ATTENDANCE <span>ROSTER</span></h2>
                    <p className="nexus-subtitle">Daily tracking for {ctx.subject} ({ctx.branch})</p>
                  </div>
                  <select
                    className="f-context-select"
                    onChange={(e) => {
                      const targetCls = myClasses.find(c => c.id === e.target.value);
                      if (targetCls) setActiveContext(targetCls);
                    }}
                    value={ctx ? ctx.id : ''}
                  >
                    {myClasses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.subject} (Yr {c.year} • {c.branch})
                      </option>
                    ))}
                  </select>
                </header>
                <FacultyAttendanceManager
                  facultyId={facultyData.facultyId}
                  subject={ctx.subject}
                  year={ctx.year}
                  branch={ctx.branch}
                  sections={ctx.sections}
                  facultyData={currentFaculty}
                  openAiWithPrompt={openAiWithPrompt}
                />
              </div>
            ) : <div className="no-content">No classes assigned.</div>;
          })()}

          {view === 'exams' && (() => {
            const ctx = ensureContext();
            return ctx ? (
              <div className="nexus-hub-viewport">
                <header className="f-view-header">
                  <div>
                    <h2>EXAM <span>MANAGEMENT</span></h2>
                    <p className="nexus-subtitle">Manage assessments for {ctx.subject} ({ctx.branch})</p>
                  </div>
                  <select
                    className="f-context-select"
                    onChange={(e) => {
                      const targetCls = myClasses.find(c => c.id === e.target.value);
                      if (targetCls) setActiveContext(targetCls);
                    }}
                    value={ctx ? ctx.id : ''}
                  >
                    {myClasses.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.subject} (Yr {c.year} • {c.branch})
                      </option>
                    ))}
                  </select>
                </header>
                <FacultyExams
                  subject={ctx.subject}
                  year={ctx.year}
                  sections={ctx.sections}
                  facultyId={currentFaculty.facultyId}
                  branch={ctx.branch || currentFaculty.department}
                  openAiWithPrompt={openAiWithPrompt}
                />
              </div>
            ) : <div className="no-content">No classes assigned.</div>;
          })()}

          {view === 'schedule' && <FacultyScheduleView facultyData={currentFaculty} schedule={schedule} openAiWithPrompt={openAiWithPrompt} />}
          {view === 'curriculum' && (
            <FacultyCurriculumArch
              myClasses={myClasses}
              materialsList={materialsList}
              currentFaculty={currentFaculty}
              getFileUrl={getFileUrl}
              openAiWithPrompt={openAiWithPrompt}
            />
          )}
          {view === 'settings' && <FacultySettings facultyData={currentFaculty} onProfileUpdate={setCurrentFaculty} openAiWithPrompt={openAiWithPrompt} />}
          {view === 'messages' && <FacultyMessages messages={messages} openAiWithPrompt={openAiWithPrompt} />}
          {view === 'students' && <FacultyStudents studentsList={studentsList} openAiWithPrompt={openAiWithPrompt} getFileUrl={getFileUrl} />}

          {view === 'broadcast' && (
            <div className="nexus-hub-viewport" style={{ maxWidth: '800px', margin: '0 auto' }}>
              <div className="f-node-card animate-slide-up">
                <div className="f-modal-header">
                  <FaBullhorn style={{ fontSize: '2rem' }} />
                  <h2>SYSTEM BROADCAST</h2>
                </div>
                <form onSubmit={handleSendMessage} className="f-broadcast-form">
                  <div className="nexus-group">
                    <label className="f-form-label">Target Course Pipeline</label>
                    <select name="targetClass" className="f-form-select">
                      {myClasses.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.subject} (Yr {c.year} • {c.branch})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="nexus-group">
                    <label className="f-form-label">Transmission Signal</label>
                    <textarea name="message" placeholder="Type your announcement..." required className="f-form-textarea" style={{ height: '200px' }}></textarea>
                  </div>
                  <div className="f-modal-actions">
                    <button type="submit" className="f-quick-btn primary" style={{ width: '100%', borderRadius: '16px' }}>INITIATE BROADCAST</button>
                  </div>
                </form>
              </div>
            </div>
          )}


        </div>
      </div>

      <PersonalDetailsBall role="faculty" data={facultyData} />
      <div className="ai-fab" onClick={toggleAiModal} title="AI Assistant">
        <FaRobot />
        <span className="fab-label">Ask AI</span>
      </div>

      {showAiModal && (
        <div className="nexus-modal-overlay" onClick={toggleAiModal}>
          <div className="nexus-modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '1000px', width: '90%', position: 'relative' }}>
            <button className="nexus-modal-close" onClick={toggleAiModal}>
              &times;
            </button>
            <div className="nexus-modal-body" style={{ padding: 0 }}>
              <VuAiAgent onNavigate={(path) => {
                const target = String(path).toLowerCase();
                setShowAiModal(false);
                setAiInitialPrompt('');

                const viewMap = {
                  'overview': 'overview',
                  'materials': 'materials',
                  'assignment': 'assignments',
                  'assignments': 'assignments',
                  'mark': 'marks',
                  'marks': 'marks',
                  'analytics': 'analytics',
                  'intel': 'analytics',
                  'intelligence': 'analytics',
                  'attend': 'attendance',
                  'attendance': 'attendance',
                  'exam': 'exams',
                  'exams': 'exams',
                  'schedule': 'schedule',
                  'settings': 'settings',
                  'message': 'messages',
                  'messages': 'messages',
                  'students': 'students',
                  'broadcast': 'broadcast',
                  'curriculum': 'curriculum'
                };

                let matched = false;
                Object.keys(viewMap).forEach(key => {
                  if (target.includes(key)) {
                    setView(viewMap[key]);
                    matched = true;
                  }
                });

                if (!matched) {
                }
              }} initialMessage={aiInitialPrompt} forcedRole="faculty" />
            </div>
          </div>
        </div>
      )}

      {showMsgModal && (
        <div className="nexus-modal-overlay" onClick={() => setShowMsgModal(false)}>
          <div className="nexus-modal-content" onClick={e => e.stopPropagation()}>
            <div className="f-modal-header" style={{ padding: '2rem 2rem 0', marginBottom: '1rem' }}>
              <FaBullhorn /><h2>QUICK ALERT</h2>
            </div>
            <div className="nexus-modal-body" style={{ padding: '0 2rem 2rem' }}>
              <form onSubmit={handleSendMessage} className="f-broadcast-form">
                <div className="nexus-group">
                  <label className="f-form-label">Target Class</label>
                  <select name="targetClass" className="f-form-select">
                    {myClasses.map(c => (
                      <option key={`${c.year}-${c.subject}`} value={`${c.year}-${c.subject}`}>
                        {c.subject} (YEAR {c.year})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="nexus-group">
                  <label className="f-form-label">Message</label>
                  <textarea name="message" placeholder="Type info..." required className="f-form-textarea" style={{ height: '100px' }}></textarea>
                </div>
                <div className="f-modal-actions">
                  <button type="button" onClick={() => setShowMsgModal(false)} className="f-cancel-btn">CLOSE</button>
                  <button type="submit" className="f-quick-btn primary">SEND</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};
FacultyDashboard.propTypes = {
  facultyData: PropTypes.object.isRequired,
  setIsAuthenticated: PropTypes.func.isRequired,
  setIsFaculty: PropTypes.func.isRequired,
};

export default FacultyDashboard;
