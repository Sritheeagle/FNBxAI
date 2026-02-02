const mongoose = require('mongoose');
require('dotenv').config();

// Import Centralized AI Models
const { StudentKnowledge, FacultyKnowledge, AdminKnowledge } = require('./models/AIModels');

// Student AI Knowledge Base Data
const studentKnowledgeData = [
    // Programming Languages
    {
        category: 'Programming Languages',
        subject: 'Python',
        topic: 'Getting Started with Python',
        content: 'Python is a high-level, interpreted programming language known for its simplicity and readability. It\'s widely used in web development, data science, AI, and automation. Python uses indentation to define code blocks and has dynamic typing.',
        codeExamples: [
            'print("Hello, World!")',
            'x = 5\ny = 10\nprint(f"Sum: {x + y}")',
            'def greet(name):\n    return f"Hello, {name}!"',
            'numbers = [1, 2, 3, 4, 5]\nsquares = [x**2 for x in numbers]'
        ],
        explanations: [
            'Python is interpreted, meaning code is executed line by line',
            'Dynamic typing means you don\'t need to declare variable types',
            'Indentation is used to define code blocks instead of curly braces',
            'Python has extensive built-in libraries and third-party packages'
        ],
        tags: ['python', 'programming', 'basics', 'beginner'],
        difficulty: 'beginner',
        updatedBy: 'system'
    },
    {
        category: 'Programming Languages',
        subject: 'JavaScript',
        topic: 'JavaScript Fundamentals',
        content: 'JavaScript is a versatile programming language primarily used for web development. It runs in browsers and can also be used server-side with Node.js. JavaScript uses curly braces for code blocks and supports multiple programming paradigms.',
        codeExamples: [
            'console.log("Hello, World!");',
            'const x = 5;\nconst y = 10;\nconsole.log(`Sum: ${x + y}`);',
            'function greet(name) {\n    return `Hello, ${name}!`;\n}',
            'const numbers = [1, 2, 3, 4, 5];\nconst squares = numbers.map(x => x * x);'
        ],
        explanations: [
            'JavaScript is dynamically typed like Python',
            'It supports both functional and object-oriented programming',
            'Modern JavaScript (ES6+) includes many new features',
            'Node.js allows JavaScript to run on the server'
        ],
        tags: ['javascript', 'web', 'programming', 'beginner'],
        difficulty: 'beginner',
        updatedBy: 'system'
    },
    {
        category: 'Programming Languages',
        subject: 'Java',
        topic: 'Java Programming Basics',
        content: 'Java is a robust, object-oriented programming language known for its platform independence. It\'s widely used in enterprise applications, Android development, and big data systems. Java is strongly typed and compiled.',
        codeExamples: [
            'public class Hello {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
            'int x = 5;\nint y = 10;\nSystem.out.println("Sum: " + (x + y));',
            'public class Calculator {\n    public int add(int a, int b) {\n        return a + b;\n    }\n}'
        ],
        explanations: [
            'Java code is compiled to bytecode that runs on JVM',
            'Everything in Java is part of a class',
            'Java is strongly typed and requires explicit type declarations',
            'Java has automatic garbage collection'
        ],
        tags: ['java', 'programming', 'object-oriented', 'intermediate'],
        difficulty: 'intermediate',
        updatedBy: 'system'
    },
    {
        category: 'Data Structures',
        subject: 'Arrays and Lists',
        topic: 'Understanding Arrays',
        content: 'Arrays are fundamental data structures that store elements of the same type in contiguous memory locations. They provide O(1) time complexity for accessing elements by index. Arrays have fixed size in most languages.',
        codeExamples: [
            '# Python arrays\narr = [1, 2, 3, 4, 5]\nprint(arr[0])  # Access first element',
            '// Java arrays\nint[] arr = {1, 2, 3, 4, 5};\nSystem.out.println(arr[0]);',
            '// JavaScript arrays\nconst arr = [1, 2, 3, 4, 5];\nconsole.log(arr[0]);'
        ],
        explanations: [
            'Arrays provide constant-time access to elements',
            'Array size is fixed when created (in most languages)',
            'Arrays are stored in contiguous memory',
            'Dynamic arrays (like ArrayList) can grow in size'
        ],
        tags: ['data-structures', 'arrays', 'programming', 'beginner'],
        difficulty: 'beginner',
        updatedBy: 'system'
    },
    {
        category: 'Algorithms',
        subject: 'Sorting Algorithms',
        topic: 'Bubble Sort Algorithm',
        content: 'Bubble Sort is a simple sorting algorithm that repeatedly steps through the list, compares adjacent elements and swaps them if they are in the wrong order. It has O(n²) time complexity and is mainly used for educational purposes.',
        codeExamples: [
            'def bubble_sort(arr):\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr'
        ],
        explanations: [
            'Bubble Sort has O(n²) time complexity in worst and average cases',
            'It\'s stable sort (maintains relative order of equal elements)',
            'Best case time complexity is O(n) when array is already sorted',
            'Not suitable for large datasets due to inefficiency'
        ],
        tags: ['algorithms', 'sorting', 'bubble-sort', 'beginner'],
        difficulty: 'beginner',
        updatedBy: 'system'
    },

    // Academic Subjects
    {
        category: 'Mathematics',
        subject: 'Calculus',
        topic: 'Derivatives Fundamentals',
        content: 'Derivatives measure the rate of change of a function with respect to a variable. They represent the slope of the tangent line at any point on the function. Derivatives are fundamental in calculus and have applications in physics, engineering, and economics.',
        explanations: [
            'The derivative of f(x) is denoted as f\'(x) or df/dx',
            'Geometrically, derivative represents the slope of the tangent line',
            'Derivatives help find maximum and minimum values of functions',
            'Common rules: Power rule, Product rule, Quotient rule, Chain rule'
        ],
        tags: ['mathematics', 'calculus', 'derivatives', 'intermediate'],
        difficulty: 'intermediate',
        updatedBy: 'system'
    },
    {
        category: 'Mathematics',
        subject: 'Linear Algebra',
        topic: 'Matrix Operations',
        content: 'Matrices are rectangular arrays of numbers arranged in rows and columns. Matrix operations include addition, multiplication, transpose, and finding determinants. Matrices are essential in linear algebra, computer graphics, and machine learning.',
        explanations: [
            'Matrix addition is element-wise for matrices of same dimensions',
            'Matrix multiplication follows specific rules (rows × columns)',
            'Identity matrix acts like 1 in matrix multiplication',
            'Inverse matrices exist only for square matrices with non-zero determinant'
        ],
        tags: ['mathematics', 'linear-algebra', 'matrices', 'intermediate'],
        difficulty: 'intermediate',
        updatedBy: 'system'
    },
    {
        category: 'Computer Science',
        subject: 'Operating Systems',
        topic: 'Process Management',
        content: 'Process management is a core function of operating systems that involves creating, scheduling, and terminating processes. It ensures efficient CPU utilization and proper resource allocation. Processes can be in different states: running, waiting, or ready.',
        explanations: [
            'Process Control Block (PCB) stores process information',
            'CPU scheduling algorithms determine which process runs next',
            'Context switching saves and restores process state',
            'Process synchronization prevents race conditions'
        ],
        tags: ['computer-science', 'operating-systems', 'processes', 'intermediate'],
        difficulty: 'intermediate',
        updatedBy: 'system'
    },
    {
        category: 'Physics',
        subject: 'Mechanics',
        topic: 'Newton\'s Laws of Motion',
        content: 'Newton\'s three laws of motion form the foundation of classical mechanics. First law: Inertia, Second law: F=ma, Third law: Action-Reaction. These laws describe the relationship between forces and motion of objects.',
        explanations: [
            'First Law: Object at rest stays at rest, object in motion stays in motion',
            'Second Law: Force equals mass times acceleration (F = ma)',
            'Third Law: For every action, there is an equal and opposite reaction',
            'These laws apply to objects moving at speeds much less than light speed'
        ],
        tags: ['physics', 'mechanics', 'newton-laws', 'beginner'],
        difficulty: 'beginner',
        updatedBy: 'system'
    }
];

