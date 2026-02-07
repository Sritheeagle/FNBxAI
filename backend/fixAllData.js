const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Student = require('./models/Student');
const Faculty = require('./models/Faculty');
const Attendance = require('./models/Attendance');
const Schedule = require('./models/Schedule');
const Exam = require('./models/Exam');
const Material = require('./models/Material');
const Assignment = require('./models/Assignment');
const Course = require('./models/Course');
const Message = require('./models/Message');
const Mark = require('./models/Mark');

// Load env vars
dotenv.config();

const cleanYear = (y) => {
    if (!y) return '1';
    return String(y).replace(/[^0-9]/g, '') || '1';
};

const cleanSection = (s) => {
    if (!s) return 'A';
    return String(s).replace(/Section\s*/i, '').trim().toUpperCase();
};

const fixAll = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected.');

        // 1. STUDENTS
        console.log('\n🛠️  FIXING STUDENTS...');
        const students = await Student.find({});
        for (const s of students) {
            const newYear = cleanYear(s.year);
            const newSec = cleanSection(s.section);
            if (s.year !== newYear || s.section !== newSec) {
                console.log(`   Updating Student ${s.sid}: [Y:${s.year} S:${s.section}] -> [Y:${newYear} S:${newSec}]`);
                await Student.updateOne({ _id: s._id }, { year: newYear, section: newSec });
            }
        }

        // 2. FACULTY ASSIGNMENTS
        console.log('\n🛠️  FIXING FACULTY ASSIGNMENTS...');
        const faculties = await Faculty.find({});
        for (const f of faculties) {
            let changed = false;
            if (f.assignments && Array.isArray(f.assignments)) {
                f.assignments.forEach(a => {
                    const ny = cleanYear(a.year);
                    const ns = cleanSection(a.section);
                    if (a.year !== ny || a.section !== ns) {
                        console.log(`   Updating Faculty ${f.name} Assign: [Y:${a.year} S:${a.section}] -> [Y:${ny} S:${ns}]`);
                        a.year = ny;
                        a.section = ns;
                        changed = true;
                    }
                });
                if (changed) {
                    await Faculty.updateOne({ _id: f._id }, { assignments: f.assignments });
                }
            }
        }

        // 3. ATTENDANCE
        console.log('\n🛠️  FIXING ATTENDANCE...');
        const att = await Attendance.find({});
        for (const a of att) {
            const ny = cleanYear(a.year);
            const ns = cleanSection(a.section);
            if (a.year !== ny || a.section !== ns) {
                console.log(`   Updating Attendance ${a._id}: [Y:${a.year} S:${a.section}] -> [Y:${ny} S:${ns}]`);
                await Attendance.updateOne({ _id: a._id }, { year: ny, section: ns });
            }
        }

        // 4. SCHEDULE
        console.log('\n🛠️  FIXING SCHEDULES...');
        const sched = await Schedule.find({});
        for (const s of sched) {
            const ny = cleanYear(s.year);
            const ns = cleanSection(s.section);
            if (s.year !== ny || s.section !== ns) {
                console.log(`   Updating Schedule ${s._id}: [Y:${s.year} S:${s.section}] -> [Y:${ny} S:${ns}]`);
                await Schedule.updateOne({ _id: s._id }, { year: ny, section: ns });
            }
        }

        // 5. EXAMS
        console.log('\n🛠️  FIXING EXAMS...');
        const exams = await Exam.find({});
        for (const e of exams) {
            const ny = cleanYear(e.year);
            const ns = cleanSection(e.section);
            if (e.year !== ny || e.section !== ns) {
                console.log(`   Updating Exam ${e._id}: [Y:${e.year} S:${e.section}] -> [Y:${ny} S:${ns}]`);
                await Exam.updateOne({ _id: e._id }, { year: ny, section: ns });
            }
        }

        // 6. MATERIALS
        console.log('\n🛠️  FIXING MATERIALS...');
        const materials = await Material.find({});
        for (const m of materials) {
            const ny = cleanYear(m.year);
            const ns = cleanSection(m.section);
            if (m.year !== ny || m.section !== ns) {
                console.log(`   Updating Material ${m._id}: [Y:${m.year} S:${m.section}] -> [Y:${ny} S:${ns}]`);
                await Material.updateOne({ _id: m._id }, { year: ny, section: ns });
            }
        }

        // 7. ASSIGNMENTS
        console.log('\n🛠️  FIXING ASSIGNMENTS...');
        const assignments = await Assignment.find({});
        for (const a of assignments) {
            const ny = cleanYear(a.year);
            const ns = cleanSection(a.section);
            if (a.year !== ny || a.section !== ns) {
                console.log(`   Updating Assignment ${a._id}: [Y:${a.year} S:${a.section}] -> [Y:${ny} S:${ns}]`);
                await Assignment.updateOne({ _id: a._id }, { year: ny, section: ns });
            }
        }

        // 8. COURSES
        console.log('\n🛠️  FIXING COURSES...');
        const courses = await Course.find({});
        for (const c of courses) {
            const ny = cleanYear(c.year);
            const ns = cleanSection(c.section);
            if (c.year !== ny || c.section !== ns) {
                console.log(`   Updating Course ${c.name}: [Y:${c.year} S:${c.section}] -> [Y:${ny} S:${ns}]`);
                await Course.updateOne({ _id: c._id }, { year: ny, section: ns });
            }
        }

        // 9. MESSAGES
        console.log('\n🛠️  FIXING MESSAGES...');
        const messages = await Message.find({});
        for (const m of messages) {
            let changed = false;
            const ny = cleanYear(m.targetYear);
            if (m.targetYear !== ny) {
                m.targetYear = ny;
                changed = true;
            }
            if (m.targetSections && Array.isArray(m.targetSections)) {
                const ns = m.targetSections.map(s => cleanSection(s));
                if (JSON.stringify(m.targetSections) !== JSON.stringify(ns)) {
                    m.targetSections = ns;
                    changed = true;
                }
            }
            if (changed) {
                console.log(`   Updating Message ${m._id}`);
                await Message.updateOne({ _id: m._id }, { targetYear: m.targetYear, targetSections: m.targetSections });
            }
        }

        // 10. MARKS
        console.log('\n🛠️  FIXING MARKS...');
        const marks = await Mark.find({});
        for (const mk of marks) {
            const ny = cleanYear(mk.academicYear);
            if (mk.academicYear !== ny) {
                console.log(`   Updating Mark ${mk._id}: ${mk.academicYear} -> ${ny}`);
                await Mark.updateOne({ _id: mk._id }, { academicYear: ny });
            }
        }

        console.log('\n🎉 ALL DATA REPAIR COMPLETE.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
};

fixAll();
