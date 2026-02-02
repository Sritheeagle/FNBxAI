const express = require('express');
const router = express.Router();

// Import all specialized AI controllers
const {
    handleStudentAI,
    getStudentChatHistory,
    updateStudentKnowledge,
    getStudentKnowledge,
    getProgrammingHelp,
    getAcademicHelp
} = require('../controllers/studentAIController');

const {
    handleFacultyAI,
    getFacultyChatHistory,
    aiMarkAttendance,
    generateExamPaper,
    updateFacultyKnowledge,
    getFacultyKnowledge
} = require('../controllers/facultyAIController');

const {
    handleAdminAI,
    getAdminChatHistory,
    aiManageStudent,
    aiManageFaculty,
    aiManageFees,
    optimizeDatabase,
    updateAdminKnowledge,
    getAdminKnowledge
} = require('../controllers/adminAIController');

// ==================== STUDENT AI ROUTES ====================

// Student AI Chat
router.post('/student/chat', handleStudentAI);
router.get('/student/chat/history', getStudentChatHistory);

// Student Knowledge Base
router.post('/student/knowledge/update', updateStudentKnowledge);
router.get('/student/knowledge', getStudentKnowledge);

// Student Specialized Help
router.get('/student/help/programming', getProgrammingHelp);
router.get('/student/help/academic', getAcademicHelp);

// ==================== FACULTY AI ROUTES ====================

// Faculty AI Chat
router.post('/faculty/chat', handleFacultyAI);
router.get('/faculty/chat/history', getFacultyChatHistory);

// Faculty Specialized Operations
router.post('/faculty/attendance/ai-mark', aiMarkAttendance);
router.post('/faculty/exam/generate', generateExamPaper);

// Faculty Knowledge Base
router.post('/faculty/knowledge/update', updateFacultyKnowledge);
router.get('/faculty/knowledge', getFacultyKnowledge);

// ==================== ADMIN AI ROUTES ====================

// Admin AI Chat
router.post('/admin/chat', handleAdminAI);
router.get('/admin/chat/history', getAdminChatHistory);

// Admin Specialized Operations
router.post('/admin/student/manage', aiManageStudent);
router.post('/admin/faculty/manage', aiManageFaculty);
router.post('/admin/fees/manage', aiManageFees);
router.post('/admin/database/optimize', optimizeDatabase);

// Admin Knowledge Base
router.post('/admin/knowledge/update', updateAdminKnowledge);
router.get('/admin/knowledge', getAdminKnowledge);

// ==================== AI STATUS AND HEALTH ====================

// AI System Status
router.get('/status', (req, res) => {
    res.json({
        status: 'active',
        agents: {
            student: 'operational',
            faculty: 'operational',
            admin: 'operational'
        },
        features: {
            llm_integration: 'active',
            knowledge_base: 'populated',
            specialized_responses: 'enabled'
        },
        timestamp: new Date()
    });
});

// AI Capabilities Overview
router.get('/capabilities', (req, res) => {
    res.json({
        student_agent: {
            description: 'AI tutor for academic and programming help',
            features: [
                'Subject explanations and doubt clearing',
                'Programming language assistance',
                'Code examples and tutorials',
                'Study material recommendations',
                'Personalized learning paths'
            ],
            supported_languages: ['Python', 'JavaScript', 'Java', 'C++'],
            supported_subjects: ['Mathematics', 'Physics', 'Chemistry', 'Computer Science']
        },
        faculty_agent: {
            description: 'AI assistant for teaching and administrative tasks',
            features: [
                'AI-powered attendance marking',
                'Automated exam paper generation',
                'Material creation assistance',
                'Student analytics insights',
                'Teaching optimization tips'
            ],
            exam_types: ['Multiple Choice', 'Descriptive', 'Practical'],
            material_types: ['Lecture Notes', 'Video Content', 'Model Papers']
        },
        admin_agent: {
            description: 'AI assistant for institutional management',
            features: [
                'Student admission and management',
                'Faculty recruitment and workload optimization',
                'Fee collection and optimization',
                'Database management and optimization',
                'Administrative automation'
            ],
            modules: ['Student Management', 'Faculty Management', 'Fee Management', 'Database Management']
        }
    });
});

module.exports = router;
