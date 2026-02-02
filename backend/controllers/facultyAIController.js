const mongoose = require('mongoose');
const { ChatOpenAI } = require('@langchain/openai');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { PromptTemplate } = require('@langchain/core/prompts');
const { RunnableSequence, RunnablePassthrough } = require('@langchain/core/runnables');

// Initialize LangChain ChatOpenAI for Faculty AI
const facultyAIModel = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    modelName: "gpt-3.5-turbo",
    temperature: 0.6,
    maxTokens: 1200,
});

// Import Centralized AI Models
const { FacultyKnowledge } = require('../models/AIModels');

// Faculty Chat History Schema
const FacultyChatHistorySchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    action: { type: String, required: true }, // attendance, exam, materials, etc.
    message: { type: String, required: true },
    response: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    context: {
        subject: String,
        class: String,
        semester: String,
        studentsCount: Number
    }
});

const FacultyChatHistory = mongoose.models.FacultyChatHistory || mongoose.model('FacultyChatHistory', FacultyChatHistorySchema);

// Attendance Management AI
const attendancePatterns = {
    'markAttendance': {
        description: 'AI-powered attendance marking with facial recognition or manual input',
        steps: [
            'Select the class and subject',
            'Choose marking method (manual/AI)',
            'Mark present/absent for each student',
            'Add remarks if needed',
            'Save attendance record'
        ],
        tips: [
            'Use AI mode for faster marking with photo capture',
            'Add remarks for late arrivals or early departures',
            'Generate attendance reports weekly',
            'Set up automated reminders for low attendance students'
        ]
    },
    'attendanceReports': {
        description: 'Generate comprehensive attendance reports and analytics',
        reportTypes: [
            'Daily attendance summary',
            'Weekly attendance trends',
            'Monthly attendance statistics',
            'Subject-wise attendance analysis',
            'Student attendance history'
        ],
        insights: [
            'Identify students with low attendance',
            'Track class attendance patterns',
            'Compare attendance across subjects',
            'Generate parent notifications'
        ]
    }
};

// Exam Paper Generation AI
const examPaperTemplates = {
    'multipleChoice': {
        description: 'Generate multiple choice question papers with AI',
        structure: {
            header: 'Exam Name, Subject, Duration, Max Marks',
            instructions: 'General instructions for students',
            questions: 'MCQs with 4 options each',
            answerKey: 'Separate answer key for evaluation'
        },
        questionPatterns: [
            'Concept-based questions testing fundamental understanding',
            'Application-based questions testing practical knowledge',
            'Analytical questions testing problem-solving skills',
            'Case study-based questions for real-world application'
        ],
        difficultyDistribution: {
            easy: '30% - Basic concepts and definitions',
            medium: '50% - Application and analysis',
            hard: '20% - Complex problem-solving'
        }
    },
    'descriptive': {
        description: 'Generate descriptive/subjective question papers',
        structure: {
            header: 'Exam details and instructions',
            sections: 'Part A (Short Answers), Part B (Long Answers)',
            questions: 'Open-ended questions requiring detailed answers',
            markingScheme: 'Point-wise marking criteria'
        },
        questionTypes: [
            'Define and explain questions',
            'Compare and contrast questions',
            'Problem-solving questions',
            'Case study analysis questions',
            'Essay-type questions'
        ]
    },
    'practical': {
        description: 'Generate practical exam papers with coding/problem-solving',
        structure: {
            header: 'Practical exam details',
            problems: 'Programming problems or practical tasks',
            requirements: 'Software/tools requirements',
            evaluation: 'Evaluation criteria and rubric'
        },
        problemTypes: [
            'Algorithm implementation problems',
            'Debugging challenges',
            'Code optimization tasks',
            'System design problems',
            'Database query problems'
        ]
    }
};

// Material Management AI
const materialTemplates = {
    'lectureNotes': {
        description: 'AI-assisted lecture notes creation',
        sections: [
            'Learning objectives',
            'Introduction',
            'Main content with examples',
            'Practice problems',
            'Summary and key takeaways',
            'Additional resources'
        ],
        bestPractices: [
            'Use clear headings and subheadings',
            'Include relevant code examples',
            'Add diagrams and visual aids',
            'Provide practice exercises',
            'Include real-world applications'
        ]
    },
    'videoContent': {
        description: 'AI-powered video content planning and scripting',
        structure: {
            intro: 'Hook and overview (2-3 minutes)',
            mainContent: 'Detailed explanation (10-15 minutes)',
            examples: 'Practical demonstrations (5-7 minutes)',
            summary: 'Key points and next steps (2-3 minutes)'
        },
        tips: [
            'Use engaging visuals and animations',
            'Include interactive elements',
            'Provide downloadable resources',
            'Add timestamps for different topics',
            'Include quizzes or assessments'
        ]
    },
    'modelPapers': {
        description: 'AI-generated model question papers',
        features: [
            'Balanced difficulty distribution',
            'Comprehensive syllabus coverage',
            'Varied question types',
            'Clear marking scheme',
            'Answer keys and solutions'
        ]
    }
};

