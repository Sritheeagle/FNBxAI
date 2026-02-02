const mongoose = require('mongoose');
require('dotenv').config();

// Define Knowledge Base Schema directly for seeding
const KnowledgeBaseSchema = new mongoose.Schema({
    category: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    content: { type: String, required: true },
    tags: [String],
    role: { type: String, enum: ['student', 'faculty', 'admin', 'all'], default: 'all' },
    lastUpdated: { type: Date, default: Date.now },
    updatedBy: String
});

const KnowledgeBase = mongoose.model('KnowledgeBase', KnowledgeBaseSchema);

// Enhanced knowledge base data for better dashboard navigation and friendly responses
const enhancedKnowledgeData = [
    // Student-focused knowledge with enhanced navigation
    {
        category: 'Dashboard Navigation',
        subject: 'Student Dashboard',
        topic: 'Overview Section',
        content: 'The Overview section shows your academic progress, upcoming classes, study streak, and quick access to important features. Navigate there using {{NAVIGATE:overview}} or ask me "navigate to overview".',
        tags: ['overview', 'dashboard', 'navigation', 'student'],
        role: 'student',
        updatedBy: 'system'
    },
    {
        category: 'Dashboard Navigation',
        subject: 'Student Dashboard',
        topic: 'Academic Browser',
        content: 'Access all your study materials, lecture notes, and resources in the Academic Browser. Use {{NAVIGATE:semester}} or ask me "navigate to academic browser" to go there directly.',
        tags: ['academic', 'browser', 'materials', 'navigation'],
        role: 'student',
        updatedBy: 'system'
    },
    {
        category: 'Academic Support',
        subject: 'Attendance',
        topic: 'Checking Attendance',
        content: 'View your attendance statistics for each subject in the Attendance section. I can help you navigate there with {{NAVIGATE:attendance}} or just ask "show my attendance".',
        tags: ['attendance', 'classes', 'tracking'],
        role: 'student',
        updatedBy: 'system'
    },
    {
        category: 'Academic Support',
        subject: 'Exams',
        topic: 'Exam Preparation',
        content: 'Find your exam schedule, previous papers, and preparation materials in the Exams section. Use {{NAVIGATE:exams}} to access it directly. I can also help you create study plans!',
        tags: ['exams', 'preparation', 'schedule'],
        role: 'student',
        updatedBy: 'system'
    },
    {
        category: 'Academic Support',
        subject: 'Study Materials',
        topic: 'Accessing Resources',
        content: 'All your study materials are organized by subject and units in the Academic Browser. You can filter by subject, download notes, and watch video lectures. Navigate with {{NAVIGATE:semester}}.',
        tags: ['materials', 'resources', 'study'],
        role: 'student',
        updatedBy: 'system'
    },
    {
        category: 'Student Life',
        subject: 'Assignments',
        topic: 'Managing Tasks',
        content: 'Track your assignments and deadlines in the Tasks section. Use {{NAVIGATE:tasks}} to see all your upcoming assignments and their due dates.',
        tags: ['assignments', 'tasks', 'deadlines'],
        role: 'student',
        updatedBy: 'system'
    },
    {
        category: 'Student Life',
        subject: 'Placement',
        topic: 'Career Preparation',
        content: 'Access placement preparation materials, company information, and interview tips in the Placement section. Navigate with {{NAVIGATE:placement}} to start your career journey!',
        tags: ['placement', 'career', 'interview'],
        role: 'student',
        updatedBy: 'system'
    },
    
    // Faculty-focused knowledge with enhanced navigation
    {
        category: 'Dashboard Navigation',
        subject: 'Faculty Dashboard',
        topic: 'Overview Section',
        content: 'The Faculty Overview shows your class schedules, student statistics, and quick actions. Use {{NAVIGATE:overview}} or ask "navigate to overview" to access your faculty dashboard.',
        tags: ['overview', 'dashboard', 'faculty', 'navigation'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Teaching Tools',
        subject: 'Materials Management',
        topic: 'Uploading Study Materials',
        content: 'Upload and organize study materials for your classes in the Materials section. Use {{NAVIGATE:materials}} to manage your course content, videos, and documents.',
        tags: ['materials', 'upload', 'teaching'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Teaching Tools',
        subject: 'Attendance Management',
        topic: 'Marking Attendance',
        content: 'Mark and track student attendance for your classes in the Attendance section. Navigate with {{NAVIGATE:attendance}} to access your class rosters and attendance sheets.',
        tags: ['attendance', 'marking', 'classes'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Assessment',
        subject: 'Exam Management',
        topic: 'Creating Exams',
        content: 'Create and manage exams, set question papers, and publish results in the Exams section. Use {{NAVIGATE:exams}} to access your exam creation tools.',
        tags: ['exams', 'assessment', 'creation'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Student Communication',
        subject: 'Messages',
        topic: 'Announcements',
        content: 'Send announcements and messages to your students through the Messages section. Use {{NAVIGATE:messages}} or {{NAVIGATE:broadcast}} to communicate with your classes.',
        tags: ['messages', 'announcements', 'communication'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Analytics',
        subject: 'Performance',
        topic: 'Student Analytics',
        content: 'View student performance analytics and class statistics in the Analytics section. Navigate with {{NAVIGATE:analytics}} to track student progress and identify areas needing attention.',
        tags: ['analytics', 'performance', 'statistics'],
        role: 'faculty',
        updatedBy: 'system'
    },
    
    // Admin-focused knowledge with enhanced navigation
    {
        category: 'Dashboard Navigation',
        subject: 'Admin Dashboard',
        topic: 'System Overview',
        content: 'The Admin Overview provides system statistics, user counts, and quick access to management tools. Use {{NAVIGATE:overview}} to access your admin dashboard.',
        tags: ['overview', 'dashboard', 'admin', 'system'],
        role: 'admin',
        updatedBy: 'system'
    },
    {
        category: 'User Management',
        subject: 'Student Management',
        topic: 'Managing Students',
        content: 'Add, edit, and manage student accounts in the Students section. Use {{NAVIGATE:students}} to access student records, academic information, and account management.',
        tags: ['students', 'management', 'accounts'],
        role: 'admin',
        updatedBy: 'system'
    },
    {
        category: 'User Management',
        subject: 'Faculty Management',
        topic: 'Managing Faculty',
        content: 'Manage faculty accounts, assignments, and permissions in the Faculty section. Navigate with {{NAVIGATE:faculty}} to oversee your teaching staff.',
        tags: ['faculty', 'management', 'staff'],
        role: 'admin',
        updatedBy: 'system'
    },
    {
        category: 'Academic Management',
        subject: 'Course Management',
        topic: 'Curriculum Management',
        content: 'Create and manage courses, subjects, and curriculum in the Academic Hub. Use {{NAVIGATE:curriculum}} to define course structures and academic programs.',
        tags: ['courses', 'curriculum', 'academic'],
        role: 'admin',
        updatedBy: 'system'
    },
    {
        category: 'System Administration',
        subject: 'Knowledge Base',
        topic: 'AI Knowledge Management',
        content: 'Update the AI agent knowledge base to improve responses and add new information. Use the knowledge management tools or ask me to help you update the AI responses.',
        tags: ['knowledge', 'ai', 'updates'],
        role: 'admin',
        updatedBy: 'system'
    },
    
    // General navigation and help for all roles
    {
        category: 'Navigation Help',
        subject: 'General',
        topic: 'Quick Navigation Commands',
        content: 'You can quickly navigate to any section using commands like "navigate to [section]" or "go to [section]". Available sections: overview, attendance, exams, materials, tasks, placement, messages, analytics, students, faculty, curriculum, settings.',
        tags: ['navigation', 'commands', 'dashboard'],
        role: 'all',
        updatedBy: 'system'
    },
    {
        category: 'AI Assistant',
        subject: 'General',
        topic: 'Getting Help',
        content: 'I\'m your friendly AI assistant! I can help you navigate the dashboard, find information, answer questions about your studies/work, and provide guidance. Just ask me anything or use navigation commands to move around the system.',
        tags: ['help', 'assistant', 'support'],
        role: 'all',
        updatedBy: 'system'
    },
    {
        category: 'Features',
        subject: 'General',
        topic: 'Dashboard Features',
        content: 'The dashboard includes real-time updates, AI assistance, document analysis, academic tracking, and personalized recommendations. Explore different sections to discover all available features tailored to your role.',
        tags: ['features', 'dashboard', 'tools'],
        role: 'all',
        updatedBy: 'system'
    },
    {
        category: 'Troubleshooting',
        subject: 'General',
        topic: 'Common Issues',
        content: 'If you encounter issues, try refreshing the page, checking your internet connection, or asking me for help. For technical issues, contact support or use the {{NAVIGATE:support}} section.',
        tags: ['troubleshooting', 'support', 'issues'],
        role: 'all',
        updatedBy: 'system'
    }
];

// Seed the enhanced knowledge base
const seedEnhancedKnowledgeBase = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('Clearing existing knowledge base...');
        await KnowledgeBase.deleteMany({});
        
        console.log('Seeding enhanced knowledge base...');
        await KnowledgeBase.insertMany(enhancedKnowledgeData);
        
        console.log('Enhanced knowledge base seeded successfully!');
        console.log(`Added ${enhancedKnowledgeData.length} enhanced knowledge entries`);
        console.log('\nKnowledge base includes:');
        console.log('- Enhanced dashboard navigation with {{NAVIGATE:section}} commands');
        console.log('- Role-specific responses for students, faculty, and admin');
        console.log('- Friendly AI assistant guidance');
        console.log('- Comprehensive help and troubleshooting information');
        
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
        
    } catch (error) {
        console.error('Error seeding enhanced knowledge base:', error);
        process.exit(1);
    }
};

// Run the seeding function
seedEnhancedKnowledgeBase();
