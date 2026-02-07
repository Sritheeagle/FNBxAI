const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
    sid: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    year: { type: Number, required: true, min: 1, max: 4 },
    semester: { type: Number, default: 1 },
    branch: { type: String, default: 'CSE' },
    section: { type: String, default: 'A' },
    profilePic: { type: String }, // Path to image in their specific folder
    folderPath: { type: String }, // Path to their folder: uploads/students/{sid}
    roadmapProgress: { type: Map, of: Object, default: {} },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Student', studentSchema);
