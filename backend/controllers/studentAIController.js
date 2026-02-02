const mongoose = require('mongoose');
const { ChatOpenAI } = require('@langchain/openai');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { PromptTemplate } = require('@langchain/core/prompts');
const { RunnableSequence, RunnablePassthrough } = require('@langchain/core/runnables');

// Initialize LangChain ChatOpenAI for Student AI
const studentAIModel = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
    maxTokens: 1000,
});

// Import Centralized AI Models
const { StudentKnowledge, StudentChatHistory } = require('../models/AIModels');

// Programming languages and subjects knowledge base
const programmingKnowledge = {
    'Python': {
        basics: 'Python is a high-level, interpreted programming language known for its simplicity and readability. It\'s widely used in web development, data science, AI, and automation.',
        syntax: 'Python uses indentation to define code blocks, making it very clean and readable. Variables don\'t need explicit declaration.',
        examples: [
            'print("Hello, World!")',
            'x = 5\ny = 10\nprint(f"Sum: {x + y}")',
            'def greet(name):\n    return f"Hello, {name}!"'
        ],
        commonUses: ['Web Development', 'Data Science', 'Machine Learning', 'Automation', 'Game Development']
    },
    'JavaScript': {
        basics: 'JavaScript is a versatile programming language primarily used for web development. It runs in browsers and can also be used server-side with Node.js.',
        syntax: 'JavaScript uses curly braces for code blocks and semicolons to separate statements. It\'s dynamically typed.',
        examples: [
            'console.log("Hello, World!");',
            'const x = 5;\nconst y = 10;\nconsole.log(`Sum: ${x + y}`);',
            'function greet(name) {\n    return `Hello, ${name}!`;\n}'
        ],
        commonUses: ['Web Development', 'Mobile Apps', 'Server-side Programming', 'Game Development']
    },
    'Java': {
        basics: 'Java is a robust, object-oriented programming language known for its platform independence. It\'s widely used in enterprise applications.',
        syntax: 'Java uses curly braces and requires explicit type declarations. It\'s strongly typed and compiled.',
        examples: [
            'public class Hello {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
            'int x = 5;\nint y = 10;\nSystem.out.println("Sum: " + (x + y));'
        ],
        commonUses: ['Enterprise Applications', 'Android Development', 'Web Applications', 'Big Data']
    },
    'C++': {
        basics: 'C++ is a powerful, high-performance programming language that extends C with object-oriented features. It\'s used in system programming and game development.',
        syntax: 'C++ uses curly braces, semicolons, and requires manual memory management. It\'s strongly typed.',
        examples: [
            '#include <iostream>\nusing namespace std;\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}',
            'int x = 5, y = 10;\ncout << "Sum: " << (x + y) << endl;'
        ],
        commonUses: ['System Programming', 'Game Development', 'Embedded Systems', 'High Performance Computing']
    },
    'Data Structures': {
        basics: 'Data structures are ways of organizing and storing data efficiently. Common data structures include arrays, linked lists, stacks, queues, trees, and graphs.',
        examples: [
            'Array: int[] arr = {1, 2, 3, 4, 5};',
            'Stack: stack<int> s; s.push(10); s.pop();',
            'Queue: queue<int> q; q.push(10); q.pop();'
        ],
        commonUses: ['Algorithm Optimization', 'Memory Management', 'Database Design', 'System Design']
    },
    'Algorithms': {
        basics: 'Algorithms are step-by-step procedures for solving problems. Common types include sorting, searching, and graph algorithms.',
        examples: [
            'Binary Search: O(log n) time complexity',
            'Quick Sort: O(n log n) average case',
            'Depth First Search (DFS) for graph traversal'
        ],
        commonUses: ['Problem Solving', 'Optimization', 'Data Processing', 'System Design']
    }
};