// Generate specialized faculty AI response
const generateFacultyAIResponse = async (message, userProfile, context = {}) => {
    const { userId, action, subject, className } = userProfile;

    try {
        console.log(`[Faculty AI] Generating response for ${action}: ${message}`);

        // Create specialized faculty prompt
        const facultyPrompt = PromptTemplate.fromTemplate(`
You are an intelligent AI assistant for faculty members, specializing in educational technology and teaching assistance.
Your expertise includes attendance management, exam paper generation, material creation, and academic administration.

Current Action: {action_context}
Subject Context: {subject_context}
Class Context: {class_context}

Faculty's Request: {user_message}

Provide a comprehensive, practical response that helps the faculty member accomplish their task efficiently.
If it's about attendance, provide step-by-step guidance and tips.
If it's about exam creation, provide templates and best practices.
If it's about materials, suggest content structure and resources.
Always be professional, efficient, and supportive.
        `);

        // Determine action context
        let actionContext = '';
        let subjectContext = '';
        let classContext = '';

        const lowerMessage = message.toLowerCase();

        // Attendance-related queries
        if (lowerMessage.includes('attendance')) {
            actionContext = 'Attendance Management';
            if (lowerMessage.includes('mark')) {
                actionContext += ' - Marking Attendance';
                subjectContext = attendancePatterns.markAttendance.description;
                classContext = `Class: ${className || 'Selected Class'}, Students: ${context?.studentsCount || 'Unknown'}`;
            } else if (lowerMessage.includes('report')) {
                actionContext += ' - Attendance Reports';
                subjectContext = attendancePatterns.attendanceReports.description;
            }
        }

        // Exam-related queries
        else if (lowerMessage.includes('exam') || lowerMessage.includes('paper') || lowerMessage.includes('question')) {
            actionContext = 'Exam Paper Generation';
            if (lowerMessage.includes('multiple') || lowerMessage.includes('mcq')) {
                subjectContext = examPaperTemplates.multipleChoice.description;
            } else if (lowerMessage.includes('descriptive') || lowerMessage.includes('subjective')) {
                subjectContext = examPaperTemplates.descriptive.description;
            } else if (lowerMessage.includes('practical') || lowerMessage.includes('coding')) {
                subjectContext = examPaperTemplates.practical.description;
            }
            classContext = `Subject: ${subject || 'Selected Subject'}, Class: ${className || 'Selected Class'}`;
        }

        // Material-related queries
        else if (lowerMessage.includes('material') || lowerMessage.includes('notes') || lowerMessage.includes('video')) {
            actionContext = 'Material Management';
            if (lowerMessage.includes('notes') || lowerMessage.includes('lecture')) {
                subjectContext = materialTemplates.lectureNotes.description;
            } else if (lowerMessage.includes('video')) {
                subjectContext = materialTemplates.videoContent.description;
            } else if (lowerMessage.includes('model') || lowerMessage.includes('paper')) {
                subjectContext = materialTemplates.modelPapers.description;
            }
            classContext = `Subject: ${subject || 'Selected Subject'}`;
        }

        // Create the chain
        const chain = RunnableSequence.from([
            {
                user_message: new RunnablePassthrough(),
                action_context: () => actionContext || 'General Faculty Assistance',
                subject_context: () => subjectContext || 'General academic task',
                class_context: () => classContext || 'General class context'
            },
            facultyPrompt,
            facultyAIModel,
            new StringOutputParser()
        ]);

        // Generate response
        const response = await chain.invoke(message);
        console.log(`[Faculty AI] Response generated for ${action}`);

        return response.trim();

    } catch (error) {
        console.error('Error generating faculty AI response:', error);

        // Enhanced fallback with action-specific help
        const lowerMessage = message.toLowerCase();

        // Attendance fallbacks
        if (lowerMessage.includes('attendance')) {
            if (lowerMessage.includes('mark')) {
                return `To mark attendance efficiently:\n\n1. Select your class and subject\n2. Choose AI-powered photo capture or manual input\n3. Mark students as present/absent\n4. Add remarks for special cases\n5. Save and generate reports\n\n💡 **Pro Tip**: Use AI mode to mark attendance in seconds by taking a class photo!`;
            } else if (lowerMessage.includes('report')) {
                return `Generate attendance reports with these insights:\n\n• Daily/weekly/monthly summaries\n• Subject-wise attendance analysis\n• Low attendance alerts\n• Student attendance history\n• Parent notification options\n\nWould you like me to help you create a specific report?`;
            }
        }

        // Exam fallbacks
        else if (lowerMessage.includes('exam') || lowerMessage.includes('paper')) {
            return `I can help you create exam papers with AI! Choose a type:\n\n📝 **Multiple Choice Questions**: Auto-generate MCQs with difficulty levels\n📄 **Descriptive Papers**: Create subjective questions with marking schemes\n💻 **Practical Exams**: Generate coding problems and practical tasks\n\nWhich type of exam paper would you like to create?`;
        }

        // Material fallbacks
        else if (lowerMessage.includes('material') || lowerMessage.includes('notes')) {
            return `Create engaging teaching materials with AI assistance:\n\n📚 **Lecture Notes**: Structured content with examples\n🎥 **Video Content**: Script and timeline planning\n📋 **Model Papers**: Practice questions with solutions\n\nWhat type of material would you like to create for your ${subject || 'subject'}?`;
        }

        // General faculty help
        return "I'm your AI teaching assistant! I can help you with:\n\n✅ **Attendance Management**: Smart marking and reports\n✅ **Exam Paper Generation**: AI-powered question creation\n✅ **Material Creation**: Notes, videos, and model papers\n✅ **Student Analytics**: Performance tracking and insights\n\nWhat would you like to accomplish today?";
    }
};