// Faculty AI Knowledge Base Data
const facultyKnowledgeData = [
    {
        category: 'Attendance Management',
        subject: 'AI-Powered Attendance',
        topic: 'Facial Recognition Attendance',
        content: 'AI-powered facial recognition attendance systems can automatically mark student attendance by analyzing classroom photos. These systems use machine learning algorithms to identify students and maintain accurate attendance records.',
        templates: [
            'Attendance Report Template: Date, Subject, Present/Absent counts, Remarks',
            'Student Attendance Summary: Individual attendance percentage, trends',
            'Class Attendance Analytics: Overall class performance, patterns'
        ],
        examples: [
            'Upload class photo → AI identifies students → Auto-generates attendance',
            'Manual override option for verification',
            'Integration with student information system'
        ],
        tags: ['attendance', 'ai', 'facial-recognition', 'automation'],
        updatedBy: 'system'
    },
    {
        category: 'Exam Paper Generation',
        subject: 'Multiple Choice Questions',
        topic: 'AI-Generated MCQ Papers',
        content: 'AI systems can generate multiple choice question papers based on syllabus, difficulty level, and learning outcomes. The AI ensures proper distribution of topics and maintains academic standards.',
        templates: [
            'MCQ Paper Template: Header, Instructions, Questions, Answer Key',
            'Question Distribution: Easy (30%), Medium (50%), Hard (20%)',
            'Marking Scheme: Points per question, negative marking policy'
        ],
        examples: [
            'Input: Python Programming, 20 questions, Intermediate level',
            'Output: Balanced MCQ paper with proper topic coverage',
            'Automatic answer key generation'
        ],
        tags: ['exams', 'mcq', 'ai-generation', 'assessment'],
        updatedBy: 'system'
    },
    {
        category: 'Material Creation',
        subject: 'Lecture Notes',
        topic: 'AI-Assisted Content Creation',
        content: 'AI can assist faculty in creating comprehensive lecture notes by generating outlines, examples, and explanations based on learning objectives. The AI ensures content is pedagogically sound and engaging.',
        templates: [
            'Lecture Note Structure: Objectives, Introduction, Main Content, Examples, Summary',
            'Learning Objective Template: Bloom\'s Taxonomy alignment',
            'Example Problem Template: Problem statement, Solution approach, Step-by-step solution'
        ],
        examples: [
            'Topic: Data Structures - Arrays',
            'AI generates: Learning objectives, key concepts, code examples, practice problems',
            'Faculty can review and customize the generated content'
        ],
        tags: ['materials', 'lecture-notes', 'ai-assistance', 'content-creation'],
        updatedBy: 'system'
    },
    {
        category: 'Video Content',
        subject: 'Educational Videos',
        topic: 'Video Script Generation',
        content: 'AI can generate video scripts and storyboards for educational content. The AI considers optimal video length, engagement factors, and learning outcomes to create effective educational videos.',
        templates: [
            'Video Script Template: Hook (2 min), Main Content (10 min), Examples (5 min), Summary (3 min)',
            'Storyboard Template: Visual descriptions, narration, on-screen text',
            'Engagement Elements: Quizzes, polls, interactive elements'
        ],
        examples: [
            'Topic: Sorting Algorithms',
            'AI generates: 20-minute video script with animations and examples',
            'Includes suggested visual aids and interactive elements'
        ],
        tags: ['video', 'educational-content', 'scripting', 'multimedia'],
        updatedBy: 'system'
    },
    {
        category: 'Student Analytics',
        subject: 'Performance Tracking',
        topic: 'AI-Powered Analytics',
        content: 'AI systems can analyze student performance data to identify learning patterns, predict at-risk students, and provide personalized recommendations. These insights help faculty improve teaching strategies.',
        templates: [
            'Student Performance Report: Grades, Attendance, Participation Trends',
            'Learning Analytics Dashboard: Real-time performance metrics',
            'Intervention Recommendations: Personalized improvement suggestions'
        ],
        examples: [
            'Identify students with declining performance',
            'Suggest additional resources for struggling students',
            'Provide early warning system for academic interventions'
        ],
        tags: ['analytics', 'performance', 'ai-insights', 'student-success'],
        updatedBy: 'system'
    }
];