// Academic subjects knowledge base
const academicSubjects = {
    'Mathematics': {
        calculus: 'Calculus is the mathematical study of continuous change. It includes differential calculus (rates of change) and integral calculus (accumulation).',
        linearAlgebra: 'Linear algebra deals with vector spaces and linear mappings between them. It\'s fundamental to machine learning and computer graphics.',
        statistics: 'Statistics is the science of collecting, analyzing, interpreting, and presenting data. It\'s crucial for data science and research.',
        discreteMath: 'Discrete mathematics deals with mathematical structures that are fundamentally discrete rather than continuous.'
    },
    'Computer Science': {
        fundamentals: 'Computer science fundamentals include programming concepts, data structures, algorithms, and computer architecture.',
        operatingSystems: 'Operating systems manage computer hardware and software resources, providing services for computer programs.',
        computerNetworks: 'Computer networks enable communication between computers and devices, forming the foundation of the internet.',
        databaseSystems: 'Database systems store, manage, and retrieve data efficiently, supporting various applications and services.'
    },
    'Physics': {
        mechanics: 'Mechanics is the branch of physics dealing with motion and forces. It includes classical mechanics, quantum mechanics, and relativistic mechanics.',
        thermodynamics: 'Thermodynamics studies heat, work, and energy. It\'s fundamental to understanding engines, refrigeration, and energy systems.',
        electromagnetism: 'Electromagnetism deals with electric and magnetic fields and their interactions with matter and energy.',
        optics: 'Optics is the study of light and its behavior, including reflection, refraction, and diffraction.'
    },
    'Chemistry': {
        organicChemistry: 'Organic chemistry studies carbon-containing compounds, which are the basis of life and many materials.',
        inorganicChemistry: 'Inorganic chemistry deals with non-organic compounds, including metals, minerals, and coordination compounds.',
        physicalChemistry: 'Physical chemistry applies physics principles to chemical systems, studying thermodynamics, kinetics, and quantum chemistry.',
        analyticalChemistry: 'Analytical chemistry focuses on the identification and quantification of chemical substances.'
    }
};

// Generate specialized student AI response
const generateStudentAIResponse = async (message, userProfile, context = {}) => {
    const { userId, subject, year, branch, section } = userProfile;

    try {
        console.log(`[Student AI] Generating response for ${subject}: ${message}`);

        // Create specialized student prompt
        const studentPrompt = PromptTemplate.fromTemplate(`
You are a friendly and knowledgeable AI tutor for ${year} year ${branch} students in section ${section}. 
Your expertise includes programming languages, data structures, algorithms, and all academic subjects.

Your role is to:
1. Explain concepts clearly and simply
2. Provide code examples for programming topics
3. Help with subject doubts and homework
4. Suggest learning resources and study tips
5. Make learning engaging and interactive

Student's Question: {user_message}
Subject Context: {subject_context}
Programming Context: {programming_context}
Academic Context: {academic_context}

Provide a comprehensive, educational response that helps the student understand the concept thoroughly.
If it's a programming question, include code examples.
If it's an academic subject, explain the concept with examples.
Always be encouraging and supportive.
        `);

        // Check for programming language mentions
        const lowerMessage = message.toLowerCase();
        let programmingContext = '';
        let subjectContext = '';
        let academicContext = '';

        // Programming language detection
        for (const [lang, knowledge] of Object.entries(programmingKnowledge)) {
            if (lowerMessage.includes(lang.toLowerCase())) {
                programmingContext = `Programming Language: ${lang}\nBasics: ${knowledge.basics}\nCommon Uses: ${knowledge.commonUses.join(', ')}\nExamples:\n${knowledge.examples.join('\n')}`;
                break;
            }
        }

        // Academic subject detection
        for (const [subject, topics] of Object.entries(academicSubjects)) {
            if (lowerMessage.includes(subject.toLowerCase())) {
                subjectContext = `Subject: ${subject}\nTopics: ${Object.keys(topics).join(', ')}`;
                for (const [topic, description] of Object.entries(topics)) {
                    if (lowerMessage.includes(topic.toLowerCase())) {
                        academicContext = `Topic: ${topic}\nDescription: ${description}`;
                        break;
                    }
                }
                break;
            }
        }

        // Create the chain
        const chain = RunnableSequence.from([
            {
                user_message: new RunnablePassthrough(),
                subject_context: () => subjectContext || 'General academic inquiry',
                programming_context: () => programmingContext || 'No specific programming language mentioned',
                academic_context: () => academicContext || 'General academic topic'
            },
            studentPrompt,
            studentAIModel,
            new StringOutputParser()
        ]);

        // Generate response
        const response = await chain.invoke(message);
        console.log(`[Student AI] Response generated for ${subject}`);

        return response.trim();

    } catch (error) {
        console.error('Error generating student AI response:', error);

        // Enhanced fallback with subject-specific help
        const lowerMessage = message.toLowerCase();

        // Programming language fallbacks
        for (const [lang, knowledge] of Object.entries(programmingKnowledge)) {
            if (lowerMessage.includes(lang.toLowerCase())) {
                return `${knowledge.basics}\n\nCommon Uses: ${knowledge.commonUses.join(', ')}\n\nExample:\n${knowledge.examples[0]}\n\nWould you like me to explain any specific aspect of ${lang}?`;
            }
        }

        // Academic subject fallbacks
        for (const [subject, topics] of Object.entries(academicSubjects)) {
            if (lowerMessage.includes(subject.toLowerCase())) {
                const topicNames = Object.keys(topics);
                return `${subject} is a fascinating subject! The main topics include: ${topicNames.join(', ')}.\n\nWhich specific topic would you like to learn about? I can explain concepts, provide examples, and help with your doubts.`;
            }
        }

        // General student help
        return "I'm here to help you learn! I can assist with programming languages (Python, JavaScript, Java, C++), data structures, algorithms, and academic subjects like Mathematics, Physics, Chemistry, and Computer Science. What would you like to learn about today?";
    }
};