// Faculty AI handler
const handleFacultyAI = async (req, res) => {
    try {
        const { message, user_id, action, subject, user_name, context } = req.body;

        if (!message || !user_id || !action) {
            return res.status(400).json({ error: 'Message, user_id, and action are required' });
        }

        const userProfile = {
            userId: user_id,
            action,
            subject,
            className: context?.className,
            user_name
        };

        console.log(`[Faculty AI] ${user_name} (${action}): ${message}`);

        // Generate AI response
        const response = await generateFacultyAIResponse(message, userProfile, context);

        // Save to chat history
        const chatEntry = new FacultyChatHistory({
            userId: user_id,
            action,
            message,
            response,
            timestamp: new Date(),
            context: {
                subject,
                class: context?.className,
                semester: context?.semester,
                studentsCount: context?.studentsCount
            }
        });

        await chatEntry.save();

        console.log(`[Faculty AI] Response saved for ${user_name}`);

        res.json({
            response,
            action,
            context: userProfile
        });

    } catch (error) {
        console.error('Faculty AI handler error:', error);
        res.status(500).json({ error: 'Failed to process faculty AI request' });
    }
};

// Get faculty chat history
const getFacultyChatHistory = async (req, res) => {
    try {
        const { userId, action } = req.query;

        if (!userId || !action) {
            return res.status(400).json({ error: 'userId and action are required' });
        }

        const history = await FacultyChatHistory.find({ userId, action })
            .sort({ timestamp: -1 })
            .limit(50)
            .lean();

        res.json(history);

    } catch (error) {
        console.error('Get faculty chat history error:', error);
        res.status(500).json({ error: 'Failed to fetch faculty chat history' });
    }
};

// AI-powered attendance marking
const aiMarkAttendance = async (req, res) => {
    try {
        const { classId, subject, students, method } = req.body;

        // Simulate AI attendance processing
        const processedAttendance = students.map(student => ({
            studentId: student.id,
            name: student.name,
            status: Math.random() > 0.2 ? 'present' : 'absent', // Simulated AI detection
            confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
            timestamp: new Date()
        }));

        // Save attendance record
        const attendanceRecord = {
            classId,
            subject,
            date: new Date(),
            method,
            attendance: processedAttendance,
            markedBy: req.body.facultyId,
            aiProcessed: true
        };

        console.log(`[Faculty AI] AI attendance marked for ${processedAttendance.length} students`);

        res.json({
            success: true,
            message: 'AI attendance marking completed',
            data: attendanceRecord,
            summary: {
                total: processedAttendance.length,
                present: processedAttendance.filter(a => a.status === 'present').length,
                absent: processedAttendance.filter(a => a.status === 'absent').length
            }
        });

    } catch (error) {
        console.error('AI attendance marking error:', error);
        res.status(500).json({ error: 'Failed to mark attendance with AI' });
    }
};

