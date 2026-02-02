const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
    studentId: { type: String, required: true },
    academicYear: { type: String },
    semester: { type: String },
    totalFee: { type: Number, default: 0 },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 },
    status: { type: String, default: 'Pending' }, // Paid, Partial, Pending
    lastPaymentDate: { type: Date },
    updatedAt: { type: Date, default: Date.now }
});

// Calculate due and status before saving
feeSchema.pre('save', function (next) {
    this.dueAmount = this.totalFee - this.paidAmount;
    if (this.dueAmount <= 0) {
        this.status = 'Paid';
        this.dueAmount = 0;
    } else if (this.paidAmount > 0) {
        this.status = 'Partial';
    } else {
        this.status = 'Pending';
    }
    next();
});

module.exports = mongoose.model('Fee', feeSchema);
