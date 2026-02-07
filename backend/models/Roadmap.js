const mongoose = require('mongoose');

const roadmapSchema = new mongoose.Schema({
    slug: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    color: { type: String, default: '#3b82f6' },
    icon: { type: String, default: 'FaCode' },
    levels: [{
        title: { type: String, required: true },
        subtitle: { type: String },
        description: { type: String },
        topics: [String]
    }],
    tags: [String],
    isBest: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Roadmap', roadmapSchema);
