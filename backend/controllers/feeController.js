const Fee = require('../models/Fee');
const Student = require('../models/Student');
const sse = require('../sse');

exports.getFees = async (req, res) => {
    try {
        const fees = await Fee.find().sort({ updatedAt: -1 });
        res.json(fees);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateStudentFee = async (req, res) => {
    try {
        const { id } = req.params; // Student ID
        const { totalFee, paidAmount, academicYear, semester } = req.body;

        let feeRecord = await Fee.findOne({ studentId: id });

        if (!feeRecord) {
            feeRecord = new Fee({ studentId: id });
        }

        if (totalFee !== undefined) feeRecord.totalFee = totalFee;
        if (paidAmount !== undefined) feeRecord.paidAmount = paidAmount;
        if (academicYear) feeRecord.academicYear = academicYear;
        if (semester) feeRecord.semester = semester;

        feeRecord.lastPaymentDate = new Date();

        await feeRecord.save();

        // Broadcast Update
        sse.broadcast('fees', { action: 'update', data: feeRecord });

        res.json(feeRecord);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStudentFee = async (req, res) => {
    try {
        const fee = await Fee.findOne({ studentId: req.params.id });
        res.json(fee || { totalFee: 0, paidAmount: 0, dueAmount: 0, status: 'N/A' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
