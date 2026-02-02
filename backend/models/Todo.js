const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    text: { type: String, required: true },
    target: { type: String, default: 'admin' }, // 'admin', 'student'
    userId: { type: String }, // optional, for specific user
    completed: { type: Boolean, default: false },
    dueDate: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Todo', todoSchema);
