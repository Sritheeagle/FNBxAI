import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaChalkboardTeacher, FaBook, FaEnvelope, FaPlus, FaTrash, FaEye, FaEyeSlash,
  FaBookOpen, FaRobot, FaFileUpload, FaBullhorn, FaLayerGroup, FaBars, FaShieldAlt, FaChartBar,
  FaUserClock, FaUsers, FaClipboardList, FaEdit,
} from 'react-icons/fa';
import AdminHeader from './Sections/AdminHeader';
import AdminHome from './Sections/AdminHome';
import api from '../../utils/apiClient';
import { getYearData } from '../StudentDashboard/branchData';
import VuAiAgent from '../VuAiAgent/VuAiAgent';
import AdminAttendancePanel from './AdminAttendancePanel';
import AdminScheduleManager from './AdminScheduleManager';
import AdminExams from './AdminExams';
import sseClient from '../../utils/sseClient';
import StudentSection from './Sections/StudentSection';
import FacultySection from './Sections/FacultySection';
import MaterialSection from './Sections/MaterialSection';
import MessageSection from './Sections/MessageSection';
import TodoSection from './Sections/TodoSection';
import AcademicHub from './Sections/AcademicHub';
import AdminMarks from './AdminMarks';
import AdminPlacements from './AdminPlacements';
import PersonalDetailsBall from '../PersonalDetailsBall/PersonalDetailsBall';
import './AdminDashboard.css';

// Note: We are now exclusively using MongoDB Atlas via API.
const USE_API = true;
const writeStudents = async (data) => localStorage.setItem('adminStudents', JSON.stringify(data));
const writeFaculty = async (data) => localStorage.setItem('adminFaculty', JSON.stringify(data));

// Helper for data persistence
// Note: We are now exclusively using MongoDB Atlas via API.

const ADVANCED_TOPICS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Data Science',
  'Cloud Computing',
  'Cyber Security',
  'DevOps',
  'Blockchain',
  'Internet of Things',
  'Robotics',
  'Quantum Computing'
];
// Common Section Options
const SECTION_OPTIONS = [...Array.from({ length: 16 }, (_, i) => String.fromCharCode(65 + i)), ...Array.from({ length: 20 }, (_, i) => String(i + 1))];

