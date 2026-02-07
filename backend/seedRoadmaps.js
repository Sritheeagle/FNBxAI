const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Roadmap = require('./models/Roadmap');

dotenv.config();

const roadmaps = [
    {
        slug: 'frontend-react',
        title: 'Frontend Master: React & Modern Web',
        description: 'Master the art of building stunning, performance-driven user interfaces with React, Vite, and Framer Motion.',
        category: 'Web Development',
        color: '#61dafb',
        icon: 'FaReact',
        isBest: true,
        levels: [
            {
                title: 'Foundations of the Web',
                subtitle: 'Essential Roots',
                description: 'Build the core pillars of web development from scratch.',
                topics: ['Semantic HTML5', 'Advanced CSS3 Layouts', 'Responsive Design Principles', 'Modern JavaScript (ES6+)', 'DOM Manipulation']
            },
            {
                title: 'React Core Architecture',
                subtitle: 'Dynamic Interface Engine',
                description: 'Understand the virtual DOM and component-based design.',
                topics: ['JSX Syntax', 'Functional Components', 'Hooks (useState, useEffect)', 'Props & State Management', 'Component Lifecycle']
            },
            {
                title: 'Advanced Ecosystem',
                subtitle: 'Enterprise Scaling',
                description: 'Connect to APIs and manage complex application state.',
                topics: ['React Router v6', 'Context API', 'Redux Toolkit', 'Axios & Data Fetching', 'React Query / SWR']
            },
            {
                title: 'Aesthetics & Experience',
                subtitle: 'Sentinel Design',
                description: 'Apply high-fidelity animations and premium layouts.',
                topics: ['Styled Components', 'Tailwind CSS', 'Framer Motion Essentials', 'Micro-interactions', 'Performance Optimization']
            }
        ]
    },
    {
        slug: 'python-ai',
        title: 'Python for AI & Intelligence',
        description: 'From syntax to neural networks. The ultimate path for aspiring AI engineers.',
        category: 'AI & Data',
        color: '#ffd43b',
        icon: 'FaPython',
        isBest: true,
        levels: [
            {
                title: 'Python Essentials',
                subtitle: 'Syntactical Core',
                description: 'Master the language that powers modern data science.',
                topics: ['Variables & Data Types', 'Control Flow & Loops', 'Functions & Lambdas', 'Data Structures (Lists, Dicts)', 'Modules & PIP']
            },
            {
                title: 'Data Processing',
                subtitle: 'Numerical Ops',
                description: 'Learn to manipulate large datasets efficiently.',
                topics: ['NumPy Fundamentals', 'Pandas DataFrames', 'Data Cleaning', 'Normalization', 'Visualization with Matplotlib']
            },
            {
                title: 'Machine Learning Roots',
                subtitle: 'Predictive Modeling',
                description: 'Implement core ML algorithms from scratch and with Scikit-Learn.',
                topics: ['Linear Regression', 'Decision Trees', 'SVM & Kernels', 'K-Means Clustering', 'Evaluation Metrics']
            },
            {
                title: 'Neural Networks & DL',
                subtitle: 'Cognitive Pipelines',
                description: 'Deep dive into computer vision and natural language processing.',
                topics: ['TensorFlow Basics', 'PyTorch Tensors', 'CNNs for Vision', 'RNNs for Text', 'Pre-trained Models (LLMs)']
            }
        ]
    },
    {
        slug: 'backend-node',
        title: 'Backend Systems: Node.js & Architecture',
        description: 'Architect scalable server-side systems with Node, Express, and specialized databases.',
        category: 'Web Development',
        color: '#68a063',
        icon: 'FaServer',
        levels: [
            {
                title: 'Server Foundations',
                subtitle: 'Runtime Core',
                description: 'Understand the asynchronous nature of Node.js.',
                topics: ['Event Loop Architecture', 'Node Modules (FS, Path, HTTP)', 'NPM Ecosystem', 'Asynchronous Programming (Promises)', 'Environment Configuration']
            },
            {
                title: 'Express Masterclass',
                subtitle: 'Routing Engine',
                description: 'Build robust REST APIs with middleware and security.',
                topics: ['Express Router', 'Middleware Design', 'JSON Web Tokens (JWT)', 'Input Validation (Joi/Zod)', 'Error Handling Patterns']
            },
            {
                title: 'Data Persistence',
                subtitle: 'Database Layer',
                description: 'Integrate NoSQL and SQL databases into your apps.',
                topics: ['Mongoose & Schema Design', 'Aggregation Pipelines', 'Relational DBs (PostgreSQL)', 'Redis Caching', 'Data Migrations']
            }
        ]
    },
    {
        slug: 'android-mastery',
        title: 'Android Mobile Engineering',
        description: 'Build premium mobile applications with Kotlin and modern Android architectures.',
        category: 'Mobile',
        color: '#3ddc84',
        icon: 'FaAndroid',
        levels: [
            {
                title: 'Kotlin Fundamentals',
                subtitle: 'Modern Logic',
                description: 'The primary language for Android development.',
                topics: ['Kotlin Syntax', 'Coroutines', 'Object Oriented Programming', 'Null Safety']
            },
            {
                title: 'UI Design (XML/Compose)',
                subtitle: 'Visual Interface',
                description: 'Craft beautiful mobile screens with Jetpack Compose.',
                topics: ['Layout Managers', 'Material Design 3', 'State in Compose', 'Navigation Components']
            }
        ]
    }
];

const seed = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected.');

        console.log('🧹 Clearing old roadmaps...');
        await Roadmap.deleteMany({});

        console.log('🌱 Seeding roadmaps...');
        await Roadmap.insertMany(roadmaps);

        console.log('🎉 Seeding Complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error seeding:', err);
        process.exit(1);
    }
};

seed();
