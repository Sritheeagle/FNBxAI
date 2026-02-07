const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema({
    facultyId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    department: { type: String, default: 'CSE' },
    assignments: [{
        year: String,
        section: String,
        subject: String,
        branch: String,
        semester: String
    }],
    subjects: [{ type: String }], // Keep for backward compatibility if needed
    profilePic: { type: String }, // Path to image in their specific folder
    folderPath: { type: String }, // uploads/faculty/{facultyId}
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Faculty', facultySchema);
