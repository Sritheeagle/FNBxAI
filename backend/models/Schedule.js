const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    day: { type: String, required: true, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    time: { type: String, required: true }, // e.g. "09:00 - 10:00"
    subject: { type: String, required: true },
    faculty: { type: String, required: true },
    room: { type: String },
    type: { type: String, enum: ['Theory', 'Lab', 'Tutorial', 'Seminar', 'Other'], default: 'Theory' },
    year: { type: Number, required: true },
    section: { type: String, required: true },
    branch: { type: String, required: true },
    semester: { type: Number, default: 1 },
    batch: { type: String }, // For Labs
    courseCode: { type: String },
    credits: { type: Number, default: 3 },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Schedule', scheduleSchema);
