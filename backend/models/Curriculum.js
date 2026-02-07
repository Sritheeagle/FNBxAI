const mongoose = require('mongoose');

const curriculumSchema = new mongoose.Schema({
    subject: { type: String, required: true },
    year: { type: String, required: true },
    branch: { type: String, default: 'Common' }, // Optional
    units: [{
        name: String,
        description: String,
        subsections: [{
            id: Number,
            title: String,
            content: String,
            credits: Number,
            duration: String
        }]
    }],
    lastUpdated: { type: Date, default: Date.now }
});

// Compound index to ensure unique curriculum per subject/year
curriculumSchema.index({ subject: 1, year: 1, branch: 1 }, { unique: true });

module.exports = mongoose.model('Curriculum', curriculumSchema);
