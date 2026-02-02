const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
    title: { type: String, required: true },
    topic: { type: String },
    week: { type: String },
    duration: { type: String }, // e.g. "60 min"
    totalMarks: { type: Number },
    year: { type: String }, // Support "1", "2", etc.
    section: { type: String }, // Support "A", "B", etc.
    branch: { type: String, default: 'CSE' },
    facultyId: { type: String, required: true },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    questions: [{
        question: { type: String, required: true },
        options: [{ type: String }],
        correctAnswer: { type: String }
    }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Exam', examSchema);
