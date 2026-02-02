const mongoose = require('mongoose');
require('dotenv').config();

// Define Knowledge Base Schema
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

// Comprehensive knowledge base data for ALL dashboard sections
const comprehensiveKnowledgeData = [
    // STUDENT DASHBOARD - Complete Coverage
    {
        category: 'Student Dashboard',
        subject: 'Overview',
        topic: 'Academic Progress',
        content: 'View your academic progress, CGPA, semester completion percentage, and study streak in the Overview section. Navigate with {{NAVIGATE:overview}} to see your comprehensive academic dashboard with real-time updates.',
        tags: ['overview', 'progress', 'cgpa', 'academic'],
        role: 'student',
        updatedBy: 'system'
    },
    {
        category: 'Student Dashboard',
        subject: 'Overview',
        topic: 'Next Class Information',
        content: 'See your upcoming class schedule, timing, and faculty information in the Overview section. The dashboard shows your next class with countdown timer and room details. Use {{NAVIGATE:overview}} to check your schedule.',
        tags: ['overview', 'schedule', 'classes', 'timing'],
        role: 'student',
        updatedBy: 'system'
    },
    {
        category: 'Student Dashboard',
        subject: 'Academic Browser',
        topic: 'Study Materials Access',
        content: 'Access all your study materials, lecture notes, video lectures, and reference materials in the Academic Browser. Materials are organized by subject, units, and include downloadable content. Navigate with {{NAVIGATE:semester}}.',
        tags: ['academic', 'browser', 'materials', 'notes'],
        role: 'student',
        updatedBy: 'system'
    },
    {
        category: 'Student Dashboard',
        subject: 'Academic Browser',
        topic: 'Subject Navigation',
        content: 'Browse subjects by semester and access unit-wise materials in the Academic Browser. Each subject includes modules, lecture notes, and video resources. Use {{NAVIGATE:semester}} to explore your subjects.',
        tags: ['academic', 'browser', 'subjects', 'modules'],
        role: 'student',
        updatedBy: 'system'
    },
    {
        category: 'Student Dashboard',
        subject: 'Attendance',
        topic: 'Attendance Tracking',
        content: 'View your detailed attendance statistics for each subject with percentage breakdowns and class-wise attendance. The Attendance section shows overall attendance trends and alerts for low attendance. Navigate with {{NAVIGATE:attendance}}.',
        tags: ['attendance', 'tracking', 'statistics', 'classes'],
        role: 'student',
        updatedBy: 'system'
    },
    {
        category: 'Student Dashboard',
        subject: 'Attendance',
        topic: 'Attendance Reports',
        content: 'Generate attendance reports and view monthly attendance patterns in the Attendance section. Track your attendance history and identify areas needing improvement. Use {{NAVIGATE:attendance}} for detailed reports.',
        tags: ['attendance', 'reports', 'monthly', 'history'],
        role: 'student',
        updatedBy: 'system'
    },
    {
        category: 'Student Dashboard',
        subject: 'Exams',
        topic: 'Exam Schedule',
        content: 'View your upcoming exam schedule with dates, subjects, and preparation guidelines in the Exams section. Access previous question papers and exam patterns. Navigate with {{NAVIGATE:exams}} to plan your exam preparation.',
        tags: ['exams', 'schedule', 'dates', 'preparation'],
        role: 'student',
        updatedBy: 'system'
    },
    {
        category: 'Student Dashboard',
        subject: 'Exams',
        topic: 'Exam Results',
        content: 'Check your exam results, grades, and performance analysis in the Exams section. View subject-wise scores and overall performance trends. Use {{NAVIGATE:exams}} to access your results.',
        tags: ['exams', 'results', 'grades', 'performance'],
        role: 'student',
        updatedBy: 'system'
    },
    {
        category: 'Student Dashboard',
        subject: 'Tasks',
        topic: 'Assignment Management',
        content: 'Track all your assignments, projects, and deadlines in the Tasks section. View upcoming deadlines, submission status, and assignment details. Navigate with {{NAVIGATE:tasks}} to manage your assignments.',
        tags: ['tasks', 'assignments', 'deadlines', 'projects'],
        role: 'student',
        updatedBy: 'system'
    },
    {
        category: 'Student Dashboard',
        subject: 'Tasks',
        topic: 'Todo List',
        content: 'Manage your personal todo list and study tasks in the Tasks section. Create, update, and track your daily study goals and activities. Use {{NAVIGATE:tasks}} to organize your study schedule.',
        tags: ['tasks', 'todo', 'study', 'schedule'],
        role: 'student',
        updatedBy: 'system'
    },
    {
        category: 'Student Dashboard',
        subject: 'Placement',
        topic: 'Career Preparation',
        content: 'Access placement preparation materials, company information, interview tips, and aptitude tests in the Placement section. Prepare for campus placements and career opportunities. Navigate with {{NAVIGATE:placement}}.',
        tags: ['placement', 'career', 'interview', 'aptitude'],
        role: 'student',
        updatedBy: 'system'
    },
    {
        category: 'Student Dashboard',
        subject: 'Placement',
        topic: 'Company Information',
        content: 'Research companies, job profiles, and placement statistics in the Placement section. Access company-specific preparation materials and placement trends. Use {{NAVIGATE:placement}} for career planning.',
        tags: ['placement', 'companies', 'jobs', 'statistics'],
        role: 'student',
        updatedBy: 'system'
    },
    {
        category: 'Student Dashboard',
        subject: 'Settings',
        topic: 'Profile Management',
        content: 'Update your personal profile, academic information, and preferences in the Settings section. Manage your account settings and notification preferences. Navigate with {{NAVIGATE:settings}}.',
        tags: ['settings', 'profile', 'account', 'preferences'],
        role: 'student',
        updatedBy: 'system'
    },
    {
        category: 'Student Dashboard',
        subject: 'Support',
        topic: 'Help and Support',
        content: 'Get help, FAQs, and technical support in the Support section. Access user guides and contact support for assistance. Use {{NAVIGATE:support}} for help resources.',
        tags: ['support', 'help', 'faq', 'technical'],
        role: 'student',
        updatedBy: 'system'
    },

    // FACULTY DASHBOARD - Complete Coverage
    {
        category: 'Faculty Dashboard',
        subject: 'Overview',
        topic: 'Class Schedule',
        content: 'View your teaching schedule, class timings, and faculty dashboard in the Overview section. See upcoming classes, student statistics, and quick actions. Navigate with {{NAVIGATE:overview}}.',
        tags: ['overview', 'schedule', 'classes', 'faculty'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Faculty Dashboard',
        subject: 'Overview',
        topic: 'Student Statistics',
        content: 'Monitor student enrollment, attendance trends, and performance statistics in the Overview section. Track class-wise student data and academic metrics. Use {{NAVIGATE:overview}} for analytics.',
        tags: ['overview', 'statistics', 'students', 'analytics'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Faculty Dashboard',
        subject: 'Materials',
        topic: 'Material Upload',
        content: 'Upload study materials, lecture notes, videos, and reference documents for your classes in the Materials section. Organize content by subject and units. Navigate with {{NAVIGATE:materials}}.',
        tags: ['materials', 'upload', 'content', 'resources'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Faculty Dashboard',
        subject: 'Materials',
        topic: 'Material Management',
        content: 'Manage, organize, and update your teaching materials in the Materials section. Edit existing content and track material usage. Use {{NAVIGATE:materials}} for content management.',
        tags: ['materials', 'management', 'organization', 'content'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Faculty Dashboard',
        subject: 'Attendance',
        topic: 'Attendance Marking',
        content: 'Mark daily attendance for your classes and track student attendance patterns in the Attendance section. Generate attendance reports and identify absentees. Navigate with {{NAVIGATE:attendance}}.',
        tags: ['attendance', 'marking', 'daily', 'reports'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Faculty Dashboard',
        subject: 'Attendance',
        topic: 'Attendance Analytics',
        content: 'Analyze attendance trends, class-wise statistics, and student attendance patterns in the Attendance section. Generate monthly and semester reports. Use {{NAVIGATE:attendance}} for insights.',
        tags: ['attendance', 'analytics', 'trends', 'statistics'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Faculty Dashboard',
        subject: 'Exams',
        topic: 'Exam Creation',
        content: 'Create exams, set question papers, define exam schedules, and manage exam logistics in the Exams section. Configure exam patterns and grading criteria. Navigate with {{NAVIGATE:exams}}.',
        tags: ['exams', 'creation', 'papers', 'schedule'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Faculty Dashboard',
        subject: 'Exams',
        topic: 'Exam Evaluation',
        content: 'Evaluate exam papers, assign grades, and publish results in the Exams section. Manage grading workflows and result processing. Use {{NAVIGATE:exams}} for evaluation tools.',
        tags: ['exams', 'evaluation', 'grading', 'results'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Faculty Dashboard',
        subject: 'Assignments',
        topic: 'Assignment Creation',
        content: 'Create assignments, set deadlines, and define submission guidelines in the Assignments section. Upload assignment materials and track submissions. Navigate with {{NAVIGATE:assignments}}.',
        tags: ['assignments', 'creation', 'deadlines', 'submissions'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Faculty Dashboard',
        subject: 'Assignments',
        topic: 'Assignment Evaluation',
        content: 'Evaluate student assignments, provide feedback, and assign grades in the Assignments section. Track submission status and grading progress. Use {{NAVIGATE:assignments}} for evaluation.',
        tags: ['assignments', 'evaluation', 'feedback', 'grading'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Faculty Dashboard',
        subject: 'Marks',
        topic: 'Grade Management',
        content: 'Manage student grades, internal marks, and assessment scores in the Marks section. Calculate subject-wise grades and generate grade reports. Navigate with {{NAVIGATE:marks}}.',
        tags: ['marks', 'grades', 'assessment', 'reports'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Faculty Dashboard',
        subject: 'Marks',
        topic: 'Performance Analysis',
        content: 'Analyze student performance, class-wise results, and subject-wise performance trends in the Marks section. Generate performance reports and insights. Use {{NAVIGATE:marks}} for analysis.',
        tags: ['marks', 'performance', 'analysis', 'trends'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Faculty Dashboard',
        subject: 'Analytics',
        topic: 'Student Performance',
        content: 'View comprehensive student performance analytics, learning patterns, and progress tracking in the Analytics section. Monitor individual and class performance. Navigate with {{NAVIGATE:analytics}}.',
        tags: ['analytics', 'performance', 'students', 'progress'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Faculty Dashboard',
        subject: 'Analytics',
        topic: 'Teaching Insights',
        content: 'Get teaching insights, engagement metrics, and class participation analytics in the Analytics section. Improve teaching strategies based on data. Use {{NAVIGATE:analytics}} for insights.',
        tags: ['analytics', 'teaching', 'engagement', 'metrics'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Faculty Dashboard',
        subject: 'Messages',
        topic: 'Student Communication',
        content: 'Communicate with students through announcements, messages, and notifications in the Messages section. Send class-wide updates and individual messages. Navigate with {{NAVIGATE:messages}}.',
        tags: ['messages', 'communication', 'announcements', 'students'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Faculty Dashboard',
        subject: 'Broadcast',
        topic: 'Class Announcements',
        content: 'Send broadcast announcements to your classes and student groups in the Broadcast section. Schedule announcements and track delivery. Navigate with {{NAVIGATE:broadcast}}.',
        tags: ['broadcast', 'announcements', 'classes', 'schedule'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Faculty Dashboard',
        subject: 'Schedule',
        topic: 'Timetable Management',
        content: 'View and manage your teaching timetable, class schedules, and faculty availability in the Schedule section. Coordinate class timings and room allocations. Navigate with {{NAVIGATE:schedule}}.',
        tags: ['schedule', 'timetable', 'classes', 'management'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Faculty Dashboard',
        subject: 'Curriculum',
        topic: 'Course Management',
        content: 'Manage course curriculum, syllabus, and learning objectives in the Curriculum section. Update course content and learning outcomes. Navigate with {{NAVIGATE:curriculum}}.',
        tags: ['curriculum', 'course', 'syllabus', 'objectives'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Faculty Dashboard',
        subject: 'Students',
        topic: 'Student Information',
        content: 'Access student profiles, academic records, and performance data in the Students section. View student information and track progress. Navigate with {{NAVIGATE:students}}.',
        tags: ['students', 'profiles', 'records', 'information'],
        role: 'faculty',
        updatedBy: 'system'
    },
    {
        category: 'Faculty Dashboard',
        subject: 'Settings',
        topic: 'Faculty Profile',
        content: 'Update your faculty profile, teaching assignments, and professional information in the Settings section. Manage your account and preferences. Navigate with {{NAVIGATE:settings}}.',
        tags: ['settings', 'profile', 'faculty', 'assignments'],
        role: 'faculty',
        updatedBy: 'system'
    },

    // ADMIN DASHBOARD - Complete Coverage
    {
        category: 'Admin Dashboard',
        subject: 'Overview',
        topic: 'System Statistics',
        content: 'View comprehensive system statistics, user counts, and institutional metrics in the Overview section. Monitor student enrollment, faculty strength, and system usage. Navigate with {{NAVIGATE:overview}}.',
        tags: ['overview', 'statistics', 'system', 'metrics'],
        role: 'admin',
        updatedBy: 'system'
    },
    {
        category: 'Admin Dashboard',
        subject: 'Overview',
        topic: 'Institutional Dashboard',
        content: 'Access institutional performance indicators, academic metrics, and administrative insights in the Overview section. Get a complete overview of the institution. Use {{NAVIGATE:overview}}.',
        tags: ['overview', 'institutional', 'performance', 'dashboard'],
        role: 'admin',
        updatedBy: 'system'
    },
    {
        category: 'Admin Dashboard',
        subject: 'Students',
        topic: 'Student Management',
        content: 'Manage student admissions, registrations, academic records, and profile information in the Students section. Add, edit, and deactivate student accounts. Navigate with {{NAVIGATE:students}}.',
        tags: ['students', 'management', 'admissions', 'records'],
        role: 'admin',
        updatedBy: 'system'
    },
    {
        category: 'Admin Dashboard',
        subject: 'Students',
        topic: 'Bulk Operations',
        content: 'Perform bulk student operations, data imports, and batch updates in the Students section. Manage large-scale student data efficiently. Use {{NAVIGATE:students}} for bulk operations.',
        tags: ['students', 'bulk', 'operations', 'imports'],
        role: 'admin',
        updatedBy: 'system'
    },
    {
        category: 'Admin Dashboard',
        subject: 'Faculty',
        topic: 'Faculty Management',
        content: 'Manage faculty recruitment, assignments, qualifications, and professional development in the Faculty section. Handle faculty accounts and roles. Navigate with {{NAVIGATE:faculty}}.',
        tags: ['faculty', 'management', 'recruitment', 'assignments'],
        role: 'admin',
        updatedBy: 'system'
    },
    {
        category: 'Admin Dashboard',
        subject: 'Faculty',
        topic: 'Faculty Workload',
        content: 'Monitor faculty workload, teaching assignments, and performance metrics in the Faculty section. Optimize faculty resource allocation. Use {{NAVIGATE:faculty}} for workload management.',
        tags: ['faculty', 'workload', 'assignments', 'performance'],
        role: 'admin',
        updatedBy: 'system'
    },
    {
        category: 'Admin Dashboard',
        subject: 'Courses',
        topic: 'Course Management',
        content: 'Create and manage academic courses, subjects, and curriculum structures in the Courses section. Define course codes, credits, and prerequisites. Navigate with {{NAVIGATE:courses}}.',
        tags: ['courses', 'management', 'curriculum', 'subjects'],
        role: 'admin',
        updatedBy: 'system'
    },
    {
        category: 'Admin Dashboard',
        subject: 'Courses',
        topic: 'Course Registration',
        content: 'Manage student course registrations, add/drop periods, and academic planning in the Courses section. Handle registration workflows. Use {{NAVIGATE:courses}} for registration.',
        tags: ['courses', 'registration', 'planning', 'workflows'],
        role: 'admin',
        updatedBy: 'system'
    },
    {
        category: 'Admin Dashboard',
        subject: 'Materials',
        topic: 'Content Management',
        content: 'Oversee all teaching materials, content approval, and resource management in the Materials section. Monitor material quality and usage. Navigate with {{NAVIGATE:materials}}.',
        tags: ['materials', 'content', 'approval', 'resources'],
        role: 'admin',
        updatedBy: 'system'
    },
    {
        category: 'Admin Dashboard',
        subject: 'Messages',
        topic: 'Institutional Communications',
        content: 'Manage institutional announcements, notifications, and mass communications in the Messages section. Send system-wide messages. Navigate with {{NAVIGATE:messages}}.',
        tags: ['messages', 'communications', 'announcements', 'notifications'],
        role: 'admin',
        updatedBy: 'system'
    },
    {
        category: 'Admin Dashboard',
        subject: 'Todos',
        topic: 'Administrative Tasks',
        content: 'Track administrative tasks, compliance requirements, and institutional deadlines in the Todos section. Manage admin workflows. Navigate with {{NAVIGATE:todos}}.',
        tags: ['todos', 'administrative', 'tasks', 'compliance'],
        role: 'admin',
        updatedBy: 'system'
    },
    {
        category: 'Admin Dashboard',
        subject: 'Fees',
        topic: 'Fee Management',
        content: 'Manage student fee structures, payment processing, and financial records in the Fees section. Handle fee collections and reports. Navigate with {{NAVIGATE:fees}}.',
        tags: ['fees', 'financial', 'payments', 'management'],
        role: 'admin',
        updatedBy: 'system'
    },
    {
        category: 'Admin Dashboard',
        subject: 'Academic Hub',
        topic: 'Curriculum Architecture',
        content: 'Design and manage institutional curriculum, academic programs, and learning pathways in the Academic Hub. Create program structures. Navigate with {{NAVIGATE:academic}}.',
        tags: ['academic', 'curriculum', 'programs', 'architecture'],
        role: 'admin',
        updatedBy: 'system'
    },
    {
        category: 'Admin Dashboard',
        subject: 'Knowledge Base',
        topic: 'AI Knowledge Management',
        content: 'Update and manage the AI agent knowledge base, response templates, and intelligent automation in the Knowledge Base section. Improve AI responses. Navigate with {{NAVIGATE:knowledge}}.',
        tags: ['knowledge', 'ai', 'automation', 'responses'],
        role: 'admin',
        updatedBy: 'system'
    },
    {
        category: 'Admin Dashboard',
        subject: 'Settings',
        topic: 'System Configuration',
        content: 'Configure system settings, user permissions, and institutional parameters in the Settings section. Manage system preferences. Navigate with {{NAVIGATE:settings}}.',
        tags: ['settings', 'configuration', 'permissions', 'system'],
        role: 'admin',
        updatedBy: 'system'
    },

    // GENERAL KNOWLEDGE - All Roles
    {
        category: 'Navigation',
        subject: 'General',
        topic: 'Complete Dashboard Guide',
        content: 'I can help you navigate to any dashboard section! Use commands like "navigate to [section]" or ask me about specific features. Available sections: overview, semester, attendance, exams, tasks, placement, materials, assignments, marks, analytics, messages, broadcast, schedule, curriculum, students, faculty, courses, fees, settings, support.',
        tags: ['navigation', 'guide', 'sections', 'commands'],
        role: 'all',
        updatedBy: 'system'
    },
    {
        category: 'AI Assistant',
        subject: 'General',
        topic: 'Comprehensive Help',
        content: 'I\'m your friendly AI assistant for all dashboard needs! I can help students with academics, faculty with teaching, and admin with system management. Ask me anything about navigation, features, or use "navigate to [section]" for quick access.',
        tags: ['assistant', 'help', 'comprehensive', 'support'],
        role: 'all',
        updatedBy: 'system'
    },
    {
        category: 'Features',
        subject: 'General',
        topic: 'All Dashboard Features',
        content: 'The system includes comprehensive features: Academic tracking, material management, attendance systems, exam management, assignment handling, performance analytics, communication tools, and administrative functions. Each role has specialized features tailored to their needs.',
        tags: ['features', 'comprehensive', 'dashboard', 'tools'],
        role: 'all',
        updatedBy: 'system'
    }
];

// Update the knowledge base with comprehensive data
const updateComprehensiveKnowledge = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('🗑️ Clearing existing knowledge base...');
        await KnowledgeBase.deleteMany({});
        
        console.log('📚 Adding comprehensive knowledge base entries...');
        await KnowledgeBase.insertMany(comprehensiveKnowledgeData);
        
        console.log('✅ Comprehensive knowledge base updated successfully!');
        console.log(`📊 Added ${comprehensiveKnowledgeData.length} knowledge entries`);
        
        console.log('\n📋 Knowledge Base Summary:');
        console.log(`👨‍🎓 Student Dashboard: ${comprehensiveKnowledgeData.filter(e => e.role === 'student').length} entries`);
        console.log(`👨‍🏫 Faculty Dashboard: ${comprehensiveKnowledgeData.filter(e => e.role === 'faculty').length} entries`);
        console.log(`👨‍💼 Admin Dashboard: ${comprehensiveKnowledgeData.filter(e => e.role === 'admin').length} entries`);
        console.log(`🌐 General/All Roles: ${comprehensiveKnowledgeData.filter(e => e.role === 'all').length} entries`);
        
        console.log('\n🎯 Covered Dashboard Sections:');
        const sections = [...new Set(comprehensiveKnowledgeData.map(e => e.subject))];
        sections.forEach(section => {
            console.log(`   ✓ ${section}`);
        });
        
        console.log('\n🚀 AI Agent now provides comprehensive responses for ALL dashboard sections!');
        
        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');
        
    } catch (error) {
        console.error('❌ Error updating comprehensive knowledge base:', error);
        process.exit(1);
    }
};

// Run the update
updateComprehensiveKnowledge();
