const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true },
    credits: { type: Number, default: 3 },
    year: { type: String }, // String to support '1' or 'All'
    semester: { type: String },
    branch: { type: String, default: 'CSE' },
    section: { type: String, default: 'All' },
    description: { type: String },
    isStatic: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);
