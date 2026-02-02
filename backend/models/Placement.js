const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, required: true },
    domain: { type: String, default: 'General' }, // e.g., 'Frontend', 'Backend', 'Aptitude'
    category: { type: String, default: 'Interview' }, // e.g., 'Coding', 'HR', 'Technical'
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' }
});

const PlacementSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    color: { type: String, default: '#4f46e5' },
    package: { type: String, required: true }, // e.g., '12 LPA'
    description: { type: String },
    hiringRole: { type: String, default: 'Software Engineer' },
    domains: { type: [String], default: ['General'] },
    questions: [QuestionSchema],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Placement', PlacementSchema);