// Admin AI Knowledge Base Data
const adminKnowledgeData = [
    {
        category: 'Student Management',
        module: 'Admissions',
        topic: 'AI-Powered Admission Process',
        content: 'AI can streamline the admission process by automating application screening, document verification, and eligibility checks. The system can handle bulk admissions and provide real-time status updates.',
        procedures: [
            'Application submission and validation',
            'Document verification using AI',
            'Eligibility criteria checking',
            'Automatic seat allocation',
            'Communication and notification system'
        ],
        tips: [
            'Use AI for duplicate detection and fraud prevention',
            'Implement automated eligibility checking',
            'Set up real-time status tracking for applicants',
            'Create backup systems for data integrity'
        ],
        tags: ['admissions', 'ai-automation', 'student-management', 'efficiency'],
        updatedBy: 'system'
    },
    {
        category: 'Faculty Management',
        module: 'Recruitment',
        topic: 'AI-Assisted Faculty Recruitment',
        content: 'AI can assist in faculty recruitment by analyzing resumes, matching qualifications with requirements, and scheduling interviews. The system ensures fair and efficient hiring processes.',
        procedures: [
            'Resume parsing and analysis',
            'Qualification matching',
            'Interview scheduling',
            'Reference checking automation',
            'Offer management system'
        ],
        tips: [
            'Use AI for bias detection in recruitment',
            'Implement automated skill assessment',
            'Maintain candidate communication logs',
            'Track recruitment metrics and analytics'
        ],
        tags: ['faculty', 'recruitment', 'ai-screening', 'hr-management'],
        updatedBy: 'system'
    },
    {
        category: 'Fee Management',
        module: 'Collection',
        topic: 'Intelligent Fee Collection System',
        content: 'AI-powered fee collection systems can optimize payment processes, predict defaults, and provide personalized payment plans. The system offers multiple payment options and real-time tracking.',
        procedures: [
            'Payment gateway integration',
            'Automated reminder system',
            'Default prediction and prevention',
            'Payment plan optimization',
            'Financial reporting and analytics'
        ],
        tips: [
            'Implement multiple payment options for convenience',
            'Use AI for payment pattern analysis',
            'Set up automated reminder systems',
            'Create flexible payment plans for different needs'
        ],
        tags: ['fees', 'collection', 'ai-optimization', 'financial-management'],
        updatedBy: 'system'
    },
    {
        category: 'Database Management',
        module: 'Optimization',
        topic: 'AI-Driven Database Optimization',
        content: 'AI can monitor database performance, identify bottlenecks, and suggest optimizations. The system provides predictive maintenance and automated tuning for better performance.',
        procedures: [
            'Performance monitoring and analysis',
            'Query optimization suggestions',
            'Index management automation',
            'Backup and recovery systems',
            'Security audit and compliance'
        ],
        tips: [
            'Implement real-time performance monitoring',
            'Use AI for predictive maintenance',
            'Automate routine database tasks',
            'Maintain comprehensive backup systems'
        ],
        tags: ['database', 'optimization', 'ai-monitoring', 'performance'],
        updatedBy: 'system'
    },
    {
        category: 'Institutional Analytics',
        module: 'Reporting',
        topic: 'Comprehensive Analytics Dashboard',
        content: 'AI-powered analytics provide comprehensive insights into institutional performance, student success metrics, and operational efficiency. The dashboard offers real-time data and predictive analytics.',
        procedures: [
            'Data collection from multiple sources',
            'Real-time analytics processing',
            'Predictive modeling and forecasting',
            'Report generation and distribution',
            'Performance benchmarking'
        ],
        tips: [
            'Integrate data from all institutional systems',
            'Use AI for trend analysis and prediction',
            'Create customizable dashboards for different stakeholders',
            'Implement automated report generation'
        ],
        tags: ['analytics', 'reporting', 'ai-insights', 'institutional-performance'],
        updatedBy: 'system'
    }
];

