const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    subject: { type: String, required: true },
    year: { type: String },
    section: { type: String },
    status: { type: String, enum: ['Present', 'Absent', 'Late', 'Excused'], default: 'Present' },
    period: { type: Number, default: 1 },
    recordedBy: { type: String }, // Faculty ID or Admin
    createdAt: { type: Date, default: Date.now }
});

// Composite index for quick lookups
attendanceSchema.index({ studentId: 1, date: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
