const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    sid: { type: String, required: true }, // Student ID like '2311'
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    score: { type: Number, required: true },
    totalMarks: { type: Number, required: true },
    answers: [{ type: Number }], // Index of selected option
    submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Result', resultSchema);
