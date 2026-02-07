const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Faculty = require('./models/Faculty');
const Student = require('./models/Student');

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

const fixData = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected.');

        // 1. FIX FACULTY ASSIGNMENTS
        console.log('\n🛠️  FIXING FACULTY ASSIGNMENTS...');
        const faculty = await Faculty.find({});
        let facCount = 0;

        for (const f of faculty) {
            let changed = false;
            if (f.assignments && f.assignments.length > 0) {
                const newAssigns = f.assignments.map(a => {
                    const oldYear = a.year;
                    const oldSec = a.section;
                    const newYear = cleanYear(a.year);
                    const newSec = cleanSection(a.section);

                    if (oldYear !== newYear || oldSec !== newSec) {
                        console.log(`   🔸 Updating ${f.name} Assign: [Y:${oldYear} S:${oldSec}] -> [Y:${newYear} S:${newSec}]`);
                        changed = true;
                        return { ...a, year: newYear, section: newSec };
                    }
                    return a;
                });

                if (changed) {
                    f.assignments = newAssigns;
                    await Faculty.updateOne({ _id: f._id }, { assignments: newAssigns });
                    facCount++;
                }
            }
        }
        console.log(`✅ Updated ${facCount} faculty records.`);

        // 2. FIX STUDENT PROFILES
        console.log('\n🛠️  FIXING STUDENT PROFILES...');
        const students = await Student.find({});
        let stuCount = 0;

        for (const s of students) {
            const oldYear = s.year;
            const oldSec = s.section;
            const newYear = cleanYear(s.year);
            const newSec = cleanSection(s.section);

            if (oldYear !== newYear || oldSec !== newSec) {
                console.log(`   🔹 Updating Student ${s.name}: [Y:${oldYear} S:${oldSec}] -> [Y:${newYear} S:${newSec}]`);
                await Student.updateOne({ _id: s._id }, { year: newYear, section: newSec });
                stuCount++;
            }
        }
        console.log(`✅ Updated ${stuCount} student records.`);

        console.log('\n🎉 DATA REPAIR COMPLETE.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

fixData();
