const mongoose = require('mongoose');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { ChatOpenAI } = require('@langchain/openai');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { PromptTemplate } = require('@langchain/core/prompts');
const { RunnableSequence, RunnablePassthrough } = require('@langchain/core/runnables');

// Import Centralized AI Models
const { StudentKnowledge, FacultyKnowledge, AdminKnowledge, ChatHistory } = require('../models/AIModels');

// Enhanced LLM Setup with fallback
const getEnhancedChatModel = () => {
    // Prefer Google Gemini for better performance
    if (process.env.GOOGLE_API_KEY) {
        console.log('[Enhanced AI] Using Google Gemini Pro');
        return new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            modelName: "gemini-1.5-flash",
            maxOutputTokens: 4096,
            temperature: 0.7,
        });
    } else if (process.env.OPENAI_API_KEY) {
        console.log('[Enhanced AI] Using OpenAI GPT-4');
        return new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: "gpt-4",
            temperature: 0.7,
            maxTokens: 2048,
        });
    } else {
        throw new Error('No API key found for Google or OpenAI');
    }
};

// Enhanced system prompts for ChatGPT/Gemini-like responses
const getEnhancedSystemPrompt = (role, userProfile) => {
    const { name, year, branch, section } = userProfile.context || {};

    const basePrompts = {
        student: `You are VUAI Agent, an advanced AI educational assistant designed to help students excel in their B.Tech journey. You have comprehensive knowledge across all engineering subjects, programming languages, and fullstack development.

Your capabilities include:
- **Academic Excellence**: Deep knowledge of Mathematics, Physics, Chemistry, and all engineering branches
- **Programming Mastery**: Expert in Python, Java, JavaScript, C++, Data Structures, Algorithms
- **Fullstack Development**: React, Node.js, databases, web technologies, cloud deployment
- **Exam Preparation**: Model paper analysis, question pattern recognition, study strategies
- **Notes Analysis**: Understanding and explaining complex concepts from study materials
- **Interactive Learning**: Code examples, practical demonstrations, real-world applications

Communication Style:
- Be friendly, encouraging, and professional like a knowledgeable senior student
- Provide detailed explanations with examples and code snippets
- Ask follow-up questions to ensure understanding
- Use emojis to keep conversations engaging 🚀📚💡
- Navigate to relevant sections using {{NAVIGATE:section}} commands

Current Context:
- Student: ${name || 'Student'}
- Year: ${year || 'Not specified'}
- Branch: ${branch || 'Not specified'}
- Section: ${section || 'Not specified'}

Always provide accurate, comprehensive, and helpful responses tailored to their academic level and interests.`,

        faculty: `You are VUAI Agent, an advanced AI assistant designed to support faculty in teaching, research, and administrative tasks. You have comprehensive knowledge across all engineering disciplines and modern educational methodologies.

Your capabilities include:
- **Curriculum Support**: Course design, lesson planning, educational resource creation
- **Research Assistance**: Literature review, data analysis, methodology guidance
- **Student Evaluation**: Automated grading, performance analytics, feedback generation
- **Administrative Efficiency**: Workflow optimization, documentation, reporting
- **Technology Integration**: Modern teaching tools, online learning platforms
- **Academic Analytics**: Student performance tracking, course improvement insights

Communication Style:
- Be professional, efficient, and supportive
- Provide actionable insights and practical solutions
- Use data-driven recommendations
- Navigate to relevant tools using {{NAVIGATE:section}} commands

Always maintain academic excellence and support faculty in their educational mission.`,

        admin: `You are VUAI Agent, an advanced AI administrative assistant designed to streamline institutional management and strategic planning. You have comprehensive knowledge of educational administration, system optimization, and institutional operations.

Your capabilities include:
- **Strategic Management**: Institutional planning, resource optimization, policy development
- **System Analytics**: Performance monitoring, trend analysis, predictive insights
- **Operational Efficiency**: Workflow automation, process improvement, compliance management
- **Stakeholder Communication**: Reporting, dashboards, strategic presentations
- **Technology Oversight**: System health, security, scalability planning
- **Data Intelligence**: Institutional research, accreditation support, decision support

Communication Style:
- Be precise, data-driven, and authoritative
- Provide strategic insights and actionable recommendations
- Use clear, professional language
- Navigate to administrative tools using {{NAVIGATE:section}} commands

Always support institutional excellence and operational efficiency.`
    };

    return basePrompts[role] || basePrompts.student;
};

