const express = require('express');
const router = express.Router();
const { getStudents, getOneStudent, deleteStudent, deleteFaculty, updateStudent, updateFaculty, getFacultyStudents, getFaculty, getOneFaculty, getTeachingFaculty } = require('../controllers/dataController');
const { registerStudent, registerFaculty } = require('../controllers/authController');
const { getMaterials, createMaterial, updateMaterial, deleteMaterial } = require('../controllers/materialController');
const { getExams, getFacultyExams, createExam, updateExam, deleteExam, getStudentExams, submitExam, getStudentResults, getExamAnalytics, monitorExam } = require('../controllers/examController');
const { getSchedules, getLabsSchedule, createSchedule, updateSchedule, deleteSchedule } = require('../controllers/scheduleController');
const { getPlacements, createPlacement, updatePlacement, deletePlacement } = require('../controllers/placementController');
const { getRoadmaps, getOneRoadmap, updateProgress, createRoadmap } = require('../controllers/roadmapController');
const { getSystemStats, getSystemIntelligence } = require('../controllers/systemController');
// const { debugFacultyMatching, getFacultyForStudent } = require('../controllers/facultyDebugController');
const sse = require('../sse');
const upload = require('../middleware/upload');

// SSE Stream
router.get('/stream', sse.handler);

// Data
router.get('/students', getStudents);
router.get('/students/:id', getOneStudent); // Fetch single student
router.post('/students', registerStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

router.get('/faculty/teaching', getTeachingFaculty);
router.get('/faculty', getFaculty);
router.get('/faculty/:id', getOneFaculty); // Fetch single faculty
router.post('/faculty', upload.single('file'), registerFaculty);
router.put('/faculty/:id', upload.single('file'), updateFaculty);
router.delete('/faculty/:id', deleteFaculty);
router.get('/faculty-stats/:id/students', getFacultyStudents); // New Route for Faculty Dashboard

// Debug routes for faculty-student matching (temporarily disabled)
// router.get('/debug/faculty-matching', debugFacultyMatching);
// router.get('/students/:studentId/faculty', getFacultyForStudent);

// Materials
router.get('/materials', getMaterials);
router.post('/materials', upload.single('file'), createMaterial);
router.put('/materials/:id', upload.single('file'), updateMaterial);
router.delete('/materials/:id', deleteMaterial);

// Exams
router.get('/exams/all', getExams);
router.get('/exams/student', getStudentExams);
router.get('/exams/analytics', getExamAnalytics);
router.get('/exams/results/student/:sid', getStudentResults);
router.get('/exams/faculty/:facultyId', getFacultyExams);
router.post('/exams/create', createExam);
router.post('/exams/submit', submitExam);
router.post('/exams/monitor', monitorExam); // Sentinel Monitor
router.put('/exams/:id', updateExam);
router.delete('/exams/:id', deleteExam);

// Schedule
router.get('/schedule', getSchedules);
router.get('/labs/schedule', getLabsSchedule);
router.post('/schedule', createSchedule);
router.put('/schedule/:id', updateSchedule);
router.delete('/schedule/:id', deleteSchedule);

const { getCourses, createCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { getMessages, createMessage, getTodos, createTodo, updateTodo, deleteTodo, sendTransmission } = require('../controllers/miscController');

// Courses (Subjects)
router.get('/courses', getCourses);
router.get('/students/:id/courses', require('../controllers/courseController').getStudentCourses); // ADDED THIS
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Messages (Announcements)
router.get('/messages', getMessages);
router.post('/messages', createMessage);
router.post('/faculty/messages', createMessage); // Faculty specific broadcast
router.post('/transmission', sendTransmission); // High-Priority Transmissions

// Todos (Tasks)
router.get('/todos', getTodos);
router.post('/todos', createTodo);
router.put('/todos/:id', updateTodo);
router.delete('/todos/:id', deleteTodo);

// Teaching Assignments (Faculty -> Student)
const { createAssignment, getFacultyAssignments, deleteAssignment, getStudentAssignments } = require('../controllers/assignmentController');
router.post('/teaching-assignments', createAssignment);
router.get('/teaching-assignments/faculty/:id', getFacultyAssignments);
router.delete('/teaching-assignments/:id', deleteAssignment);
router.get('/teaching-assignments/student', getStudentAssignments);

// Curriculum (Syllabus Management)
const { getCurriculum, updateCurriculum } = require('../controllers/curriculumController');
router.get('/curriculum', getCurriculum);
router.post('/curriculum', updateCurriculum);

// Placements
router.get('/placements', getPlacements);
router.post('/placements', createPlacement);
router.put('/placements/:id', updatePlacement);
router.delete('/placements/:id', deletePlacement);

// Roadmaps
router.get('/roadmaps', getRoadmaps);
router.get('/roadmaps/:slug', getOneRoadmap);
router.post('/roadmaps', createRoadmap);
router.post('/students/:studentId/roadmap-progress', updateProgress);

const { getFees, updateStudentFee, getStudentFee } = require('../controllers/feeController');
const { markAttendance, getStudentAttendance, getBulkAttendance, addMark, getStudentMarks, getStudentOverview, bulkSaveMarks, getAllSubjectMarks, getMarksBySubject, getAdminMarksOverview, getClassAttendance, getAbsenteesForDate, getDailyAttendanceReport, getStudentDailyAttendance, createSessionOTP, verifySessionOTP, batchUpdateAttendance } = require('../controllers/studentFeatureController');
const { handleChat, getChatHistoryHandler, updateKnowledgeBase, getKnowledgeBase, reloadAgentKnowledge } = require('../controllers/aiAgentController');

// Fees
router.get('/fees', getFees);
router.get('/fees/:id', getStudentFee);
router.put('/fees/:id', updateStudentFee);

// Student Features (Attendance / Marks)
router.get('/students/:id/overview', getStudentOverview);
router.get('/attendance/all', getBulkAttendance); // New Route for Faculty Dashboard
router.get('/admin/class-attendance/:year/:section/:branch', getClassAttendance); // Admin Class Report
router.post('/attendance', markAttendance);
router.post('/attendance/otp/create', createSessionOTP); // OTP Generation
router.post('/attendance/otp/verify', verifySessionOTP); // OTP Verification
router.get('/students/:id/attendance', getStudentAttendance);
router.get('/attendance/absentees/today', getAbsenteesForDate); // ABSENTEE PREVIEW
router.get('/attendance/daily-report', getDailyAttendanceReport); // NEW: Daily Master Log
router.get('/students/:id/daily-attendance', getStudentDailyAttendance); // Student Daily View
router.post('/admin/batch-attendance', batchUpdateAttendance); // Admin Batch Update

router.post('/marks', addMark);
router.post('/marks/bulk-save', bulkSaveMarks); // Bulk Save
router.get('/marks/:subject/all', getAllSubjectMarks); // Fetch All for Subject
router.get('/admin/marks/overview', getAdminMarksOverview); // New Admin Overview
router.get('/students/:id/marks', getStudentMarks);
router.get('/students/:id/marks-by-subject', getMarksBySubject);

// AI Agent Routes
router.post('/chat', handleChat);
router.get('/chat/history', getChatHistoryHandler);
router.post('/knowledge/update', updateKnowledgeBase);
router.get('/knowledge', getKnowledgeBase);
router.post('/agent/reload', reloadAgentKnowledge);

// System
router.get('/system/stats', getSystemStats);
router.get('/system/intelligence', getSystemIntelligence);

module.exports = router;
