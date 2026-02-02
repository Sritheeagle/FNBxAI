const mongoose = require('mongoose');

// Shared Schemas for AI Ecosystem
const StudentKnowledgeSchema = new mongoose.Schema({
    category: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    content: { type: String, required: true },
    codeExamples: [String],
    explanations: [String],
    tags: [String],
    difficulty: { type: String, default: 'beginner' },
    lastUpdated: { type: Date, default: Date.now },
    updatedBy: String
});

const FacultyKnowledgeSchema = new mongoose.Schema({
    category: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    topic: { type: String, required: true },
    content: { type: String, required: true },
    templates: [String],
    examples: [String],
    tags: [String],
    lastUpdated: { type: Date, default: Date.now },
    updatedBy: String
});

const AdminKnowledgeSchema = new mongoose.Schema({
    category: { type: String, required: true, index: true },
    module: { type: String, required: true },
    topic: { type: String, required: true },
    content: { type: String, required: true },
    procedures: [String],
    tips: [String],
    tags: [String],
    lastUpdated: { type: Date, default: Date.now },
    updatedBy: String
});

const ChatHistorySchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    role: { type: String, required: true, enum: ['student', 'faculty', 'admin'] },
    message: { type: String, required: true },
    response: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    context: {
        year: String,
        branch: String,
        section: String,
        document: Object
    }
});

// Specialized Chat Histories if needed (preserving existing fields in studentAIController)
const StudentChatHistorySchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    response: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    context: {
        year: String,
        branch: String,
        section: String,
        difficulty: String
    }
});

// Use a pattern that avoids OverwriteModelError
const StudentKnowledge = mongoose.models.StudentKnowledge || mongoose.model('StudentKnowledge', StudentKnowledgeSchema);
const FacultyKnowledge = mongoose.models.FacultyKnowledge || mongoose.model('FacultyKnowledge', FacultyKnowledgeSchema);
const AdminKnowledge = mongoose.models.AdminKnowledge || mongoose.model('AdminKnowledge', AdminKnowledgeSchema);
const ChatHistory = mongoose.models.ChatHistory || mongoose.model('ChatHistory', ChatHistorySchema);
const StudentChatHistory = mongoose.models.StudentChatHistory || mongoose.model('StudentChatHistory', StudentChatHistorySchema);

module.exports = {
    StudentKnowledge,
    FacultyKnowledge,
    AdminKnowledge,
    ChatHistory,
    StudentChatHistory
};
