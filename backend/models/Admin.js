const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    adminId: { type: String, required: true, unique: true },
    name: { type: String, default: 'Administrator' },
    password: { type: String, required: true },
    folderPath: { type: String }, // uploads/admin/{adminId}
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Admin', adminSchema);