// Seed all knowledge bases
const seedSpecializedKnowledge = async () => {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('🗑️ Clearing existing specialized knowledge bases...');
        await StudentKnowledge.deleteMany({});
        await FacultyKnowledge.deleteMany({});
        await AdminKnowledge.deleteMany({});

        console.log('📚 Seeding Student AI Knowledge Base...');
        await StudentKnowledge.insertMany(studentKnowledgeData);

        console.log('👨‍🏫 Seeding Faculty AI Knowledge Base...');
        await FacultyKnowledge.insertMany(facultyKnowledgeData);

        console.log('👨‍💼 Seeding Admin AI Knowledge Base...');
        await AdminKnowledge.insertMany(adminKnowledgeData);

        console.log('\n✅ Specialized AI Knowledge Bases Seeded Successfully!');
        console.log(`📊 Student Knowledge: ${studentKnowledgeData.length} entries`);
        console.log(`👨‍🏫 Faculty Knowledge: ${facultyKnowledgeData.length} entries`);
        console.log(`👨‍💼 Admin Knowledge: ${adminKnowledgeData.length} entries`);

        console.log('\n🎯 Knowledge Base Coverage:');
        console.log('👨‍🎓 Student AI: Programming Languages, Data Structures, Algorithms, Mathematics, Physics, Computer Science');
        console.log('👨‍🏫 Faculty AI: Attendance Management, Exam Generation, Material Creation, Video Content, Student Analytics');
        console.log('👨‍💼 Admin AI: Student Management, Faculty Recruitment, Fee Management, Database Optimization, Institutional Analytics');

        console.log('\n🚀 All three specialized AI agents are now ready with comprehensive knowledge bases!');

        await mongoose.connection.close();
        console.log('\n✅ Database connection closed');

    } catch (error) {
        console.error('❌ Error seeding specialized knowledge bases:', error);
        process.exit(1);
    }
};

// Run the seeding
seedSpecializedKnowledge();