export default function AdminDashboard({ setIsAuthenticated, setIsAdmin, setStudentData }) {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Toggle for password field

  // Data States
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [courses, setCourses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [todos, setTodos] = useState([]);
  const [messages, setMessages] = useState([]);
  const [fees, setFees] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Added real loading state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState('');

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

  // Form States
  const [showModal, setShowModal] = useState(false);

  const [modalType, setModalType] = useState(null); // 'student', 'faculty', 'course', 'material', 'todo', 'message'
  const [editItem, setEditItem] = useState(null);
  const [facultyAssignments, setFacultyAssignments] = useState([]); // For managing multiple teaching assignments
  const [msgTarget, setMsgTarget] = useState('all'); // Targeted messages state
  const [globalSectionFilter, setGlobalSectionFilter] = useState('A');
  // Centralized subject registry (merges database + static curriculum)
  const allAvailableSubjects = useMemo(() => {
    const dbSubjects = courses.map(c => ({ name: c.name, code: c.code, branch: c.branch }));
    const staticBranches = ['CSE', 'ECE', 'EEE', 'Mechanical', 'Civil', 'IT', 'AIML'];
    let staticSubjects = [];
    staticBranches.forEach(b => {
      [1, 2, 3, 4].forEach(y => {
        const data = getYearData(b, String(y));
        data?.semesters?.forEach(s => {
          s.subjects.forEach(sub => {
            if (!staticSubjects.find(ex => ex.code === sub.code)) {
              staticSubjects.push({ name: sub.name, code: sub.code, branch: b });
            }
          });
        });
      });
    });

    const merged = [...dbSubjects];
    staticSubjects.forEach(ss => {
      // Safety check: ensure ss and merged items are valid objects
      if (ss && ss.code && !merged.some(ms => ms && ms.code === ss.code)) {
        merged.push(ss);
      }
    });
    // Final safety filter to remove any malformed entries that could crash UI
    return merged.filter(x => x && x.name && x.code && !x.isHidden && x.status !== 'Inactive').sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [courses]);

  // Load Initial Data
  useEffect(() => {
    console.log('🚀 AdminDashboard: Initial system uplink started');

    // 🚩 PURGE LEGACY LOCAL DATA
    const keysToPurge = [
      'adminStudents', 'adminFaculty', 'courses', 'adminMessages',
      'adminTodos', 'localStudents', 'localFaculty', 'courseMaterials',
      'teachingAssignments', 'curriculumData'
    ];
    keysToPurge.forEach(key => localStorage.removeItem(key));
    console.log('🧹 Legacy local data purged to ensure MongoDB Atlas integrity');

    loadData();
    const interval = setInterval(() => loadData(), 30000);

    return () => {
      console.log('🛑 AdminDashboard: Cleaning up intervals');
      clearInterval(interval);
    };
  }, []);

  // SSE: subscribe to server push updates and refresh relevant data immediately
  useEffect(() => {
    const unsub = sseClient.onUpdate((ev) => {
      try {
        if (!ev || !ev.resource) return;
        const r = ev.resource;
        const trackedNodes = [
          'students', 'faculty', 'courses', 'materials', 'messages',
          'todos', 'fees', 'placements', 'attendance', 'marks', 'exams', 'schedule',
          'curriculum', 'transmission'
        ];
        if (ev.action === 'delete' && ev.id) {
          if (r === 'students') setStudents(prev => prev.filter(s => (s._id !== ev.id) && (s.id !== ev.id)));
          else if (r === 'faculty') setFaculty(prev => prev.filter(f => (f._id !== ev.id) && (f.id !== ev.id)));
          else if (r === 'courses') setCourses(prev => prev.filter(c => (c._id !== ev.id) && (c.id !== ev.id)));
          else if (r === 'materials') setMaterials(prev => prev.filter(m => (m._id !== ev.id) && (m.id !== ev.id)));
          else if (r === 'todos') setTodos(prev => prev.filter(t => (t._id !== ev.id) && (t.id !== ev.id)));
          else if (r === 'placements') setPlacements(prev => prev.filter(p => (p._id !== ev.id) && (p.id !== ev.id)));
          else if (r === 'messages') setMessages(prev => prev.filter(m => (m._id !== ev.id) && (m.id !== ev.id)));
          return;
        }

        if (trackedNodes.includes(r)) {
          (async () => {
            try {
              if (r === 'students' || ev.action === 'student-update') {
                const s = await api.apiGet('/api/students');
                setStudents(Array.isArray(s) ? s : []);
              } else if (r === 'faculty' || ev.action === 'faculty-update') {
                const f = await api.apiGet('/api/faculty');
                setFaculty((Array.isArray(f) ? f : []).map(fac => ({
                  ...fac,
                  assignments: Array.isArray(fac.assignments) ? fac.assignments : []
                })));
              } else if (r === 'courses') {
                const c = await api.apiGet('/api/courses');
                setCourses(Array.isArray(c) ? c : []);
              } else if (r === 'materials') {
                const m = await api.apiGet('/api/materials');
                setMaterials(Array.isArray(m) ? m : []);
              } else if (r === 'messages') {
                const msg = await api.apiGet('/api/messages');
                setMessages(Array.isArray(msg) ? msg.sort((a, b) => new Date(b.date) - new Date(a.date)) : []);
              } else if (r === 'todos') {
                const t = await api.apiGet('/api/todos');
                setTodos(Array.isArray(t) ? t : []);
              } else if (r === 'fees') {
                const f = await api.apiGet('/api/fees');
                setFees(Array.isArray(f) ? f : []);
              } else if (r === 'placements') {
                const p = await api.apiGet('/api/placements');
                setPlacements(Array.isArray(p) ? p : []);
              } else {
                // Secondary resources: full refresh logic or specific fetch
                loadData();
              }
            } catch (e) { console.error('SSE sync fail:', e); }
          })();
        }
      } catch (e) {
        console.error('SSE event error', e);
      }
    });
    return unsub;
  }, []);

  const loadData = async () => {
    try {
      console.log('📊 loadData: Syncing with MongoDB Atlas...');
      // Only show full loader on first load, otherwise background sync
      // We don't set isLoading(true) here to avoid flashing on polling/updates

      const fetchSafely = async (path, defaultVal = []) => {
        try {
          // console.log(`   → Syncing ${path}...`);
          const res = await api.apiGet(path);
          return Array.isArray(res) ? res : (res?.data || defaultVal);
        } catch (e) {
          console.error(`   ❌ ${path} sync failed:`, e.message);
          return defaultVal;
        }
      };

      const fetchTasks = [
        api.apiGet('/api/students'),
        api.apiGet('/api/faculty'),
        api.apiGet('/api/courses'),
        api.apiGet('/api/materials'),
        api.apiGet('/api/messages'),
        api.apiGet('/api/todos'),
        api.apiGet('/api/fees'),
        api.apiGet('/api/placements')
      ];

      const results = await Promise.allSettled(fetchTasks);

      results.forEach((res, i) => {
        if (res.status === 'fulfilled') {
          const data = Array.isArray(res.value) ? res.value : (res.value?.data || []);
          if (i === 0) setStudents(data);
          if (i === 1) setFaculty(data.map(f => ({ ...f, assignments: Array.isArray(f.assignments) ? f.assignments : [] })));
          if (i === 2) setCourses(data);
          if (i === 3) setMaterials(data);
          if (i === 4) setMessages(data.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
          if (i === 5) setTodos(data);
          if (i === 6) setFees(data);
          if (i === 7) setPlacements(data);
        }
      });
      console.log('📊 loadData: Cloud sync successful');

    } catch (err) {
      console.error('❌ loadData: Critical sync error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setIsAdmin(false);
    setStudentData(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userData'); // Clear AI Agent Identity
    window.location.href = '/';
  };

  const getFileUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
    return `${API_URL.replace(/\/$/, '')}${cleanUrl}`;
  };


  // --- CRUD Operations ---

  // Students
  const handleSaveStudent = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Sanitize fields to ensure clean matching
    if (data.year) data.year = String(data.year).replace(/[^0-9]/g, '');
    if (data.section) data.section = String(data.section).replace(/Section\s*/i, '').trim().toUpperCase();
    if (data.branch) data.branch = String(data.branch).trim().toUpperCase();

    if (!data.sid || !data.name) return alert('ID and Name required');

    console.log('📝 FRONTEND: Preparing to save student');
    console.log('  Mode:', editItem ? 'EDIT' : 'CREATE');

    try {
      let newStudents = [...students];

      if (editItem) {
        // EDIT
        if (USE_API) {
          console.log('🔄 Updating student:', editItem.sid);
          const response = await api.apiPut(`/api/students/${editItem.sid}`, data);
          const updatedStudent = response.data || response;

          newStudents = newStudents.map(s => {
            if (s.sid === editItem.sid || (s._id && updatedStudent._id && s._id === updatedStudent._id)) {
              return { ...s, ...updatedStudent };
            }
            return s;
          });
        } else {
          newStudents = newStudents.map(s => s.sid === editItem.sid ? { ...s, ...data } : s);
          await writeStudents(newStudents);
        }
      } else {
        // CREATE
        if (USE_API) {
          console.log('➕ Creating new student');
          const response = await api.apiPost('/api/students', data);
          const newStudent = response.data || response;
          newStudents.push(newStudent);
        } else {
          const newS = { ...data, id: Date.now().toString(), createdAt: new Date().toISOString() };
          newStudents.push(newS);
          await writeStudents(newStudents);
        }
      }

      setStudents(newStudents);
      closeModal();
      alert(`✅ Student ${editItem ? 'updated' : 'added'} successfully!`);

      if (USE_API) setTimeout(() => loadData(), 500);

    } catch (error) {
      console.error("Save Student Error:", error);
      const msg = error.response?.data?.error || error.message || "Failed to save student";
      alert('Error: ' + msg);
    }
  };

  const handleDeleteStudent = async (sid) => {
    if (!window.confirm('Delete student? This cannot be undone.')) return;

    try {
      if (USE_API) {
        console.log('[Student] Deleting student:', sid);
        await api.apiDelete(`/api/students/${sid}`);
        console.log('[Student] Student deleted from server');
        alert('Student deleted successfully');
      } else {
        const newStudents = students.filter(s => s.sid !== sid);
        await writeStudents(newStudents);
        setStudents(newStudents);
      }
    } catch (err) {
      console.error('Delete student failed:', err);
      alert('Failed to delete student: ' + (err.message || 'Unknown error'));
    } finally {
      if (USE_API) {
        console.log('[Student] Refreshing student list...');
        await loadData();
      }
    }
  };

  // Bulk Student Upload
  const handleBulkUploadStudents = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const res = await api.apiUpload('/api/students/bulk', formData);
      alert(res.message || 'Bulk upload completed');
      loadData(); // Refresh list
      closeModal();
    } catch (err) {
      console.error(err);
      alert('Bulk upload failed: ' + (err.message || 'Unknown error'));
    }
  };

  // Bulk Faculty Upload
  const handleBulkUploadFaculty = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const res = await api.apiUpload('/api/faculty/bulk', formData);
      alert(res.message || 'Bulk faculty upload completed');
      loadData(); // Refresh list
      closeModal();
    } catch (err) {
      console.error(err);
      alert('Bulk faculty upload failed: ' + (err.message || 'Unknown error'));
    }
  };

  // Faculty
  const handleSaveFaculty = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    // Remove empty password for updates (don't change if not provided)
    if (editItem && !data.password) {
      delete data.password;
    } else if (!editItem && !data.password) {
      // Password required for new faculty
      alert('Password is required for new faculty');
      return;
    }

    // Merge assignments - ensure they're formatted correctly
    const assignments = facultyAssignments.map(a => ({
      year: String(a.year || ''),
      section: String(a.section || '').toUpperCase().trim(),
      subject: String(a.subject || '').trim(),
      branch: a.branch || 'CSE',
      semester: a.semester || ''
    }));

    // Prepare FormData for multi-part upload (needed for profile pics)
    const apiFields = new FormData(e.target);
    apiFields.append('assignments', JSON.stringify(assignments));

    console.log('📝 FRONTEND: Preparing to save faculty via FormData');
    console.log('  Mode:', editItem ? 'EDIT' : 'CREATE');

    try {
      let newFaculty = [...faculty];

      if (editItem) {
        // EDIT - Update existing faculty in database
        if (USE_API) {
          const idToUpdate = editItem.facultyId || editItem._id; // Prioritize facultyId to match business logic
          console.log('🔄 Updating faculty with ID:', idToUpdate);

          // Perform API Update using apiUpload (which handles FormData)
          const response = await api.apiUpload(`/api/faculty/${idToUpdate}`, apiFields, 'PUT');

          // API Client might return the data directly or a response object
          const updatedData = response.data || response;
          console.log('✅ Faculty updated from server:', updatedData);

          // Update State Logic - Robust ID Matching
          newFaculty = newFaculty.map(f => {
            // Match by _id if available, otherwise by facultyId
            const isMatch = (f._id && updatedData._id && f._id.toString() === updatedData._id.toString()) ||
              (f.facultyId && updatedData.facultyId && f.facultyId === updatedData.facultyId) ||
              (String(f._id) === String(idToUpdate)) ||
              (f.facultyId === editItem.facultyId);

            if (isMatch) {
              console.log('  -> Updating matching state item:', f.facultyId);
              return {
                ...f,
                ...updatedData,
                assignments: updatedData.assignments || assignments // Prefer server response
              };
            }
            return f;
          });

        } else {
          // Local Storage Mode
          const localData = Object.fromEntries(apiFields.entries());
          newFaculty = newFaculty.map(f => f.facultyId === editItem.facultyId ? { ...f, ...localData, assignments } : f);
          await writeFaculty(newFaculty);
        }
      } else {
        // CREATE - Add new faculty to database
        if (USE_API) {
          console.log('➕ Creating new faculty');
          const response = await api.apiUpload('/api/faculty', apiFields);
          const newF = response.data || response;
          console.log('✅ New Faculty created from server:', newF);

          newFaculty.push({
            ...newF,
            assignments: newF.assignments || assignments
          });
        } else {
          // Local Storage Mode
          const localData = Object.fromEntries(apiFields.entries());
          const newF = { ...localData, assignments, id: Date.now().toString(), createdAt: new Date().toISOString() };
          newFaculty.push(newF);
          await writeFaculty(newFaculty);
        }
      }

      // 1. Immediate State Update (Optimistic/Confirmed)
      setFaculty(newFaculty);
      console.log('✅ Faculty state updated. New count:', newFaculty.length);

      closeModal();

      // 2. Background Refresh (Consistency Check)
      if (USE_API) {
        setTimeout(async () => {
          console.log('🔄 Background refreshing faculty data...');
          await loadData(); // This should be granularized if loadData is too heavy
        }, 500);
      }

      alert('✅ Faculty saved successfully!');

    } catch (err) {
      console.error('Faculty Save Error:', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Unknown error';
      alert('Failed to save faculty. ' + errorMsg);
    }
  };

  const handleAddAssignment = () => {
    let year = document.getElementById('assign-year').value;
    let section = document.getElementById('assign-section').value;
    let subject = document.getElementById('assign-subject').value;
    let branch = document.getElementById('assign-branch').value;
    let semester = document.getElementById('assign-semester').value;

    if (year && section && subject && branch) {
      // 1. Sanitize Year (Remove non-digits)
      year = String(year).replace(/[^0-9]/g, '');

      // 2. Sanitize Section (A, B, C... or ALL)
      section = String(section).toUpperCase().trim();
      if (section.length > 3 && section !== 'ALL') {
        // Heuristic: If user typed "Section A", extract "A"
        const match = section.match(/([A-Z0-9]+)$/);
        if (match) section = match[1];
      }
      // Remove commas if single section to correspond with standard format
      if (section.length === 1) section = section.replace(',', '');

      setFacultyAssignments([...facultyAssignments, {
        year,
        section,
        subject: subject.trim(),
        branch,
        semester: semester || '1'
      }]);

      // Clear inputs
      document.getElementById('assign-section').value = '';
      document.getElementById('assign-subject').value = '';
      document.getElementById('assign-semester').value = '';
    } else {
      alert('Please fill Year, Branch, Section and Subject');
    }
  };

  const handleRemoveAssignment = (idx) => {
    const newAssigns = [...facultyAssignments];
    newAssigns.splice(idx, 1);
    setFacultyAssignments(newAssigns);
  };


  const handleDeleteFaculty = async (fid) => {
    if (!window.confirm('Delete Faculty Member?')) return;
    try {
      if (USE_API) {
        // Backend expects facultyId, not _id
        const idToDelete = fid; // Changed to use facultyId directly matching backend controller

        // Optimistic UI Update: Remove immediately
        setFaculty(prev => prev.filter(f => f.facultyId !== fid));

        await api.apiDelete(`/api/faculty/${idToDelete}`);
      } else {
        const newFac = faculty.filter(f => f.facultyId !== fid);
        await writeFaculty(newFac);
        setFaculty(newFac);
      }
    } catch (err) {
      console.error('[Faculty Delete] Error:', err);
      alert('Failed to delete faculty');
    } finally {
      if (USE_API) {
        console.log('🔄 Reloading all data after faculty delete...');
        await loadData();
      }
    }
  };

  // Courses (Subjects)
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      let newCourses = [...courses];
      if (editItem) {
        // Edit existing
        if (USE_API) {
          // Determine if this is actually a static item (might be missing isStatic but have static- prefix)
          const isStaticItem = editItem.isStatic || (editItem.id && String(editItem.id).startsWith('static-')) || (!editItem._id && !editItem.id);

          if (isStaticItem) {
            try {
              // Migration: Static to Dynamic
              console.log('🔄 Migrating static subject to database...');
              const res = await api.apiPost('/api/courses', data);
              const savedItem = res.data || res;

              // Replace in local state using code as secondary matcher if ID missing
              newCourses = newCourses.map(c => {
                const match = (editItem._id && c._id === editItem._id) ||
                  (editItem.id && c.id === editItem.id) ||
                  (c.code === editItem.code);
                return match ? savedItem : c;
              });
            } catch (err) {
              if (err.message && err.message.includes('409')) {
                alert('This course already exists in the database. Please refresh the page to edit the database version.');
                return;
              } else {
                throw err;
              }
            }
          } else {
            // Normal Update
            const idToUpdate = editItem._id || editItem.id;

            if (!idToUpdate) {
              console.error('❌ Cannot update course: No ID found on editItem', editItem);
              alert('Failed to update: Subject identity lost. Please refresh and try again.');
              return;
            }

            console.log('🔄 Updating database course:', idToUpdate);
            const response = await api.apiPut(`/api/courses/${idToUpdate}`, data);
            const updatedData = response.data || response;

            newCourses = newCourses.map(c => {
              const match = (c._id && c._id === idToUpdate) || (c.id && c.id === idToUpdate);
              return match ? { ...c, ...updatedData } : c;
            });
          }
        } else {
          alert("Offline mode cannot be used to edit courses. Please ensure backend is running.");
          return;
        }
      } else {
        // Add new
        if (USE_API) {
          try {
            const res = await api.apiPost('/api/courses', data);
            const savedItem = res.data || res;
            newCourses.push(savedItem);
          } catch (err) {
            if (err.message && err.message.includes('409')) {
              alert('A course with this code already exists. Please use a different course code.');
              return; // Don't close modal, let user fix the code
            } else {
              throw err;
            }
          }
        } else {
          alert("Offline mode cannot be used to create courses. Please ensure backend is running.");
          return;
        }
      }
      setCourses(newCourses);
      closeModal();
      // Ensure other dashboards reload fresh from server to reflect canonical DB state
      if (USE_API) await loadData();
    } catch (err) {
      console.error('Course Save Error:', err);
      const errorMsg = err.message || 'Unknown error';
      if (errorMsg.includes('401') || errorMsg.includes('Authentication required') || errorMsg.toLowerCase().includes('session expired')) {
        alert('Authentication failed: Your session may have expired. Please log out and log in again.');
        // Force logout to clear stale tokens
        try { handleLogout(); } catch (e) { console.warn('Logout failed', e); }
      } else if (errorMsg.includes('409')) {
        alert('Course code already exists. Please use a unique course code.');
      } else {
        alert('Failed to save subject: ' + errorMsg);
      }
    }
  };

  const handleDeleteCourse = async (courseOrId) => {
    // 1. Resolve ID and Course
    let courseToDelete;

    if (typeof courseOrId === 'object' && courseOrId !== null) {
      courseToDelete = courseOrId;
    } else {
      courseToDelete = courses.find(c => String(c.id) === String(courseOrId) || String(c._id) === String(courseOrId));
    }

    if (!courseToDelete) {
      console.warn("handleDeleteCourse: Course not found", courseOrId);
      return;
    }

    const { id, _id, name, code, isStatic, year, semester, branch, section, description, credits } = courseToDelete;
    const realId = _id || id;

    // Check if this is a static template subject (not in database yet)
    const isTemplateSubject = isStatic || String(realId).startsWith('static-');

    if (!window.confirm(`Permanently remove subject: ${name}?\n\nThis will hide it from all students and faculty.`)) return;

    try {
      if (USE_API) {
        if (isTemplateSubject) {
          // Template subject - Create a "hidden override" in database
          console.log('[Delete] Creating hidden override for template subject:', { name, code });

          // Check if a database record already exists for this code
          const existing = courses.find(c =>
            c.code === code &&
            (c._id || c.id) &&
            !String(c._id || c.id).startsWith('static-')
          );

          if (existing) {
            // Update existing record to hidden
            await api.apiPut(`/api/courses/${existing._id || existing.id}`, {
              ...existing,
              isHidden: true,
              status: 'Inactive'
            });
            console.log('[Delete] Updated existing record to hidden');
          } else {
            // Create new hidden record
            const payload = {
              name,
              code,
              year: year || 1,
              semester: semester || 1,
              branch: branch || 'CSE',
              section: section || 'All',
              description: description || 'Hidden curriculum subject',
              credits: credits || 3,
              isHidden: true,
              status: 'Inactive'
            };
            await api.apiPost('/api/courses', payload);
            console.log('[Delete] Created hidden override record');
          }

          // Immediate local state update - mark as hidden
          setCourses(prev => prev.filter(c =>
            !(c.code === code && String(c.id || c._id).startsWith('static-'))
          ));

          alert(`✓ Subject "${name}" has been hidden from all views.`);

        } else {
          // Database subject - Permanent deletion
          if (!realId) {
            alert('Cannot delete: Subject ID is missing');
            console.error('[Delete] Missing ID:', courseToDelete);
            return;
          }

          console.log('[Delete] Deleting subject from database:', { name, code, id: realId });

          // Perform the deletion
          const response = await api.apiDelete(`/api/courses/${realId}`);
          console.log('[Delete] Backend response:', response);

          // Immediate local state update
          setCourses(prev => prev.filter(c => (c._id || c.id) !== realId));

          console.log('[Delete] Subject deleted successfully');
          alert(`✓ Subject "${name}" has been permanently deleted.`);
        }

      } else {
        // Local logic (Legacy)
        const newCourses = courses.filter(c => c.id !== realId && c._id !== realId);
        setCourses(newCourses);
        alert('Subject removed from local list.');
      }
    } catch (err) {
      console.error('[Delete Error] Full error:', err);
      console.error('[Delete Error] Response:', err.response);
      const errorMsg = err.response?.data?.error || err.message;

      // If it's a "not found" error, the subject might already be deleted
      if (err.response?.status === 404) {
        alert(`Subject "${name}" was already removed or doesn't exist.`);
        setCourses(prev => prev.filter(c => (c._id || c.id) !== realId));
      } else if (err.response?.status === 409) {
        // Duplicate - the override already exists, just mark as hidden
        alert(`Subject "${name}" is already hidden.`);
      } else {
        alert(`Failed to remove subject: ${errorMsg}\n\nPlease check the console for details.`);
      }
    } finally {
      // ALWAYS refresh to ensure UI matches database state
      if (USE_API) {
        console.log('[Delete] Refreshing all data...');
        await loadData();
        console.log('[Delete] Refresh complete - Subject should now be hidden from all views');
      }
    }
  };

  // Materials (The core logic to link with Student Dashboard)
  const handleSaveMaterial = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    const file = e.target.file?.files[0];

    console.log('[Material Upload] Starting upload...', {
      hasFile: !!file,
      isAdvanced: editItem?.isAdvanced,
      subject: data.subject,
      year: data.year,
      type: data.type,
      title: data.title
    });

    // Validation
    if (!data.title || !data.subject || !data.type) {
      alert('Please fill in all required fields: Title, Subject, and Type');
      return;
    }

    if (!file && !data.url && !data.link) {
      alert('Please either upload a file or provide a URL/Link');
      return;
    }

    try {
      let allMaterials = [...materials];

      if (USE_API) {
        const apiFormData = new FormData();

        // Add all form data
        for (const key in data) {
          if (data[key]) {
            apiFormData.append(key, data[key]);
            console.log(`[Material Upload] Adding field: ${key} = ${data[key]}`);
          }
        }

        // Handle isAdvanced checkbox separately if needed or ensure it's in data
        const isAdvanced = e.target.isAdvanced?.checked;
        apiFormData.append('isAdvanced', isAdvanced ? 'true' : 'false');
        console.log(`[Material Upload] Adding field: isAdvanced = ${isAdvanced}`);

        // Add file if present
        if (file) {
          apiFormData.append('file', file);
          console.log(`[Material Upload] Adding file: ${file.name} (${file.size} bytes)`);
        }

        apiFormData.append('uploadedBy', 'admin');

        // Check authentication
        // Check authentication
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) {
          alert('Session expired or invalid. Logging out...');
          handleLogout();
          return;
        }

        console.log('[Material Upload] Sending to API...', {
          endpoint: editItem?.id && !editItem.isAdvanced ? 'PUT' : 'POST',
          hasAdminToken: !!adminToken,
          hasFile: !!file,
          fileSize: file ? file.size : 0
        });

        // Check if we are EDITING an existing item or CREATING a new one
        if (editItem && editItem.id && !editItem.isAdvanced) {
          // EDIT: Only if we have a valid ID and it's not a "new advanced template"
          const idToUpdate = editItem._id || editItem.id;
          if (!idToUpdate) throw new Error("Missing ID for update");

          console.log('[Material Upload] Updating existing material:', idToUpdate);

          // Use apiUpload which handles FormData correctly (including files)
          // We pass 'PUT' as the third argument which we enabled in apiClient
          const res = await api.apiUpload(`/api/materials/${idToUpdate}`, apiFormData, 'PUT');

          const updatedMat = { ...editItem, ...res.data || res };
          allMaterials = allMaterials.map(m => (m.id === editItem.id || m._id === editItem._id) ? updatedMat : m);
        } else {
          console.log('[Material Upload] Creating new material...');

          try {
            console.log('[Material Upload] FormData size:', apiFormData.get('file')?.size || 'no file');
            console.log('[Material Upload] Sending to /api/materials with POST...');

            const res = await api.apiUpload('/api/materials', apiFormData);
            console.log('[Material Upload] SUCCESS! Response:', res);

            if (res && (res._id || res.id)) {
              console.log('[Material Upload] Adding successful response to materials array');
              allMaterials.push(res);
            } else {
              throw new Error('Server returned success but no ID was provided. The material may not have been saved correctly.');
            }
          } catch (uploadError) {
            console.error('[Material Upload] ERROR during upload:', uploadError.message);
            console.error('[Material Upload] Stack:', uploadError.stack);

            // Provide specific error messages
            if (uploadError.message.includes('Failed to fetch')) {
              throw new Error('Cannot connect to server. Please ensure:\n1. Backend server is running\n2. MongoDB is connected\n3. Check browser console for details');
            } else if (uploadError.message.includes('401')) {
              throw new Error('Authentication failed. Please log out and log in again.');
            } else if (uploadError.message.includes('400')) {
              throw new Error('Invalid data. Please check all fields and try again.');
            } else {
              throw uploadError;
            }
          }
        }

        // Refresh materials from server to ensure sync
        console.log('[Material Upload] Refreshing materials from server...');
        const refreshedMaterials = await api.apiGet('/api/materials');
        setMaterials(refreshedMaterials);
        closeModal();
        alert('✅ Material uploaded successfully! Students can now access it in their dashboard.');
        console.log('[Material Upload] Operation completed successfully');

      }
    } catch (err) {
      console.error('[Material Upload] Error:', err);
      console.error('[Material Upload] Error stack:', err.stack);

      const errorMessage = err.message || 'Unknown error';

      let userMessage = 'Material Operation Failed:\n\n';

      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Cannot connect')) {
        userMessage += '❌ Cannot connect to server\n\n';
        userMessage += 'Please check:\n';
        userMessage += '1. Backend server is running (run_unified_app.bat)\n';
        userMessage += '2. MongoDB is connected\n';
        userMessage += '3. No firewall blocking 127.0.0.1:5000\n\n';
        userMessage += 'Check browser console (F12) for details.';
      } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('Authentication')) {
        userMessage += '❌ Authentication Error\n\n';
        userMessage += 'Your session may have expired.\n';
        userMessage += 'Please log out and log in again.';
      } else if (errorMessage.includes('400')) {
        userMessage += '❌ Invalid Data\n\n';
        userMessage += 'Please check:\n';
        userMessage += '1. All required fields are filled\n';
        userMessage += '2. File type is supported\n';
        userMessage += '3. File size is under 100MB';
      } else {
        userMessage += errorMessage;
      }

      alert(userMessage);
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm('Delete this material? It will be removed from all Student/Faculty dashboards.')) return;

    try {
      console.log('[Admin] Deleting material with ID:', id);

      if (USE_API) {
        // Find the material to get the correct ID
        const matToDelete = materials.find(m => m.id === id || m._id === id);
        if (!matToDelete) {
          alert('❌ Material not found');
          return;
        }

        const dbId = matToDelete._id || matToDelete.id || id;
        console.log('[Admin] Sending DELETE request for ID:', dbId);

        // Send delete request to backend
        await api.apiDelete(`/api/materials/${dbId}`);
        console.log('[Admin] Material deleted successfully from backend');
        alert('✅ Material deleted successfully!');
      } else {
        // Update local state and localStorage if not using API
        const newMats = materials.filter(m => m.id !== id && m._id !== id);
        setMaterials(newMats);
        localStorage.setItem('courseMaterials', JSON.stringify(newMats));
        alert('✅ Material deleted successfully!');
      }

    } catch (err) {
      console.error('[Admin] Delete material error:', err);
      // Show detailed error message
      const errorMsg = err.message || 'Unknown error';
      if (errorMsg.includes('401') || errorMsg.includes('Authentication')) {
        alert('❌ Authentication failed!\n\nPlease log out and log in again.');
      } else {
        alert(`❌ Failed to delete material!\n\nError: ${errorMsg}`);
      }
    } finally {
      if (USE_API) {
        console.log('[Admin] Refreshing global data...');
        await loadData();
      }
    }
  };

  // Fees
  const handleSaveFee = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      if (USE_API) {
        const sid = data.studentId || editItem?.studentId;
        await api.apiPut(`/api/fees/${sid}`, {
          totalFee: parseFloat(data.totalFee),
          paidAmount: parseFloat(data.paidAmount),
          academicYear: data.academicYear,
          semester: data.semester
        });
        await loadData();
      }
      closeModal();
      alert('Fee record updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to save fee record');
    }
  };

  const handleDeleteFee = async (id) => {
    if (!window.confirm('Delete this fee record?')) return;
    try {
      if (USE_API) {
        await api.apiDelete(`/api/fees/${id}`);
        alert('Fee record deleted');
      } else {
        const newFees = fees.filter(f => f.id !== id);
        setFees(newFees);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to delete fee record');
    } finally {
      if (USE_API) await loadData();
    }
  };

  // ToDos
  const handleSaveTodo = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const text = formData.get('text');
    const target = formData.get('target');
    const dueDate = formData.get('dueDate');

    try {
      if (editItem) {
        // Update existing
        if (USE_API) {
          await api.apiPut(`/api/todos/${editItem.id}`, { text, target, dueDate });
        }
        // Optimistic update
        const newTodos = todos.map(t => t.id === editItem.id ? { ...t, text, target, dueDate } : t);
        setTodos(newTodos);
      } else {
        // Create new
        if (USE_API) {
          const res = await api.apiPost('/api/todos', { text, target, dueDate });
          setTodos([...todos, res.data || res]);
        } else {
          const newItem = { id: Date.now(), text, target, dueDate, completed: false };
          setTodos([...todos, newItem]);
        }
      }
      if (!USE_API) localStorage.setItem('adminTodos', JSON.stringify(todos)); // fallback
      closeModal();
    } catch (e) {
      console.error("Failed to save todo", e);
      alert("Failed to save task");
    }
  };

  const toggleTodo = async (id) => {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;

    // Optimistic
    const newStatus = !todo.completed;
    const newTodos = todos.map(t => t.id === id ? { ...t, completed: newStatus } : t);
    setTodos(newTodos);

    if (USE_API) {
      try {
        await api.apiPut(`/api/todos/${id}`, { completed: newStatus });
      } catch (e) { console.error(e); }
    } else {
      localStorage.setItem('adminTodos', JSON.stringify(newTodos));
    }
  };

  const deleteTodo = async (id) => {
    if (!window.confirm("Remove this task?")) return;
    try {
      if (USE_API) {
        await api.apiDelete(`/api/todos/${id}`);
      } else {
        const newTodos = todos.filter(t => (t.id || t._id) !== id);
        setTodos(newTodos);
        localStorage.setItem('adminTodos', JSON.stringify(newTodos));
      }
    } catch (e) {
      console.error('[Delete Todo] Error:', e);
      alert("Failed to delete task");
    } finally {
      if (USE_API) await loadData();
    }
  };

  // Messages
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const target = formData.get('target');
    const message = formData.get('message');
    const targetYear = formData.get('targetYear');
    const targetSections = formData.getAll('targetSections');

    const payload = {
      message,
      target,
      type: 'announcement',
      date: new Date().toISOString()
    };

    if (target === 'students-specific') {
      payload.targetYear = targetYear;
      payload.targetSections = targetSections;
    }

    try {
      if (USE_API) {
        await api.apiPost('/api/messages', payload);
        loadData(); // Refresh list from server
      } else {
        const newMsgs = [...messages, { ...payload, id: Date.now() }];
        setMessages(newMsgs);
        localStorage.setItem('adminMessages', JSON.stringify(newMsgs));
      }
      alert('✅ Announcement Successfully Sent');
      closeModal();
    } catch (err) {
      console.error('Announcement Sending Failed:', err);
      alert('Error: ' + (err.message || 'Unknown error'));
    }
  };


  // Helpers
  const openModal = (type, item = null) => {
    setModalType(type);
    setEditItem(item);
    if ((type === 'faculty' || type === 'faculty-view') && item && item.assignments) {
      // Normalize: If legacy format (sections array), flatten it
      let flatAssigns = [];
      item.assignments.forEach(a => {
        if (a.sections && Array.isArray(a.sections)) {
          // Legacy format with sections array
          a.sections.forEach(sec => {
            flatAssigns.push({
              year: a.year,
              subject: a.subject,
              section: sec,
              branch: a.branch || 'CSE', // Preserve branch
              semester: a.semester || '' // Preserve semester
            });
          });
        } else {
          // Modern format or already flattened
          flatAssigns.push({
            year: a.year,
            subject: a.subject,
            section: a.section,
            branch: a.branch || 'CSE',
            semester: a.semester || ''
          });
        }
      });
      setFacultyAssignments(flatAssigns);
    } else {
      setFacultyAssignments([]);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditItem(null);
    setModalType(null);
    setMsgTarget('all');
    setShowPassword(false);
  };

  // Autofill email in faculty modal from facultyId when creating new entries.
  useEffect(() => {
    if (!(showModal && modalType === 'faculty')) return;

    // Attach after modal rendered
    const attach = () => {
      const fid = document.querySelector('input[name="facultyId"]');
      const email = document.querySelector('input[name="email"]');
      if (!fid || !email) return;

      const onInput = (e) => {
        const v = String(e.target.value || '').trim();
        if (!v) return;
        const prevAuto = email.dataset.autogenerated === 'true';
        if (!email.value || prevAuto) {
          email.value = `${v}@example.com`;
          email.dataset.autogenerated = 'true';
        }
      };

      const onBlur = () => {
        const v = String(fid.value || '').trim();
        if (v && !email.value) {
          email.value = `${v}@example.com`;
          email.dataset.autogenerated = 'true';
        }
      };

      fid.addEventListener('input', onInput);
      fid.addEventListener('blur', onBlur);
      // store handlers for cleanup
      window.__facEmailAutofill = { onInput, onBlur };
    };

    const t = setTimeout(attach, 50);
    return () => {
      clearTimeout(t);
      const fid = document.querySelector('input[name="facultyId"]');
      if (fid && window.__facEmailAutofill) {
        fid.removeEventListener('input', window.__facEmailAutofill.onInput);
        fid.removeEventListener('blur', window.__facEmailAutofill.onBlur);
      }
      delete window.__facEmailAutofill;
    };
  }, [showModal, modalType]);

  // Helper to resolve material URLs from either direct links or uploaded files
  const getMaterialUrl = (m) => {
    if (!m) return '#';
    const rawUrl = m.fileUrl || m.url || '#';
    if (!rawUrl || rawUrl === '#') return '#';
    if (rawUrl.startsWith('http') || rawUrl.startsWith('https') || rawUrl.startsWith('blob:') || rawUrl.startsWith('data:')) return rawUrl;
    const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';
    return `${API_URL.replace(/\/$/, '')}${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
  };

  if (isLoading) {
    return (
      <div className="admin-dashboard-v2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
        <div className="admin-loading-container" style={{ textAlign: 'center' }}>
          <div className="admin-loader-spinner" style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(79, 70, 229, 0.3)',
            borderTop: '4px solid #4f46e5',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <h2 style={{ color: '#4f46e5', fontFamily: 'Outfit, sans-serif' }}>Initializing Nexus Admin...</h2>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-v2">
      <AdminHeader
        adminData={{ name: 'System Administrator', role: 'Main Administrator' }}
        view={activeSection}
        setView={setActiveSection}
        openModal={openModal}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />

      {/* Mobile Menu Toggle */}
      <button
        className="admin-mobile-toggle"
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        title="Toggle Sidebar"
      >
        <FaBars />
      </button>

      <main className="admin-viewport">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="admin-content-scroll"
          >

            {activeSection === 'overview' && (
              <AdminHome
                students={students}
                faculty={faculty}
                courses={courses}
                materials={materials}
                fees={fees}
                placements={placements}
                todos={todos}
                setActiveSection={setActiveSection}
                openAiWithPrompt={openAiWithPrompt}
              />
            )}

            {/* Dynamic Sections based on Header Navigation */}
            {activeSection === 'students' && (
              <div className="nexus-hub-viewport" style={{ padding: '0 2rem' }}>
                <div className="f-node-head" style={{ marginBottom: '2.5rem', background: 'transparent' }}>
                  <h2 style={{ fontSize: '2.4rem', fontWeight: 950, color: 'var(--admin-secondary)', letterSpacing: '-1px' }}>STUDENT REGISTRY</h2>
                  <div className="admin-badge primary">MANAGE STUDENTS</div>
                </div>
                <StudentSection
                  students={students}
                  openModal={openModal}
                  handleDeleteStudent={handleDeleteStudent}
                  getFileUrl={getFileUrl}
                />
              </div>
            )}

            {activeSection === 'faculty' && (
              <div className="nexus-hub-viewport" style={{ padding: '0 2rem' }}>
                <div className="f-node-head" style={{ marginBottom: '2.5rem', background: 'transparent' }}>
                  <h2 style={{ fontSize: '2.4rem', fontWeight: 950, color: 'var(--admin-secondary)', letterSpacing: '-1px' }}>FACULTY DIRECTORY</h2>
                  <div className="admin-badge accent">MANAGE STAFF</div>
                </div>
                <FacultySection
                  faculty={faculty}
                  students={students}
                  openModal={openModal}
                  handleDeleteFaculty={handleDeleteFaculty}
                  allSubjects={allAvailableSubjects}
                  getFileUrl={getFileUrl}
                />
              </div>
            )}

            {activeSection === 'courses' && (
              <div className="nexus-hub-viewport" style={{ padding: '0 2rem' }}>
                <AcademicHub
                  courses={courses}
                  students={students}
                  materials={materials}
                  openModal={openModal}
                  handleDeleteCourse={handleDeleteCourse}
                  initialSection={globalSectionFilter}
                  onSectionChange={(val) => setGlobalSectionFilter(val)}
                  openAiWithPrompt={openAiWithPrompt}
                />
              </div>
            )}

            {activeSection === 'materials' && (
              <div className="nexus-hub-viewport" style={{ padding: '0 3rem' }}>
                <div className="f-node-head" style={{ marginBottom: '3rem', background: 'transparent' }}>
                  <h2 style={{ fontSize: '2.4rem', fontWeight: 950, color: 'var(--admin-secondary)', letterSpacing: '-1px' }}>MATERIAL MANAGER</h2>
                  <div className="admin-badge warning">FILES & NOTES</div>
                </div>

                <MaterialSection
                  materials={materials}
                  openModal={openModal}
                  handleDeleteMaterial={handleDeleteMaterial}
                  getFileUrl={getMaterialUrl}
                  allSubjects={allAvailableSubjects}
                />


              </div>
            )}

            {activeSection === 'attendance' && (
              <div className="nexus-hub-viewport" style={{ padding: '0 2rem' }}>
                <div className="f-node-head" style={{ marginBottom: '2.5rem', background: 'transparent' }}>
                  <h2 style={{ fontSize: '2.4rem', fontWeight: 950, color: 'var(--admin-secondary)', letterSpacing: '-1px' }}>ATTENDANCE MONITOR</h2>
                  <div className="admin-badge warning">LIVE VIEW</div>
                </div>
                <AdminAttendancePanel />
              </div>
            )}

            {activeSection === 'schedule' && (
              <div className="nexus-hub-viewport" style={{ padding: '0 2rem' }}>
                <div className="f-node-head" style={{ marginBottom: '2.5rem', background: 'transparent' }}>
                  <h2 style={{ fontSize: '2.4rem', fontWeight: 950, color: 'var(--admin-secondary)', letterSpacing: '-1px' }}>SCHEDULE MANAGER</h2>
                  <div className="admin-badge primary">TIMETABLES</div>
                </div>
                <AdminScheduleManager />
              </div>
            )}

            {activeSection === 'todos' && (
              <div className="nexus-hub-viewport" style={{ padding: '0 2rem' }}>
                <div className="f-node-head" style={{ marginBottom: '2.5rem', background: 'transparent' }}>
                  <h2 style={{ fontSize: '2.4rem', fontWeight: 950, color: 'var(--admin-secondary)', letterSpacing: '-1px' }}>ADMIN TASKS</h2>
                  <div className="admin-badge danger">PRIORITY</div>
                </div>
                <TodoSection
                  todos={todos}
                  openModal={openModal}
                  toggleTodo={toggleTodo}
                  deleteTodo={deleteTodo}
                />
              </div>
            )}

            {activeSection === 'messages' && (
              <div className="nexus-hub-viewport" style={{ padding: '0 2rem' }}>
                <div className="f-node-head" style={{ marginBottom: '2.5rem', background: 'transparent' }}>
                  <h2 style={{ fontSize: '2.4rem', fontWeight: 950, color: 'var(--admin-secondary)', letterSpacing: '-1px' }}>ANNOUNCEMENTS</h2>
                  <div className="admin-badge primary"> BROADCAST</div>
                </div>
                <MessageSection
                  messages={messages}
                  openModal={openModal}
                />
              </div>
            )}

            {activeSection === 'broadcast' && (
              <div className="nexus-hub-viewport" style={{ padding: '0 2rem' }}>
                <div style={{ textAlign: 'center', margin: '4rem 0' }}>
                  <h2 style={{ fontSize: '3rem', fontWeight: 950, color: 'var(--admin-secondary)', letterSpacing: '-2px', marginBottom: '1rem' }}>BROADCAST SYSTEM</h2>
                  <p style={{ color: 'var(--admin-text-muted)', fontWeight: 850 }}>Send announcements to all students and faculty.</p>
                </div>
                <div className="sentinel-floating" style={{ maxWidth: '700px', margin: '0 auto', background: 'white', padding: '4rem', borderRadius: '32px', border: '1px solid var(--admin-border)', boxShadow: 'var(--admin-shadow-lg)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div className="sentinel-scanner"></div>
                  <div style={{ fontSize: '4rem', color: '#f43f5e', marginBottom: '2rem' }}><FaBullhorn /></div>
                  <button onClick={() => openModal('message')} className="admin-btn admin-btn-primary" style={{ width: '100%', height: '70px', fontSize: '1.2rem' }}>
                    CREATE ANNOUNCEMENT
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'marks' && (
              <div className="nexus-hub-viewport" style={{ padding: '0 2rem' }}>
                <AdminMarks />
              </div>
            )}

            {activeSection === 'placements' && (
              <div className="nexus-hub-viewport" style={{ padding: '0 2rem' }}>
                <AdminPlacements />
              </div>
            )}

            {activeSection === 'exams' && (
              <div className="nexus-hub-viewport" style={{ padding: '0 2rem' }}>
                <div className="f-node-head" style={{ marginBottom: '2.5rem', background: 'transparent' }}>
                  <h2 style={{ fontSize: '2.4rem', fontWeight: 950, color: 'var(--admin-secondary)', letterSpacing: '-1px' }}>EXAM MANAGEMENT</h2>
                  <div className="admin-badge accent">CONTROLS</div>
                </div>
                <AdminExams />
              </div>
            )}

            {activeSection === 'ai-agent' && (
              <div style={{ height: 'calc(100vh - 120px)', padding: '0 2rem' }}>
                <div className="f-node-head" style={{ marginBottom: '2.5rem', background: 'transparent' }}>
                  <h2 style={{ fontSize: '2.4rem', fontWeight: 950, color: 'var(--admin-secondary)', letterSpacing: '-1px' }}>AI ASSISTANT</h2>
                  <div className="admin-badge primary">AGENTIC</div>
                </div>
                <div style={{ height: 'calc(100% - 100px)', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)' }}>
                  <VuAiAgent showChat={true} setShowChat={true} initialPrompt={aiInitialPrompt} onClose={() => { setActiveSection('overview'); setAiInitialPrompt(''); }} />
                </div>
              </div>
            )}

            {activeSection === 'fees' && (
              <div className="nexus-hub-viewport" style={{ padding: '0 2rem' }}>
                <div className="f-node-head" style={{ marginBottom: '2.5rem', background: 'transparent' }}>
                  <h2 style={{ fontSize: '2.4rem', fontWeight: 950, color: 'var(--admin-secondary)', letterSpacing: '-1px' }}>REVENUE TELEMETRY</h2>
                  <div className="admin-badge primary">FEE MATRICES</div>
                </div>

                <div className="admin-stats-grid" style={{ marginBottom: '2rem' }}>
                  <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '0s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>₹{fees.reduce((acc, f) => acc + (f.totalFee || 0), 0).toLocaleString()}</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>TOTAL REVENUE</div>
                    <div className="status-indicator"></div>
                  </div>

                  <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-0.5s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>₹{fees.reduce((acc, f) => acc + (f.paidAmount || 0), 0).toLocaleString()}</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>TOTAL COLLECTED</div>
                  </div>

                  <div className="admin-summary-card sentinel-floating" style={{ animationDelay: '-1s' }}>
                    <div className="sentinel-scanner"></div>
                    <div className="value" style={{ fontWeight: 950, fontSize: '2.8rem', marginTop: '1rem' }}>₹{fees.reduce((acc, f) => acc + (f.dueAmount || 0), 0).toLocaleString()}</div>
                    <div className="label" style={{ fontWeight: 900, letterSpacing: '0.1em', fontSize: '0.65rem', color: '#94a3b8' }}>TOTAL OUTSTANDING</div>
                  </div>
                </div>

                <div className="admin-card sentinel-floating">
                  <div className="sentinel-scanner"></div>
                  <div className="f-node-head" style={{ padding: '1.5rem', borderBottom: '1px solid var(--admin-border)' }}>
                    <h3 className="f-node-title" style={{ fontWeight: 950 }}>PERSONNEL LEDGER</h3>
                  </div>
                  <div className="f-node-body">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Student ID</th>
                          <th>Status</th>
                          <th>Total Fee</th>
                          <th>Paid</th>
                          <th>Due</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fees.map(f => (
                          <tr key={f._id}>
                            <td style={{ fontWeight: 950 }}>{f.studentId}</td>
                            <td>
                              <span className={`admin-badge ${f.status === 'Paid' ? 'success' : 'warning'}`}>
                                {f.status}
                              </span>
                            </td>
                            <td>₹{f.totalFee?.toLocaleString()}</td>
                            <td style={{ color: '#10b981', fontWeight: 700 }}>₹{f.paidAmount?.toLocaleString()}</td>
                            <td style={{ color: '#ef4444', fontWeight: 700 }}>₹{f.dueAmount?.toLocaleString()}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="admin-action-btn" onClick={() => openModal('fee', f)}>
                                  <FaEdit />
                                </button>
                                <button className="admin-action-btn danger" onClick={() => handleDeleteFee(f.id)}>
                                  <FaTrash />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </main>





      {/* MODALS */}
      {
        (() => {
          // SECTION_OPTIONS moved to top level scope

          return (
            showModal && (
              <div className="modal-overlay">
                <div className="admin-modal-content" style={{ width: '95%', maxWidth: modalType === 'syllabus-view' || modalType === 'student-view' ? '900px' : '650px' }}>
                  <div className="modal-header">
                    <h2 style={{ fontWeight: 950, letterSpacing: '0.05em' }}>
                      {modalType === 'about' ? 'SYSTEM INFO' :
                        modalType === 'syllabus-view' ? 'CURRICULUM' :
                          modalType === 'student-view' ? 'STUDENT PROFILE' :
                            modalType === 'material-view' ? 'MATERIAL DETAILS' :
                              editItem ? 'EDIT ' + modalType.toUpperCase() :
                                'CREATE ' + modalType.toUpperCase()}
                    </h2>
                    <button onClick={closeModal} className="close-btn">&times;</button>
                  </div>
                  <div className="nexus-modal-body" style={{ padding: '2rem' }}>

                    {/* ABOUT / FEATURES MODAL */}
                    {modalType === 'about' && (
                      <div className="about-content">
                        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                          <div style={{ width: '100px', height: '100px', margin: '0 auto 1.5rem', borderRadius: '50%', overflow: 'hidden', border: '4px solid var(--admin-primary)', boxShadow: '0 0 20px rgba(79, 70, 229, 0.2)' }}>
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bobbymartion" alt="Admin" style={{ width: '100%', height: '100%' }} />
                          </div>
                          <h3 style={{ margin: '0 0 0.5rem', color: 'var(--admin-secondary)', fontWeight: 950 }}>ADMIN DASHBOARD</h3>
                          <p style={{ margin: 0, color: 'var(--admin-text-muted)', fontWeight: 850, fontSize: '0.9rem' }}>School Administration System</p>
                        </div>

                        <div className="f-node-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                          <h4 style={{ color: 'var(--admin-secondary)', borderBottom: '1px solid var(--admin-border)', paddingBottom: '0.75rem', marginBottom: '1.25rem', fontWeight: 950, fontSize: '0.9rem' }}>SYSTEM CAPABILITIES</h4>
                          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '1rem' }}>
                            {[
                              { text: 'Student & Faculty Management', icon: '👥' },
                              { text: 'Curriculum Management', icon: '📚' },
                              { text: 'Material Synchronization', icon: '📦' },
                              { text: 'Global Announcements', icon: '📡' },
                              { text: 'Task Management', icon: '📋' }
                            ].map((feat, i) => (
                              <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--admin-text-muted)', fontWeight: 850, fontSize: '0.9rem' }}>
                                <span style={{ fontSize: '1.2rem' }}>{feat.icon}</span> {feat.text}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: '#f8fafc', borderRadius: '16px', textAlign: 'center', border: '1px dashed var(--admin-border)' }}>
                          <span style={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--admin-text-muted)', fontWeight: 950, letterSpacing: '2px' }}>AUTHORIZED BY</span>
                          <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--admin-primary)', marginTop: '0.4rem', fontWeight: 950 }}>BOBBYMARTION</strong>
                        </div>
                      </div>
                    )}

                    {/* FEE MODAL */}
                    {/* FEE MODAL */}
                    {/* FEE MODAL */}
                    {modalType === 'fee' && (
                      <form onSubmit={handleSaveFee} className="admin-form" style={{ display: 'contents' }}>
                        <div className="nexus-modal-body">
                          <div className="admin-grid-2">
                            <div className="admin-form-group admin-grid-span-2">
                              <label className="admin-form-label">STUDENT ID</label>
                              <input className="admin-form-input" type="text" name="studentId" defaultValue={editItem?.studentId} readOnly={!!editItem} required />
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">TOTAL FEE (INR)</label>
                              <input className="admin-form-input" type="number" name="totalFee" defaultValue={editItem?.totalFee || 75000} required />
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">PAID AMOUNT (INR)</label>
                              <input className="admin-form-input" type="number" name="paidAmount" defaultValue={editItem?.paidAmount || 0} required />
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">ACADEMIC YEAR</label>
                              <input className="admin-form-input" type="text" name="academicYear" defaultValue={editItem?.academicYear || '2023-24'} placeholder="e.g. 2023-24" required />
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">SEMESTER</label>
                              <input className="admin-form-input" type="text" name="semester" defaultValue={editItem?.semester || '1st Year'} placeholder="e.g. 1st Year" required />
                            </div>
                          </div>
                        </div>
                        <div className="admin-modal-actions">
                          <button type="button" onClick={closeModal} className="admin-btn admin-btn-outline">CANCEL</button>
                          <button type="submit" className="admin-btn admin-btn-primary">UPDATE RECORD</button>
                        </div>
                      </form>
                    )}

                    {modalType === 'syllabus-view' && editItem && (
                      <div className="nexus-modal-body syllabus-view-container">
                        <div style={{ marginBottom: '2.5rem', borderBottom: '1px solid var(--admin-border)', paddingBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ margin: 0, color: 'var(--admin-secondary)', fontWeight: 950, fontSize: '1.3rem' }}>{editItem.name}</h4>
                            <div style={{ margin: '0.5rem 0 0', display: 'flex', gap: '0.5rem' }}>
                              <span className="admin-badge primary">{editItem.code}</span>
                              <span className="admin-badge accent">YEAR {editItem.year} • SEM {editItem.semester}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => { setModalType('material'); }}
                            className="admin-btn admin-btn-primary"
                            style={{ padding: '0.6rem 1.25rem', fontSize: '0.75rem' }}
                          >
                            <FaPlus /> UPLOAD MATERIAL
                          </button>
                        </div>

                        <h5 style={{ color: 'var(--admin-secondary)', fontWeight: 950, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <FaBookOpen /> CURRICULUM
                        </h5>

                        {(() => {
                          const subjectMaterials = materials.filter(m =>
                            m.subject === editItem.name || m.subject === editItem.code
                          );

                          if (subjectMaterials.length === 0) {
                            return (
                              <div className="admin-empty-state">
                                <FaBook className="admin-empty-icon" />
                                <p className="admin-empty-title">NO MATERIALS FOUND</p>
                                <p className="admin-empty-text">Upload notes, videos or syllabus.</p>
                              </div>
                            );
                          }

                          const modules = {};
                          subjectMaterials.forEach(m => {
                            const modNum = m.module || 'General';
                            if (!modules[modNum]) modules[modNum] = { units: {}, count: 0 };
                            modules[modNum].count++;

                            const unitNum = m.unit || 'General';
                            if (!modules[modNum].units[unitNum]) modules[modNum].units[unitNum] = [];
                            modules[modNum].units[unitNum].push(m);
                          });

                          return (
                            <div className="admin-list-container">
                              {Object.keys(modules).sort().map(modKey => (
                                <div key={modKey} className="admin-card" style={{ padding: '0' }}>
                                  <div className="f-node-head" style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--admin-border)' }}>
                                    <span style={{ fontWeight: 950 }}>MODULE {modKey}</span>
                                    <span className="admin-badge primary" style={{ fontSize: '0.6rem' }}>{modules[modKey].count} UNITS</span>
                                  </div>
                                  <div style={{ padding: '1.5rem' }}>
                                    {Object.keys(modules[modKey].units).sort().map(unitKey => (
                                      <div key={unitKey} style={{ marginBottom: '1.5rem', paddingLeft: '1rem', borderLeft: '2px solid var(--admin-primary)' }}>
                                        <div style={{ fontWeight: 950, color: 'var(--admin-secondary)', fontSize: '0.9rem', marginBottom: '1rem', textTransform: 'uppercase' }}>UNIT {unitKey}</div>
                                        <div className="admin-list-container" style={{ gap: '0.75rem' }}>
                                          {modules[modKey].units[unitKey].map(m => (
                                            <div key={m.id || m._id} className="admin-summary-card" style={{ padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
                                                <span className={`admin-badge ${m.type === 'videos' ? 'accent' : m.type === 'syllabus' ? 'warning' : 'primary'}`} style={{ fontSize: '0.6rem' }}>{m.type.toUpperCase()}</span>
                                                <span style={{ fontWeight: 850, fontSize: '0.9rem', color: 'var(--admin-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>{m.topic || m.title}</span>
                                              </div>
                                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => window.open(getFileUrl(m), '_blank')} className="f-exam-card" style={{ padding: '0.5rem', background: 'white' }} title="View"><FaEye /></button>
                                                <button onClick={() => handleDeleteMaterial(m.id || m._id)} className="f-cancel-btn" style={{ padding: '0.5rem' }} title="Delete"><FaTrash /></button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    {modalType === 'syllabus-view' && (
                      <div className="admin-modal-actions" style={{ marginTop: 0 }}>
                        <button type="button" onClick={closeModal} className="admin-btn admin-btn-outline">CLOSE</button>
                      </div>
                    )}

                    {/* STUDENT CURRICULUM INSPECTION */}
                    {modalType === 'student-curriculum' && editItem && (
                      <div className="modal-body view-details">
                        <div className="f-node-head" style={{ padding: '2rem', borderBottom: '1px solid var(--admin-border)' }}>
                          <div>
                            <h3 className="f-node-title" style={{ fontSize: '1.4rem' }}>{editItem.name}</h3>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <span className="admin-badge primary">SID: {editItem.sid}</span>
                              <span className="admin-badge accent">YEAR {editItem.year} • {editItem.branch}</span>
                              <span className="admin-badge warning">SEC {editItem.section || 'A'}</span>
                            </div>
                          </div>
                          <FaLayerGroup size={32} style={{ opacity: 0.2 }} />
                        </div>

                        <div className="admin-list-container" style={{ padding: '2rem' }}>
                          {(() => {
                            const staticData = getYearData(editItem.branch, editItem.year);
                            const semesters = [1, 2, 3, 4, 5, 6, 7, 8].filter(s => {
                              // Filter semesters relevant to current year (approx)
                              const curYear = parseInt(editItem.year);
                              return s >= (curYear * 2 - 1) && s <= (curYear * 2);
                            });

                            if (semesters.length === 0) return <div className="admin-empty-state"><p>No curriculum map found for this cohort.</p></div>;

                            return semesters.map(semNum => {
                              // 1. Get static subjects for this semester
                              let semSubjects = [];
                              const staticSem = staticData?.semesters?.find(s => String(s.sem) === String(semNum));
                              if (staticSem) {
                                semSubjects = staticSem.subjects.map(s => ({ ...s, isStatic: true }));
                              }

                              // 2. Get dynamic subjects for this semester/branch/section
                              const dynamicSemSubjects = courses.filter(c =>
                                String(c.semester) === String(semNum) &&
                                (c.branch === editItem.branch || c.branch === 'All') &&
                                (c.section === editItem.section || c.section === 'All')
                              );

                              // 3. Merge: Dynamic overrides static if code/name matches, otherwise add both
                              // Actually, the app logic usually prefers showing both if they are distinct, 
                              // or dynamic replaces static if it's a 'refinement'.
                              // For clarity, we merge and deduplicate by code.
                              const mergedSubjects = [...dynamicSemSubjects];
                              semSubjects.forEach(ss => {
                                if (!mergedSubjects.some(ms => ms.code === ss.code)) {
                                  mergedSubjects.push(ss);
                                }
                              });

                              if (mergedSubjects.length === 0) return null;

                              return (
                                <div key={semNum} className="admin-card" style={{ marginBottom: '2rem', padding: '0', overflow: 'hidden' }}>
                                  <div style={{ background: '#f8fafc', padding: '1rem 1.5rem', borderBottom: '1px solid var(--admin-border)' }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 950, color: 'var(--admin-secondary)' }}>SEMESTER {semNum}</h4>
                                  </div>
                                  <table className="admin-grid-table" style={{ margin: 0 }}>
                                    <thead>
                                      <tr>
                                        <th style={{ paddingLeft: '1.5rem' }}>SUBJECT MODULE</th>
                                        <th>CODE</th>
                                        <th>TYPE</th>
                                        <th>NOTES</th>
                                        <th>VIDEOS</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {mergedSubjects.map(sub => {
                                        const subNotes = materials.filter(m =>
                                          (m.subject === sub.name || m.subject === sub.code) &&
                                          m.type === 'notes' &&
                                          (m.section === 'All' || m.section === editItem.section)
                                        );
                                        const subVideos = materials.filter(m =>
                                          (m.subject === sub.name || m.subject === sub.code) &&
                                          m.type === 'videos' &&
                                          (m.section === 'All' || m.section === editItem.section)
                                        );

                                        return (
                                          <tr key={sub.code || sub._id}>
                                            <td style={{ paddingLeft: '1.5rem', fontWeight: 600 }}>{sub.name}</td>
                                            <td style={{ fontSize: '0.8rem', opacity: 0.7 }}>{sub.code}</td>
                                            <td>
                                              <span className={`admin-badge ${sub.isStatic ? 'outline' : 'primary'}`} style={{ fontSize: '0.6rem' }}>
                                                {sub.isStatic ? 'CORE' : 'CUSTOM'}
                                              </span>
                                            </td>
                                            <td>
                                              {subNotes.length > 0 ? (
                                                <span className="admin-badge primary" style={{ fontSize: '0.7rem' }}>{subNotes.length} ACTIVE</span>
                                              ) : (
                                                <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>EMPTY</span>
                                              )}
                                            </td>
                                            <td>
                                              {subVideos.length > 0 ? (
                                                <span className="admin-badge accent" style={{ fontSize: '0.7rem' }}>{subVideos.length} STREAMING</span>
                                              ) : (
                                                <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>OFFLINE</span>
                                              )}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                    {modalType === 'student-curriculum' && (
                      <div className="admin-modal-actions" style={{ marginTop: 0 }}>
                        <button onClick={closeModal} className="admin-btn admin-btn-primary" style={{ width: '100%' }}>CLOSE INSPECTION</button>
                      </div>
                    )}

                    {/* Dynamic Forms based on modalType */}
                    {modalType === 'student' && (
                      <form onSubmit={handleSaveStudent} style={{ display: 'contents' }}>
                        <div className="modal-body">
                          <div className="admin-grid-2">
                            <div className="admin-form-group full-width admin-grid-span-2">
                              <label className="admin-form-label">FULL NAME *</label>
                              <input className="admin-form-input" name="name" defaultValue={editItem?.name} required placeholder="Enter student's full name" />
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">STUDENT ID *</label>
                              <input className="admin-form-input" name="sid" defaultValue={editItem?.sid} required placeholder="e.g. S-100234" />
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">EMAIL *</label>
                              <input className="admin-form-input" name="email" type="email" defaultValue={editItem?.email} required placeholder="email@nexus.edu" />
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">YEAR *</label>
                              <select className="admin-form-input" name="year" defaultValue={editItem?.year || '1'} style={{ paddingLeft: '1rem' }}>
                                <option value="1">Year 1</option><option value="2">Year 2</option><option value="3">Year 3</option><option value="4">Year 4</option>
                              </select>
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">BRANCH *</label>
                              <select className="admin-form-input" name="branch" defaultValue={editItem?.branch || 'CSE'} style={{ paddingLeft: '1rem' }}>
                                {['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIML'].map(b => <option key={b} value={b}>{b}</option>)}
                              </select>
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">SEMESTER *</label>
                              <select className="admin-form-input" name="semester" defaultValue={editItem?.semester || '1'} style={{ paddingLeft: '1rem' }}>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                              </select>
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">SECTION *</label>
                              <select className="admin-form-input" name="section" defaultValue={editItem?.section || 'A'} style={{ paddingLeft: '1rem' }}>
                                {SECTION_OPTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                              </select>
                            </div>
                            <div className="admin-form-group full-width admin-grid-span-2">
                              <label className="admin-form-label">PASSWORD</label>
                              <input className="admin-form-input" name="password" type="password" placeholder={editItem ? "Leave empty to retain" : "Initial password"} />
                            </div>
                          </div>
                        </div>
                        <div className="admin-modal-actions">
                          <button type="button" onClick={closeModal} className="admin-btn admin-btn-outline" style={{ border: 'none' }}>CANCEL</button>
                          <button className="admin-btn admin-btn-primary">SAVE STUDENT</button>
                        </div>
                      </form>
                    )}

                    {modalType === 'bulk-student' && (
                      <form onSubmit={handleBulkUploadStudents} style={{ display: 'contents' }}>
                        <div className="nexus-modal-body">
                          <div className="f-node-card" style={{ padding: '2rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', color: 'var(--admin-primary)', marginBottom: '1.5rem' }}><FaFileUpload /></div>
                            <label style={{ display: 'block', fontSize: '1rem', fontWeight: 950, color: 'var(--admin-secondary)', marginBottom: '1rem' }}>CSV UPLOAD</label>
                            <input type="file" name="file" accept=".csv" required style={{ width: '100%', padding: '2rem', border: '2px dashed var(--admin-border)', borderRadius: '16px', background: '#f8fafc' }} />
                            <div style={{ marginTop: '1.5rem', textAlign: 'left', background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
                              <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontWeight: 850, margin: 0 }}>
                                REQUIRED HEADERS: <code>name, sid, email, year, section, branch</code>
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="admin-modal-actions">
                          <button type="button" onClick={closeModal} className="admin-btn admin-btn-outline" style={{ border: 'none' }}>CANCEL</button>
                          <button className="admin-btn admin-btn-primary">UPLOAD STUDENTS</button>
                        </div>
                      </form>
                    )}


                    {modalType === 'bulk-faculty' && (
                      <form onSubmit={handleBulkUploadFaculty} style={{ display: 'contents' }}>
                        <div className="nexus-modal-body">
                          <div className="f-node-card" style={{ padding: '2rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', color: 'var(--admin-primary)', marginBottom: '1.5rem' }}><FaFileUpload /></div>
                            <label style={{ display: 'block', fontSize: '1rem', fontWeight: 950, color: 'var(--admin-secondary)', marginBottom: '1rem' }}>FACULTY BULK UPLOAD - CSV</label>
                            <input type="file" name="file" accept=".csv" required style={{ width: '100%', padding: '2rem', border: '2px dashed var(--admin-border)', borderRadius: '16px', background: '#f8fafc' }} />
                            <div style={{ marginTop: '1.5rem', textAlign: 'left', background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
                              <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontWeight: 850, margin: '0 0 0.5rem 0' }}>
                                REQUIRED HEADERS: <code>name, facultyId, email, department, designation</code>
                              </p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontWeight: 850, margin: 0 }}>
                                OPTIONAL: <code>phone, password, assignments</code>
                              </p>
                              <p style={{ fontSize: '0.65rem', color: '#94a3b8', fontStyle: 'italic', marginTop: '0.5rem', marginBottom: 0 }}>
                                Assignments format: "Year 3 Section A Subject AI; Year 3 Section B Subject ML"
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="admin-modal-actions">
                          <button type="button" onClick={closeModal} className="admin-btn admin-btn-outline" style={{ border: 'none' }}>CANCEL</button>
                          <button className="admin-btn admin-btn-primary">UPLOAD FACULTY</button>
                        </div>
                      </form>
                    )}


                    {modalType === 'student-view' && editItem && (
                      <div className="nexus-modal-body view-details sentinel-floating" style={{ position: 'relative', overflow: 'hidden', padding: 0 }}>
                        <div className="sentinel-scanner"></div>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--admin-primary)' }}></div>

                        <div style={{ padding: '2.5rem' }}>
                          <div className="admin-profile-header" style={{ borderBottom: '1px solid var(--admin-border)', paddingBottom: '2.5rem', marginBottom: '2.5rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
                            <div className="admin-avatar-lg" style={{ width: '120px', height: '120px', borderRadius: '30px', border: '4px solid var(--admin-bg-soft)', boxShadow: 'var(--admin-shadow)', overflow: 'hidden' }}>
                              <img src={editItem.profilePic ? getFileUrl(editItem.profilePic) : `https://api.dicebear.com/7.x/avataaars/svg?seed=${editItem.name}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                <h3 style={{ margin: 0, color: 'var(--admin-secondary)', fontWeight: 950, fontSize: '2rem', letterSpacing: '-1px' }}>{editItem.name.toUpperCase()}</h3>
                                <span className={`admin-badge ${editItem.status === 'Inactive' ? 'danger' : 'success'}`} style={{ fontSize: '0.65rem' }}>{editItem.status?.toUpperCase() || 'ACTIVE'}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                <span className="admin-badge primary" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--admin-primary)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>ID: {editItem.sid}</span>
                                <span className="admin-badge accent" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.2)' }}>YEAR {editItem.year} • {editItem.branch}</span>
                                <span className="admin-badge warning" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>SEC {editItem.section || 'A'}</span>
                              </div>
                              <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--admin-text-muted)', fontWeight: 800 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaEnvelope style={{ color: 'var(--admin-primary)' }} /> {editItem.email}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaShieldAlt style={{ color: '#10b981' }} /> VERIFIED GEN-9</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2.5rem' }}>
                            <div className="f-node-card" style={{ padding: '2rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                              <h4 style={{ color: 'var(--admin-secondary)', fontWeight: 950, fontSize: '0.8rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '0.1em' }}><FaChartBar /> PERFORMANCE METRICS</h4>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="admin-summary-card" style={{ padding: '1.25rem', background: 'white', border: '1px solid #f1f5f9' }}>
                                  <div className="value" style={{ fontSize: '1.8rem', color: 'var(--admin-primary)', fontWeight: 950 }}>{editItem.stats?.totalClasses > 0 ? Math.round((editItem.stats?.totalPresent / editItem.stats?.totalClasses) * 100) : editItem.attendance || 0}%</div>
                                  <div className="label" style={{ fontWeight: 900, fontSize: '0.6rem' }}>ATTENDANCE</div>
                                </div>
                                <div className="admin-summary-card" style={{ padding: '1.25rem', background: 'white', border: '1px solid #f1f5f9' }}>
                                  <div className="value" style={{ fontSize: '1.8rem', color: '#8b5cf6', fontWeight: 950 }}>{editItem.stats?.aiUsageCount || Math.floor(Math.random() * 50)}</div>
                                  <div className="label" style={{ fontWeight: 900, fontSize: '0.6rem' }}>AI INTELLIGENCE</div>
                                </div>
                                <div className="admin-summary-card" style={{ padding: '1.25rem', background: 'white', border: '1px solid #f1f5f9' }}>
                                  <div className="value" style={{ fontSize: '1.8rem', color: '#10b981', fontWeight: 950 }}>{editItem.stats?.streak || 0}</div>
                                  <div className="label" style={{ fontWeight: 900, fontSize: '0.6rem' }}>STUDY STREAK</div>
                                </div>
                                <div className="admin-summary-card" style={{ padding: '1.25rem', background: 'white', border: '1px solid #f1f5f9' }}>
                                  <div className="value" style={{ fontSize: '1.8rem', color: '#f59e0b', fontWeight: 950 }}>{editItem.stats?.tasksCompleted || 0}</div>
                                  <div className="label" style={{ fontWeight: 900, fontSize: '0.6rem' }}>OPERATIONS</div>
                                </div>
                              </div>
                            </div>

                            <div className="f-node-card" style={{ padding: '2rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                              <h4 style={{ color: 'var(--admin-secondary)', fontWeight: 950, fontSize: '0.8rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '0.1em' }}><FaUserClock /> ACTIVITY TELEMETRY</h4>
                              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '120px', padding: '0 5px' }}>
                                {(editItem.stats?.weeklyActivity || [
                                  { day: 'M', hours: 4 }, { day: 'T', hours: 7 }, { day: 'W', hours: 5 },
                                  { day: 'T', hours: 8 }, { day: 'F', hours: 6 }, { day: 'S', hours: 2 }, { day: 'S', hours: 1 }
                                ]).map((d, i) => (
                                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                    <div style={{
                                      width: '100%',
                                      height: `${Math.max(10, (d.hours / 12) * 100)}%`,
                                      background: 'linear-gradient(to top, var(--admin-primary), #8b5cf6)',
                                      borderRadius: '6px'
                                    }}></div>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 950, color: '#94a3b8' }}>{String(d.day || d.label || '').charAt(0)}</span>
                                  </div>
                                ))}
                              </div>
                              <div style={{ marginTop: '2rem', textAlign: 'center', background: 'white', padding: '0.75rem', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 950, color: 'var(--admin-secondary)' }}>AVG FLOW: {(editItem.stats?.weeklyActivity?.reduce((acc, c) => acc + (c.hours || 0), 0) / 7 || 4.2).toFixed(1)} HRS / DAY</span>
                              </div>
                            </div>
                          </div>

                          <div className="admin-modal-actions" style={{ marginTop: '3rem', borderTop: '1px solid var(--admin-border)', paddingTop: '2.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => openModal('student', editItem)} className="admin-btn admin-btn-outline" style={{ border: 'none', fontWeight: 950 }}>RECONFIGURE DATA</button>
                            <button onClick={closeModal} className="admin-btn admin-btn-primary" style={{ padding: '0 2.5rem', fontWeight: 950 }}>CLOSE DOSSIER</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {modalType === 'faculty-view' && editItem && (
                      <div className="nexus-modal-body view-details sentinel-floating" style={{ position: 'relative', overflow: 'hidden', padding: 0 }}>
                        <div className="sentinel-scanner"></div>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--admin-primary)' }}></div>

                        <div style={{ padding: '2.5rem' }}>
                          <div className="admin-profile-header" style={{ borderBottom: '1px solid var(--admin-border)', paddingBottom: '2.5rem', marginBottom: '2.5rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
                            <div className="admin-avatar-lg" style={{ width: '120px', height: '120px', borderRadius: '30px', background: '#f5f3ff', color: 'var(--admin-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', border: '4px solid white', boxShadow: 'var(--admin-shadow)', overflow: 'hidden' }}>
                              {editItem.profilePic ? (
                                <img src={getFileUrl(editItem.profilePic)} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <FaChalkboardTeacher />
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                                <h3 style={{ margin: 0, color: 'var(--admin-secondary)', fontWeight: 950, fontSize: '2rem', letterSpacing: '-1px' }}>{editItem.name.toUpperCase()}</h3>
                                <span className="admin-badge success" style={{ fontSize: '0.65rem' }}>CERTIFIED INSTRUCTOR</span>
                              </div>
                              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                <span className="admin-badge primary" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--admin-primary)', border: '1px solid rgba(99, 102, 241, 0.2)' }}>FACULTY ID: {editItem.facultyId}</span>
                                <span className="admin-badge accent" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', border: '1px solid rgba(139, 92, 246, 0.2)' }}>{editItem.designation || 'SENIOR LECTURER'}</span>
                                <span className="admin-badge warning" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' }}>{editItem.department || 'CENTRAL OPS'}</span>
                              </div>
                              <div style={{ marginTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--admin-text-muted)', fontWeight: 800 }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaEnvelope style={{ color: 'var(--admin-primary)' }} /> {editItem.email}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaUsers style={{ color: '#10b981' }} /> {editItem.assignments?.length || 0} ASSIGNED ACTIVE NODES</span>
                              </div>
                            </div>
                          </div>

                          <div className="f-node-card" style={{ padding: '2rem', background: '#f8fafc', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                            <h4 style={{ color: 'var(--admin-secondary)', fontWeight: 950, fontSize: '0.8rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', letterSpacing: '0.1em' }}><FaLayerGroup /> ACADEMIC LOAD ARCHITECTURE</h4>
                            <div className="admin-list-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                              {(editItem.assignments || facultyAssignments || []).length > 0 ? (
                                (editItem.assignments || facultyAssignments).map((assign, idx) => (
                                  <div key={idx} className="admin-list-item" style={{ background: 'white', padding: '1.25rem', borderRadius: '16px', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '1rem', transition: '0.2s' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-primary)', fontSize: '1.2rem' }}>
                                      <FaBook />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ fontWeight: 950, color: 'var(--admin-secondary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{assign.subject}</div>
                                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 900, display: 'flex', gap: '0.75rem' }}>
                                        <span style={{ color: '#6366f1' }}>YEAR {assign.year}</span>
                                        <span>•</span>
                                        <span style={{ color: '#8b5cf6' }}>{assign.branch || 'Common'}</span>
                                        <span>•</span>
                                        <span style={{ color: '#f59e0b' }}>SEC {assign.section}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div style={{ gridColumn: 'span 2', padding: '4rem', textAlign: 'center', background: 'white', borderRadius: '24px', border: '2px dashed #e2e8f0' }}>
                                  <FaClipboardList style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '1rem' }} />
                                  <p style={{ fontWeight: 950, color: '#94a3b8' }}>NO OPERATIONAL DEPLOYMENTS ANALYZED</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="admin-modal-actions" style={{ marginTop: '3rem', borderTop: '1px solid var(--admin-border)', paddingTop: '2.5rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => openModal('faculty', editItem)} className="admin-btn admin-btn-outline" style={{ border: 'none', fontWeight: 950 }}>RECONFIGURE ACCESS</button>
                            <button onClick={closeModal} className="admin-btn admin-btn-primary" style={{ padding: '0 2.5rem', fontWeight: 950 }}>CLOSE PROFILE</button>
                          </div>
                        </div>
                      </div>
                    )}

                    {modalType === 'material-view' && editItem && (
                      <div className="nexus-modal-body view-details">
                        <div className="f-node-card" style={{ padding: '0' }}>
                          <div className="f-node-head" style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--admin-border)' }}>
                            <h3 className="f-node-title" style={{ fontSize: '1.2rem' }}>{editItem.title}</h3>
                            <span className={`admin-badge ${editItem.type === 'videos' ? 'accent' : 'primary'}`}>{editItem.type.toUpperCase()}</span>
                          </div>
                          <div style={{ padding: '2rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                              <div className="detail-row" style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 950, color: 'var(--admin-text-muted)', marginBottom: '0.25rem' }}>SUBJECT ORIGIN</div>
                                <div style={{ fontWeight: 850, color: 'var(--admin-secondary)' }}>{editItem.subject || 'General'}</div>
                              </div>
                              <div className="detail-row" style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 950, color: 'var(--admin-text-muted)', marginBottom: '0.25rem' }}>TARGET YEAR</div>
                                <div style={{ fontWeight: 850, color: 'var(--admin-secondary)' }}>YEAR {editItem.year} • SEC {editItem.section || 'GLOBAL'}</div>
                              </div>
                              <div className="detail-row" style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 950, color: 'var(--admin-text-muted)', marginBottom: '0.25rem' }}>TOPICAL FOCUS</div>
                                <div style={{ fontWeight: 850, color: 'var(--admin-secondary)' }}>{editItem.topic || 'General Strategy'}</div>
                              </div>
                              <div className="detail-row" style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 950, color: 'var(--admin-text-muted)', marginBottom: '0.25rem' }}>MODULE / UNIT</div>
                                <div style={{ fontWeight: 850, color: 'var(--admin-secondary)' }}>MOD {editItem.module} / UNIT {editItem.unit}</div>
                              </div>
                            </div>

                            <div style={{ marginTop: '2rem', padding: '1rem', borderTop: '1px solid var(--admin-border)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--admin-text-muted)', fontWeight: 850 }}>
                                <span>UPLINKED BY: {editItem.uploadedBy?.name || editItem.uploadedBy || 'GOVERNANCE'}</span>
                                <span>TIMESTAMP: {new Date(editItem.uploadedAt).toLocaleString()}</span>
                              </div>
                            </div>

                            {editItem.url && (
                              <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#eff6ff', borderRadius: '12px', border: '1px solid #dbeafe' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: 950, color: 'var(--admin-primary)', marginBottom: '0.25rem' }}>MATERIAL LINK</div>
                                <a href={getFileUrl(editItem.url)} target="_blank" rel="noreferrer" style={{ color: 'var(--admin-primary)', fontWeight: 950, textDecoration: 'none', wordBreak: 'break-all', fontSize: '0.85rem' }}>
                                  {editItem.url}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="modal-actions" style={{ marginTop: '2rem' }}>
                          <button onClick={() => openModal('material', editItem)} className="admin-btn admin-btn-outline" style={{ marginRight: '1rem', border: 'none' }}>EDIT</button>
                          <button onClick={closeModal} className="admin-btn admin-btn-primary">CLOSE</button>
                        </div>
                      </div>
                    )}


                    {/* FACULTY FORM */}
                    {modalType === 'faculty' && (
                      <form onSubmit={handleSaveFaculty} style={{ display: 'contents' }}>
                        <div className="nexus-modal-body">
                          <div className="admin-grid-2">
                            <div className="admin-form-group admin-grid-span-2">
                              <label className="admin-form-label">FULL NAME *</label>
                              <input className="admin-form-input" name="name" defaultValue={editItem?.name} required placeholder="Full Name" />
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">FACULTY ID *</label>
                              <input className="admin-form-input" name="facultyId" defaultValue={editItem?.facultyId} required placeholder="e.g. F-501" />
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">EMAIL *</label>
                              <input className="admin-form-input" name="email" defaultValue={editItem?.email || (editItem?.facultyId ? `${editItem.facultyId}@example.com` : '')} required placeholder="email@domain.com" />
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">DEPARTMENT</label>
                              <input className="admin-form-input" name="department" defaultValue={editItem?.department || 'CSE'} placeholder="e.g. CSE" />
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">DESIGNATION</label>
                              <input className="admin-form-input" name="designation" defaultValue={editItem?.designation} placeholder="e.g. Professor" />
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">PASSWORD {!editItem && '*'}</label>
                              <div style={{ position: 'relative' }}>
                                <input
                                  className="admin-form-input"
                                  name="password"
                                  type={showPassword ? "text" : "password"}
                                  required={!editItem}
                                  placeholder={editItem ? "Leave to keep current" : "Enter password"}
                                  style={{ paddingRight: '40px' }}
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--admin-text-muted)'
                                  }}
                                >
                                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                              </div>
                            </div>
                            <div className="admin-form-group admin-grid-span-2">
                              <label className="admin-form-label">PROFILE PICTURE</label>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                {editItem?.profilePic && (
                                  <img
                                    src={getFileUrl(editItem.profilePic)}
                                    alt="Current"
                                    style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--admin-border)' }}
                                  />
                                )}
                                <input type="file" name="file" accept="image/*" className="admin-form-input" />
                              </div>
                            </div>
                          </div>

                          {/* Assignment Manager */}
                          <div style={{ marginTop: '1.5rem', background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--admin-border)' }}>
                            <label className="admin-form-label" style={{ marginBottom: '1rem', color: 'var(--admin-secondary)', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>CLASS ASSIGNMENTS</label>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', alignItems: 'flex-end' }}>
                              <div style={{ flex: 1 }}>
                                <label className="admin-form-label" style={{ fontSize: '0.65rem' }}>YEAR</label>
                                <select id="assign-year" className="admin-form-input" style={{ padding: '0.6rem' }}>
                                  <option value="">Select</option>
                                  <option value="1">1</option><option value="2">2</option><option value="3">3</option><option value="4">4</option>
                                </select>
                              </div>
                              <div style={{ flex: 1 }}>
                                <label className="admin-form-label" style={{ fontSize: '0.65rem' }}>SEM</label>
                                <select id="assign-semester" className="admin-form-input" style={{ padding: '0.6rem' }}>
                                  <option value="">Select</option>
                                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </div>
                              <div style={{ flex: 1 }}>
                                <label className="admin-form-label" style={{ fontSize: '0.65rem' }}>BRANCH</label>
                                <input id="assign-branch" className="admin-form-input" placeholder="e.g. CSE, ECE" style={{ padding: '0.6rem' }} defaultValue="CSE" />
                              </div>
                              <div style={{ flex: 1 }}>
                                <label className="admin-form-label" style={{ fontSize: '0.65rem' }}>SECTION</label>
                                <input id="assign-section" className="admin-form-input" placeholder="e.g. A, B" style={{ padding: '0.6rem' }} />
                              </div>
                            </div>
                            <div style={{ marginTop: '0.75rem' }}>
                              <label className="admin-form-label" style={{ fontSize: '0.65rem' }}>SUBJECT</label>
                              <select id="assign-subject" className="admin-form-input" style={{ padding: '0.6rem' }}>
                                <option value="">Select Subject</option>
                                {allAvailableSubjects.map(c => (
                                  <option key={c.code} value={c.name}>{c.name} ({c.code})</option>
                                ))}
                              </select>
                            </div>

                            <button type="button" onClick={handleAddAssignment} className="admin-btn admin-btn-outline full-width" style={{ marginTop: '1rem', justifyContent: 'center' }}>
                              <FaPlus /> ADD ASSIGNMENT
                            </button>

                            <div className="assignments-list" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {facultyAssignments.map((assign, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--admin-border)', fontSize: '0.85rem' }}>
                                  <span style={{ fontWeight: 600, color: 'var(--admin-secondary)' }}>
                                    <span style={{ color: 'var(--admin-primary)' }}>{assign.branch}</span> • Y{assign.year} • Sec {assign.section}
                                    <br />
                                    <span style={{ fontWeight: 400, color: 'var(--admin-text-muted)', fontSize: '0.8rem' }}>{assign.subject}</span>
                                  </span>
                                  <button type="button" onClick={() => handleRemoveAssignment(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}>
                                    <FaTrash />
                                  </button>
                                </div>
                              ))}
                              {facultyAssignments.length === 0 && <div className="admin-empty-state" style={{ padding: '1rem' }}><p style={{ fontSize: '0.85rem' }}>No classes assigned yet.</p></div>}
                            </div>
                          </div>
                          <br />
                        </div>

                        <div className="admin-modal-actions">
                          <button type="button" onClick={closeModal} className="admin-btn admin-btn-outline">CANCEL</button>
                          <button className="admin-btn admin-btn-primary">SAVE FACULTY</button>
                        </div>
                      </form>
                    )}

                    {modalType === 'course' && (
                      <form onSubmit={handleSaveCourse} style={{ display: 'contents' }}>
                        <div className="nexus-modal-body">
                          <div className="admin-grid-2">
                            <div className="admin-form-group admin-grid-span-2">
                              <label className="admin-form-label">COURSE NAME *</label>
                              <input className="admin-form-input" name="name" defaultValue={editItem?.name} required placeholder="e.g. Software Systems" />
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">COURSE CODE *</label>
                              <input className="admin-form-input" name="code" defaultValue={editItem?.code} required placeholder="e.g. CS-501" />
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">YEAR *</label>
                              <select className="admin-form-input" name="year" defaultValue={editItem?.year || '1'} required>
                                <option value="1">Year 1</option><option value="2">Year 2</option><option value="3">Year 3</option><option value="4">Year 4</option>
                              </select>
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">SEMESTER *</label>
                              <select className="admin-form-input" name="semester" defaultValue={editItem?.semester || '1'} required>
                                {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                              </select>
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">BRANCH *</label>
                              <input className="admin-form-input" name="branch" defaultValue={editItem?.branch || 'CSE'} required placeholder="e.g. CSE, ECE" />
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">SECTION</label>
                              <input className="admin-form-input" name="section" defaultValue={editItem?.section || 'All'} required placeholder="e.g. 'A, B' or 'All'" />
                            </div>
                          </div>
                        </div>
                        <div className="admin-modal-actions">
                          <button type="button" onClick={closeModal} className="admin-btn admin-btn-outline">CANCEL</button>
                          <button className="admin-btn admin-btn-primary">SAVE COURSE</button>
                        </div>
                      </form>
                    )}

                    {modalType === 'material' && (
                      <form onSubmit={handleSaveMaterial} style={{ display: 'contents' }}>
                        <div className="nexus-modal-body">
                          <div className="admin-grid-2">
                            <div className="admin-form-group admin-grid-span-2">
                              <label className="admin-form-label">TITLE *</label>
                              <input className="admin-form-input" name="title" required placeholder="e.g. Unit 1 Notes" defaultValue={editItem?.title} />
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">CATEGORY</label>
                              <select className="admin-form-input" name="type" defaultValue={editItem?.type || "notes"}>
                                <option value="notes">Notes/PDF</option>
                                <option value="videos">Video Lectures</option>
                                <option value="models">AI Models / 3D</option>
                                <option value="interviewQnA">Q&A / Interviews</option>
                                <option value="modelPapers">Exam Papers</option>
                                <option value="syllabus">Syllabus</option>
                              </select>
                            </div>

                            <div className="admin-form-group">
                              <label className="admin-form-label">YEAR</label>
                              <select className="admin-form-input" name="year" required defaultValue={editItem?.isAdvanced ? 'Advanced' : (editItem?.year || '1')}>
                                {editItem?.isAdvanced ? <option value="Advanced">Advanced</option> :
                                  [1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)
                                }
                              </select>
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">SUBJECT</label>
                              <select className="admin-form-input" name="subject" required defaultValue={editItem?.subject || ''}>
                                <option value="">Select Subject...</option>
                                {editItem?.isAdvanced
                                  ? ADVANCED_TOPICS.map(t => <option key={t} value={t}>{t}</option>)
                                  : allAvailableSubjects.map(c => <option key={c.code} value={c.name}>{c.name} ({c.code})</option>)
                                }
                              </select>
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">MODULE</label>
                              <select className="admin-form-input" name="module" defaultValue={editItem?.module}>
                                {[1, 2, 3, 4, 5].map(m => <option key={m} value={m}>Module {m}</option>)}
                              </select>
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">UNIT</label>
                              <select className="admin-form-input" name="unit" defaultValue={editItem?.unit}>
                                {[1, 2, 3, 4, 5].map(u => <option key={u} value={u}>Unit {u}</option>)}
                              </select>
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">BRANCH</label>
                              <select className="admin-form-input" name="branch" defaultValue={editItem?.branch || "All"}>
                                {['All', 'CSE', 'AIML', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'].map(b => <option key={b} value={b}>{b}</option>)}
                              </select>
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">SECTION</label>
                              <input className="admin-form-input" name="section" defaultValue={editItem?.section || 'All'} placeholder="e.g. 'A, B' or 'All'" />
                            </div>
                            <div className="admin-form-group admin-grid-span-2">
                              <label className="admin-form-label">TOPIC</label>
                              <input className="admin-form-input" name="topic" placeholder="e.g. Introduction to Systems" defaultValue={editItem?.topic} />
                            </div>
                            <div className="admin-form-group admin-grid-span-2">
                              <label className="admin-form-label">FILE / LINK</label>
                              <div className="admin-grid-2">
                                <input type="file" className="admin-form-input" name="file" style={{ padding: '0.6rem' }} />
                                <input className="admin-form-input" name="url" placeholder="OR Secure External URL (https://...)" defaultValue={editItem?.url} />
                              </div>
                            </div>
                            <div className="admin-form-group admin-grid-span-2" style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px' }}>
                              <input type="checkbox" name="isAdvanced" id="isAdvanced" defaultChecked={editItem?.isAdvanced || false} style={{ width: '20px', height: '20px' }} />
                              <label htmlFor="isAdvanced" className="admin-form-label" style={{ margin: 0, color: 'var(--admin-secondary)', fontSize: '0.85rem' }}>MARK AS ADVANCED LEARNING CONTENT</label>
                            </div>
                          </div>
                        </div>
                        <div className="admin-modal-actions">
                          <button type="button" onClick={closeModal} className="admin-btn admin-btn-outline">CANCEL</button>
                          <button className="admin-btn admin-btn-primary">UPLOAD MATERIAL</button>
                        </div>
                      </form>
                    )}

                    {modalType === 'todo' && (
                      <form onSubmit={handleSaveTodo} style={{ display: 'contents' }}>
                        <div className="nexus-modal-body">
                          <div className="admin-grid-2">
                            <div className="admin-form-group admin-grid-span-2">
                              <label className="admin-form-label">TASK DESCRIPTION *</label>
                              <textarea className="admin-form-input" name="text" defaultValue={editItem?.text} required rows="4" style={{ padding: '1.25rem' }} placeholder="Define the task details..."></textarea>
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">ASSIGNMENT SCOPE</label>
                              <select className="admin-form-input" name="target" defaultValue={editItem?.target || 'admin'}>
                                <option value="admin">Admin Only (Private)</option>
                                <option value="all">Global (Public Announcement)</option>
                                <option value="student">All Students</option>
                                <option value="faculty">All Faculty</option>
                              </select>
                            </div>
                            <div className="admin-form-group">
                              <label className="admin-form-label">DEADLINE</label>
                              <input className="admin-form-input" type="date" name="dueDate" defaultValue={editItem?.dueDate} />
                            </div>
                          </div>
                        </div>
                        <div className="admin-modal-actions">
                          <button type="button" onClick={closeModal} className="admin-btn admin-btn-outline">CANCEL</button>
                          <button className="admin-btn admin-btn-primary">SAVE TASK</button>
                        </div>
                      </form>
                    )}

                    {modalType === 'message' && (
                      <form onSubmit={handleSendMessage} style={{ display: 'contents' }}>
                        <div className="nexus-modal-body">
                          <div className="admin-grid-2">
                            <div className="admin-form-group admin-grid-span-2">
                              <label className="admin-form-label">TARGET AUDIENCE</label>
                              <select className="admin-form-input" name="target" value={msgTarget} onChange={(e) => setMsgTarget(e.target.value)}>
                                <option value="all">EVERYONE (GLOBAL ANNOUNCEMENT)</option>
                                <option value="students">ALL STUDENTS</option>
                                <option value="students-specific">SPECIFIC SECTION (YEAR/SEC)</option>
                                <option value="faculty">ALL FACULTY</option>
                              </select>
                            </div>

                            {msgTarget === 'students-specific' && (
                              <div className="admin-grid-span-2 animate-fade-in" style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--admin-border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div className="admin-form-group">
                                  <label className="admin-form-label">TARGET YEAR</label>
                                  <select className="admin-form-input" name="targetYear">
                                    {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
                                  </select>
                                </div>
                                <div className="admin-form-group">
                                  <label className="admin-form-label">TARGET SECTION</label>
                                  <input className="admin-form-input" name="targetSections" placeholder="e.g. A, B" />
                                </div>
                              </div>
                            )}

                            <div className="admin-form-group admin-grid-span-2">
                              <label className="admin-form-label">MESSAGE CONTENT</label>
                              <textarea className="admin-form-input" name="text" required rows="4" placeholder="Type your broadcast message here..." style={{ padding: '1.25rem' }}></textarea>
                            </div>
                          </div>
                        </div>
                        <div className="admin-modal-actions">
                          <button type="button" onClick={closeModal} className="admin-btn admin-btn-outline">CANCEL</button>
                          <button className="admin-btn admin-btn-primary">SEND BROADCAST</button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )
          );
        })()
      }


      <PersonalDetailsBall role="admin" data={{ name: 'System Administrator', role: 'Main Administrator' }} />

      {/* AI Assistant FAB */}
      <button
        className="ai-fab"
        onClick={toggleAiModal}
        title="AI Assistant"
      >
        <FaRobot />
        <span className="fab-label">System AI</span>
      </button>

      {showAiModal && (
        <div className="modal-overlay" onClick={() => setShowAiModal(false)}>
          <div className="admin-modal-content" style={{ height: '80vh', width: '90%', maxWidth: '1200px', display: 'flex', flexDirection: 'column', padding: 0, position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button className="nexus-modal-close" onClick={toggleAiModal}>
              &times;
            </button>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--admin-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0 }}>AI Assistant</h3>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <VuAiAgent onNavigate={(path) => {
                console.log('Navigating to:', path);
                setShowAiModal(false);
                setAiInitialPrompt('');
                // Map paths if necessary, e.g. '/students' -> setActiveSection('students')
                if (path.includes('student')) setActiveSection('students');
                if (path.includes('faculty')) setActiveSection('faculty');
                if (path.includes('exam')) setActiveSection('exams');
                if (path.includes('schedule')) setActiveSection('schedule');
              }} initialMessage={aiInitialPrompt} forcedRole="admin" />
            </div>
          </div>
        </div>
      )}
    </div >
  );
}
