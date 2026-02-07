const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Attendance = require('./models/Attendance');

// Load env vars
dotenv.config();

const cleanYear = (y) => {
    if (!y) return '1';
    return String(y).replace(/[^0-9]/g, '');
};

const cleanSection = (s) => {
    if (!s) return 'A';
    return String(s).replace(/Section\s*/i, '').trim().toUpperCase();
};

const fixAttendance = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected.');

        console.log('\n🛠️  FIXING ATTENDANCE RECORDS...');
        const records = await Attendance.find({});
        let count = 0;

        for (const r of records) {
            const oldYear = r.year;
            const oldSec = r.section;
            const newYear = cleanYear(r.year);
            const newSec = cleanSection(r.section);

            if (oldYear !== newYear || oldSec !== newSec) {
                console.log(`   🔸 Updating Attendance [${r.studentId}]: [Y:${oldYear} S:${oldSec}] -> [Y:${newYear} S:${newSec}]`);
                await Attendance.updateOne({ _id: r._id }, { year: newYear, section: newSec });
                count++;
            }
        }
        console.log(`✅ Updated ${count} attendance records.`);

        console.log('\n🎉 ATTENDANCE REPAIR COMPLETE.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

fixAttendance();
