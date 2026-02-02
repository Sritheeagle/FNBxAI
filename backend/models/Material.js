const mongoose = require('mongoose');

const materialSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subject: { type: String, required: true },
    type: { type: String, required: true }, // 'notes', 'video', 'model_paper'
    year: { type: String }, // 1, 2, 3, 4
    semester: { type: String },
    branch: { type: String, default: 'CSE' },
    section: { type: String, default: 'All' },
    module: { type: String },
    unit: { type: String },
    topic: { type: String },
    duration: { type: String },
    videoAnalysis: { type: String },
    examYear: { type: String },
    dueDate: { type: String },
    message: { type: String },
    fileUrl: { type: String },
    url: { type: String }, // support for external links
    uploadedBy: { type: String }, // admin or facultyId
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Material', materialSchema);
