const mongoose = require('mongoose');

const activeSessionSchema = new mongoose.Schema({
    code: { type: String, required: true },
    facultyId: { type: String, required: true },
    section: {
        year: String,
        section: String,
        branch: String
    },
    subject: { type: String },
    period: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now },
    validUntil: { type: Date, required: true, expires: 0 } // Document auto-deletes when validUntil is reached
});

module.exports = mongoose.model('ActiveSession', activeSessionSchema);