// Student AI chat handler
const handleStudentAI = async (req, res) => {
    try {
        const { message, user_id, subject, user_name, context } = req.body;

        if (!message || !user_id || !subject) {
            return res.status(400).json({ error: 'Message, user_id, and subject are required' });
        }

        const userProfile = {
            userId: user_id,
            subject,
            user_name,
            year: context?.year || '2',
            branch: context?.branch || 'CSE',
            section: context?.section || 'A'
        };

        console.log(`[Student AI] ${user_name} (${subject}): ${message}`);

        // Generate AI response
        const response = await generateStudentAIResponse(message, userProfile, context);

        // Save to chat history
        const chatEntry = new StudentChatHistory({
            userId: user_id,
            subject,
            message,
            response,
            timestamp: new Date(),
            context: {
                year: userProfile.year,
                branch: userProfile.branch,
                section: userProfile.section,
                difficulty: context?.difficulty
            }
        });

        await chatEntry.save();

        console.log(`[Student AI] Response saved for ${user_name}`);

        res.json({
            response,
            subject,
            context: userProfile
        });

    } catch (error) {
        console.error('Student AI handler error:', error);
        res.status(500).json({ error: 'Failed to process student AI request' });
    }
};

// Get student chat history
const getStudentChatHistory = async (req, res) => {
    try {
        const { userId, subject } = req.query;

        if (!userId || !subject) {
            return res.status(400).json({ error: 'userId and subject are required' });
        }

        const history = await StudentChatHistory.find({ userId, subject })
            .sort({ timestamp: -1 })
            .limit(50)
            .lean();

        res.json(history);

    } catch (error) {
        console.error('Get student chat history error:', error);
        res.status(500).json({ error: 'Failed to fetch student chat history' });
    }
};

// Update student knowledge base
const updateStudentKnowledge = async (req, res) => {
    try {
        const { category, subject, topic, content, codeExamples, explanations, tags, difficulty, updatedBy } = req.body;

        if (!category || !subject || !topic || !content) {
            return res.status(400).json({ error: 'Category, subject, topic, and content are required' });
        }

        const knowledgeEntry = new StudentKnowledge({
            category,
            subject,
            topic,
            content,
            codeExamples: codeExamples || [],
            explanations: explanations || [],
            tags: tags || [],
            difficulty: difficulty || 'beginner',
            lastUpdated: new Date(),
            updatedBy
        });

        await knowledgeEntry.save();
        res.json({ success: true, message: 'Student knowledge base updated successfully', data: knowledgeEntry });

    } catch (error) {
        console.error('Update student knowledge error:', error);
        res.status(500).json({ error: 'Failed to update student knowledge base' });
    }
};

// Get student knowledge base
const getStudentKnowledge = async (req, res) => {
    try {
        const { category, subject, difficulty } = req.query;
        let filter = {};

        if (category) filter.category = category;
        if (subject) filter.subject = subject;
        if (difficulty) filter.difficulty = difficulty;

        const knowledge = await StudentKnowledge.find(filter)
            .sort({ lastUpdated: -1 })
            .limit(100);

        res.json(knowledge);

    } catch (error) {
        console.error('Get student knowledge error:', error);
        res.status(500).json({ error: 'Failed to fetch student knowledge base' });
    }
};

// Get programming language help
const getProgrammingHelp = async (req, res) => {
    try {
        const { language } = req.query;

        if (language && programmingKnowledge[language]) {
            res.json({
                language,
                ...programmingKnowledge[language]
            });
        } else {
            res.json({
                availableLanguages: Object.keys(programmingKnowledge),
                message: 'Specify a programming language to get detailed help'
            });
        }

    } catch (error) {
        console.error('Get programming help error:', error);
        res.status(500).json({ error: 'Failed to fetch programming help' });
    }
};

// Get academic subject help
const getAcademicHelp = async (req, res) => {
    try {
        const { subject } = req.query;

        if (subject && academicSubjects[subject]) {
            res.json({
                subject,
                ...academicSubjects[subject]
            });
        } else {
            res.json({
                availableSubjects: Object.keys(academicSubjects),
                message: 'Specify an academic subject to get detailed help'
            });
        }

    } catch (error) {
        console.error('Get academic help error:', error);
        res.status(500).json({ error: 'Failed to fetch academic help' });
    }
};

module.exports = {
    handleStudentAI,
    getStudentChatHistory,
    updateStudentKnowledge,
    getStudentKnowledge,
    getProgrammingHelp,
    getAcademicHelp,
    generateStudentAIResponse
};