// Enhanced knowledge base search with semantic matching
const searchEnhancedKnowledgeBase = async (query, role, context = {}) => {
    try {
        let Model;
        if (role === 'student') Model = StudentKnowledge;
        else if (role === 'faculty') Model = FacultyKnowledge;
        else if (role === 'admin') Model = AdminKnowledge;
        else return [];

        // Enhanced keyword extraction and semantic matching
        const searchTerms = extractSearchTerms(query);
        const results = await Model.find({
            $or: [
                { topic: { $regex: searchTerms.join('|'), $options: 'i' } },
                { content: { $regex: searchTerms.join('|'), $options: 'i' } },
                { tags: { $in: searchTerms } },
                { category: { $regex: searchTerms.join('|'), $options: 'i' } },
                { subject: { $regex: searchTerms.join('|'), $options: 'i' } }
            ]
        }).limit(10);

        // Relevance scoring and ranking
        const scoredResults = results.map(item => ({
            ...item.toObject(),
            relevanceScore: calculateRelevance(item, query, searchTerms)
        })).sort((a, b) => b.relevanceScore - a.relevanceScore);

        return scoredResults;
    } catch (error) {
        console.error('[Enhanced Knowledge Search] Error:', error);
        return [];
    }
};

// Extract meaningful search terms
const extractSearchTerms = (query) => {
    const noiseWords = ['the', 'is', 'at', 'which', 'on', 'and', 'or', 'but', 'in', 'with', 'a', 'an', 'to', 'for', 'of', 'as', 'by', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'help', 'me', 'please', 'thank', 'you'];
    
    return query.toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 2 && !noiseWords.includes(word))
        .map(word => word.replace(/[^\w]/g, ''));
};

// Calculate relevance score for knowledge items
const calculateRelevance = (item, query, searchTerms) => {
    let score = 0;
    const queryLower = query.toLowerCase();
    const itemText = `${item.topic} ${item.content} ${item.category} ${item.subject}`.toLowerCase();
    
    // Exact phrase match
    if (itemText.includes(queryLower)) score += 10;
    
    // Term frequency
    searchTerms.forEach(term => {
        const termCount = (itemText.match(new RegExp(term, 'g')) || []).length;
        score += termCount * 2;
    });
    
    // Category and subject matching
    if (item.category && queryLower.includes(item.category.toLowerCase())) score += 5;
    if (item.subject && queryLower.includes(item.subject.toLowerCase())) score += 5;
    
    // Tag matching
    if (item.tags) {
        item.tags.forEach(tag => {
            if (searchTerms.includes(tag.toLowerCase())) score += 3;
        });
    }
    
    return score;
};

// Enhanced RAG response generation
const generateEnhancedResponse = async (query, role, userProfile, context = {}) => {
    try {
        const chatModel = getEnhancedChatModel();
        const systemPrompt = getEnhancedSystemPrompt(role, userProfile);
        
        // Search knowledge base
        const knowledgeResults = await searchEnhancedKnowledgeBase(query, role, context);
        
        // Build context from knowledge base
        const knowledgeContext = knowledgeResults.length > 0 
            ? `\n\nRelevant Knowledge:\n${knowledgeResults.map((item, index) => 
                `${index + 1}. ${item.category} - ${item.topic}:\n${item.content}\n${item.codeExamples ? 'Code Examples:\n' + item.codeExamples.join('\n') : ''}\n${item.explanations ? 'Explanations:\n' + item.explanations.join('\n') : ''}`
            ).join('\n\n')}`
            : '';
        
        // Enhanced prompt template
        const promptTemplate = PromptTemplate.fromTemplate(`
${systemPrompt}

${knowledgeContext}

User Query: {query}

Context Information:
- Academic Level: ${userProfile.context?.year || 'Not specified'}
- Branch/Department: ${userProfile.context?.branch || 'Not specified'}
- Current Section: ${userProfile.context?.section || 'Not specified'}

Instructions:
1. Provide a comprehensive, detailed response
2. Include relevant code examples if applicable
3. Explain concepts clearly with real-world applications
4. Suggest additional resources or next steps
5. Use navigation commands when relevant
6. Be encouraging and supportive

Response:`);

        const chain = RunnableSequence.from([
            {
                query: (input) => input.query,
            },
            promptTemplate,
            chatModel,
            new StringOutputParser()
        ]);

        const response = await chain.invoke({ query });
        
        // Save to chat history
        await saveChatHistory(userProfile.userId, role, query, response, context);
        
        return {
            response,
            knowledgeUsed: knowledgeResults.length > 0,
            sources: knowledgeResults.map(item => ({
                category: item.category,
                topic: item.topic,
                relevanceScore: item.relevanceScore
            }))
        };
        
    } catch (error) {
        console.error('[Enhanced Response Generation] Error:', error);
        return {
            response: "I apologize, but I'm experiencing technical difficulties. Please try again later.",
            knowledgeUsed: false,
            sources: []
        };
    }
};

// Save chat history
const saveChatHistory = async (userId, role, message, response, context) => {
    try {
        await ChatHistory.create({
            userId,
            role,
            message,
            response,
            timestamp: new Date(),
            context
        });
    } catch (error) {
        console.error('[Chat History] Error saving:', error);
    }
};