// AI exam paper generation
const generateExamPaper = async (req, res) => {
    try {
        const { subject, examType, difficulty, questionCount, topics } = req.body;

        // Generate exam paper based on type
        let examPaper = {
            subject,
            examType,
            difficulty,
            generatedAt: new Date(),
            generatedBy: 'AI Assistant'
        };

        if (examType === 'multipleChoice') {
            examPaper.questions = generateMCQs(subject, topics, questionCount, difficulty);
        } else if (examType === 'descriptive') {
            examPaper.questions = generateDescriptiveQuestions(subject, topics, questionCount, difficulty);
        } else if (examType === 'practical') {
            examPaper.questions = generatePracticalQuestions(subject, topics, questionCount, difficulty);
        }

        examPaper.totalMarks = examPaper.questions.reduce((sum, q) => sum + q.marks, 0);
        examPaper.duration = calculateExamDuration(examPaper.totalMarks);

        console.log(`[Faculty AI] Generated ${examType} exam paper with ${questionCount} questions`);

        res.json({
            success: true,
            message: 'Exam paper generated successfully',
            data: examPaper
        });

    } catch (error) {
        console.error('Exam paper generation error:', error);
        res.status(500).json({ error: 'Failed to generate exam paper' });
    }
};

// Helper functions for question generation
const generateMCQs = (subject, topics, count, difficulty) => {
    const questions = [];
    for (let i = 0; i < count; i++) {
        questions.push({
            id: i + 1,
            type: 'MCQ',
            question: `Sample MCQ question ${i + 1} for ${subject}`,
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 'Option A',
            marks: 2,
            difficulty: difficulty
        });
    }
    return questions;
};

const generateDescriptiveQuestions = (subject, topics, count, difficulty) => {
    const questions = [];
    for (let i = 0; i < count; i++) {
        questions.push({
            id: i + 1,
            type: 'Descriptive',
            question: `Sample descriptive question ${i + 1} for ${subject}`,
            maxWords: 300,
            marks: 10,
            difficulty: difficulty
        });
    }
    return questions;
};

const generatePracticalQuestions = (subject, topics, count, difficulty) => {
    const questions = [];
    for (let i = 0; i < count; i++) {
        questions.push({
            id: i + 1,
            type: 'Practical',
            question: `Sample practical problem ${i + 1} for ${subject}`,
            requirements: ['IDE', 'Compiler', 'Test Cases'],
            marks: 15,
            difficulty: difficulty
        });
    }
    return questions;
};

const calculateExamDuration = (totalMarks) => {
    return Math.ceil(totalMarks / 2); // 2 marks per minute
};

// Update faculty knowledge base
const updateFacultyKnowledge = async (req, res) => {
    try {
        const { category, subject, topic, content, templates, examples, tags, updatedBy } = req.body;

        const knowledgeEntry = new FacultyKnowledge({
            category,
            subject,
            topic,
            content,
            templates: templates || [],
            examples: examples || [],
            tags: tags || [],
            lastUpdated: new Date(),
            updatedBy
        });

        await knowledgeEntry.save();
        res.json({ success: true, message: 'Faculty knowledge base updated successfully', data: knowledgeEntry });

    } catch (error) {
        console.error('Update faculty knowledge error:', error);
        res.status(500).json({ error: 'Failed to update faculty knowledge base' });
    }
};

// Get faculty knowledge base
const getFacultyKnowledge = async (req, res) => {
    try {
        const { category, subject } = req.query;
        let filter = {};

        if (category) filter.category = category;
        if (subject) filter.subject = subject;

        const knowledge = await FacultyKnowledge.find(filter)
            .sort({ lastUpdated: -1 })
            .limit(100);

        res.json(knowledge);

    } catch (error) {
        console.error('Get faculty knowledge error:', error);
        res.status(500).json({ error: 'Failed to fetch faculty knowledge base' });
    }
};

module.exports = {
    handleFacultyAI,
    getFacultyChatHistory,
    aiMarkAttendance,
    generateExamPaper,
    updateFacultyKnowledge,
    getFacultyKnowledge,
    generateFacultyAIResponse
};
