const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    examType: { type: String, required: true }, // Mid-1, Mid-2, Semester, Lab
    subject: { type: String, required: true },
    marksObtained: { type: Number, required: true },
    maxMarks: { type: Number, required: true },
    semester: { type: String }, // To track historical data
    academicYear: { type: String },
    remarks: { type: String },
    createdAt: { type: Date, default: Date.now }
});

markSchema.index({ studentId: 1, examType: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('Mark', markSchema);
