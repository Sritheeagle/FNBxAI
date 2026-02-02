const express = require('express');
const router = express.Router();
const { getStudents, getOneStudent, getFaculty, getOneFaculty, deleteStudent, deleteFaculty, updateStudent, updateFaculty, getFacultyStudents, getTeachingFaculty } = require('../controllers/dataController');
const { registerStudent, registerFaculty } = require('../controllers/authController');
const { getMaterials, createMaterial, updateMaterial, deleteMaterial } = require('../controllers/materialController');
const { getExams, getFacultyExams, createExam, updateExam, deleteExam, getStudentExams, submitExam, getStudentResults, getExamAnalytics } = require('../controllers/examController');
const { getSchedules, createSchedule, updateSchedule, deleteSchedule } = require('../controllers/scheduleController');
const { getPlacements, createPlacement, updatePlacement, deletePlacement } = require('../controllers/placementController');
const sse = require('../sse');

// SSE Stream
router.get('/stream', sse.handler);

// Data
router.get('/students', getStudents);
router.get('/students/:id', getOneStudent); // Fetch single student
router.post('/students', registerStudent);
router.put('/students/:id', updateStudent);
router.delete('/students/:id', deleteStudent);

router.get('/faculty', getFaculty);
router.get('/faculty/:id', getOneFaculty); // Fetch single faculty
router.post('/faculty', registerFaculty);
router.put('/faculty/:id', updateFaculty);
router.delete('/faculty/:id', deleteFaculty);
router.get('/faculty-stats/:id/students', getFacultyStudents); // New Route for Faculty Dashboard
router.get('/faculty/teaching', getTeachingFaculty);

const upload = require('../middleware/upload');

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
router.put('/exams/:id', updateExam);
router.delete('/exams/:id', deleteExam);

// Schedule
router.get('/schedule', getSchedules);
router.post('/schedule', createSchedule);
router.put('/schedule/:id', updateSchedule);
router.delete('/schedule/:id', deleteSchedule);

const { getCourses, createCourse, updateCourse, deleteCourse } = require('../controllers/courseController');
const { getMessages, createMessage, getTodos, createTodo, updateTodo, deleteTodo } = require('../controllers/miscController');

// Courses (Subjects)
router.get('/courses', getCourses);
router.post('/courses', createCourse);
router.put('/courses/:id', updateCourse);
router.delete('/courses/:id', deleteCourse);

// Messages (Announcements)
router.get('/messages', getMessages);
router.post('/messages', createMessage);
router.post('/faculty/messages', createMessage); // Faculty specific broadcast

// Todos (Tasks)
router.get('/todos', getTodos);
router.post('/todos', createTodo);
router.put('/todos/:id', updateTodo);
router.delete('/todos/:id', deleteTodo);

// Placements
router.get('/placements', getPlacements);
router.post('/placements', createPlacement);
router.put('/placements/:id', updatePlacement);
router.delete('/placements/:id', deletePlacement);

const { getFees, updateStudentFee, getStudentFee } = require('../controllers/feeController');
const { markAttendance, getStudentAttendance, getBulkAttendance, addMark, getStudentMarks, getStudentOverview, bulkSaveMarks, getAllSubjectMarks, getMarksBySubject, getAdminMarksOverview, getClassAttendance } = require('../controllers/studentFeatureController');
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
router.get('/students/:id/attendance', getStudentAttendance);

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

module.exports = router;
