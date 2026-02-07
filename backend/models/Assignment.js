const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
    facultyId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    subject: { type: String, required: true },
    year: { type: String, required: true },
    section: { type: String, required: true },
    branch: { type: String }, // Optional, but good for filtering
    dueDate: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assignment', assignmentSchema);
