const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    message: { type: String, required: true },
    target: { type: String, default: 'all' }, // 'all', 'faculty', 'students', 'students-specific'
    type: { type: String, default: 'announcement' },
    targetYear: { type: String },
    targetSections: [{ type: String }],
    subject: { type: String }, // For faculty-sent messages
    sender: { type: String }, // Name or ID of sender
    senderRole: { type: String, enum: ['admin', 'faculty'], default: 'admin' },
    date: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