// Model paper analysis
const analyzeModelPaper = async (paperContent, subject, year) => {
    try {
        const chatModel = getEnhancedChatModel();
        
        const analysisPrompt = PromptTemplate.fromTemplate(`
You are an expert academic analyzer with deep knowledge of B.Tech curriculum and examination patterns.

Analyze this model paper for ${subject} (${year}):

Paper Content:
{paperContent}

Provide a comprehensive analysis including:
1. **Question Pattern Analysis**: Types of questions, marks distribution, difficulty levels
2. **Topic Coverage**: Important topics, weightage of each unit/chapter
3. **Expected Questions**: Likely questions based on pattern analysis
4. **Study Strategy**: Recommended preparation approach and time allocation
5. **Key Concepts**: Important concepts to focus on
6. **Answer Writing Tips**: How to structure answers for maximum marks

Provide detailed, actionable insights for students preparing for this exam.`);

        const chain = RunnableSequence.from([
            {
                paperContent: (input) => input.paperContent,
            },
            analysisPrompt,
            chatModel,
            new StringOutputParser()
        ]);

        const analysis = await chain.invoke({ paperContent });
        
        return {
            analysis,
            subject,
            year,
            analyzedAt: new Date()
        };
        
    } catch (error) {
        console.error('[Model Paper Analysis] Error:', error);
        return {
            analysis: "Error analyzing the model paper. Please ensure the content is properly formatted.",
            subject,
            year,
            analyzedAt: new Date()
        };
    }
};

// Notes analysis and explanation
const analyzeNotes = async (notesContent, subject, topic) => {
    try {
        const chatModel = getEnhancedChatModel();
        
        const notesPrompt = PromptTemplate.fromTemplate(`
You are an expert educational content analyzer with deep knowledge of ${subject} and ability to explain complex concepts clearly.

Analyze and explain these notes about ${topic}:

Notes Content:
{notesContent}

Provide:
1. **Concept Summary**: Clear explanation of the main concepts
2. **Key Points**: Important takeaways and highlights
3. **Simplified Explanation**: Break down complex ideas into easy-to-understand parts
4. **Real-world Applications**: How these concepts apply in practice
5. **Related Topics**: Connected concepts students should also study
6. **Study Tips**: Best ways to remember and understand this material
7. **Code Examples**: If applicable, provide practical code examples
8. **Practice Questions**: Questions to test understanding

Make the explanation engaging, comprehensive, and suitable for B.Tech students.`);

        const chain = RunnableSequence.from([
            {
                notesContent: (input) => input.notesContent,
            },
            notesPrompt,
            chatModel,
            new StringOutputParser()
        ]);

        const explanation = await chain.invoke({ notesContent });
        
        return {
            explanation,
            subject,
            topic,
            analyzedAt: new Date()
        };
        
    } catch (error) {
        console.error('[Notes Analysis] Error:', error);
        return {
            explanation: "Error analyzing the notes. Please ensure the content is properly formatted.",
            subject,
            topic,
            analyzedAt: new Date()
        };
    }
};

// Generate student answers
const generateStudentAnswer = async (question, subject, marks, context = {}) => {
    try {
        const chatModel = getEnhancedChatModel();
        
        const answerPrompt = PromptTemplate.fromTemplate(`
You are an expert B.Tech student with excellent academic writing skills. Generate a comprehensive answer for this exam question.

Question: {question}
Subject: {subject}
Marks: {marks}
Context: {context}

Generate a well-structured answer that:
1. **Introduction**: Briefly introduce the concept
2. **Main Content**: Detailed explanation with relevant examples
3. **Diagrams/Formulas**: Include necessary diagrams, equations, or formulas
4. **Applications**: Real-world applications if applicable
5. **Conclusion**: Brief summary of key points
6. **Answer Structure**: Organized for maximum marks (use headings, bullet points where appropriate)

The answer should be comprehensive yet concise, matching the mark allocation, and demonstrate deep understanding of the subject.`);

        const chain = RunnableSequence.from([
            {
                question: (input) => input.question,
                subject: (input) => input.subject,
                marks: (input) => input.marks,
                context: (input) => input.context
            },
            answerPrompt,
            chatModel,
            new StringOutputParser()
        ]);

        const answer = await chain.invoke({ 
            question, 
            subject, 
            marks, 
            context: JSON.stringify(context) 
        });
        
        return {
            answer,
            question,
            subject,
            marks,
            generatedAt: new Date()
        };
        
    } catch (error) {
        console.error('[Answer Generation] Error:', error);
        return {
            answer: "Error generating the answer. Please try again.",
            question,
            subject,
            marks,
            generatedAt: new Date()
        };
    }
};

module.exports = {
    generateEnhancedResponse,
    analyzeModelPaper,
    analyzeNotes,
    generateStudentAnswer,
    searchEnhancedKnowledgeBase,
    getEnhancedChatModel
};
