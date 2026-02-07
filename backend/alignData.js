const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Faculty = require('./models/Faculty');
const Student = require('./models/Student');

dotenv.config();

const alignData = async () => {
    try {
        console.log('🔌 Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected.');

        // 1. UPDATE STUDENT (Target: raju@vignan.edu or First Student)
        console.log('\n--- ALIGNING STUDENT ---');
        let student = await Student.findOne({ email: 'raju@vignan.edu' });
        if (!student) {
            console.log('User "raju" not found. Picking first student...');
            student = await Student.findOne({});
        }

        if (student) {
            console.log(`Found Student: ${student.name} (ID: ${student.sid})`);
            console.log(`Old Data: Year=${student.year}, Section=${student.section}, Branch=${student.branch}`);

            // FORCE UPDATE TO STANDARD
            student.year = '1';
            student.section = 'A';
            student.branch = 'CSE';
            await student.save();
            console.log(`✅ Updated to: Year=1, Section=A, Branch=CSE`);
        } else {
            console.log('⚠️ No students found in database!');
        }

        // 2. UPDATE FACULTY (Target: First Faculty)
        console.log('\n--- ALIGNING FACULTY ---');
        const faculty = await Faculty.findOne({});
        if (faculty) {
            console.log(`Found Faculty: ${faculty.name}`);

            // Check if already has assignment
            const hasAssign = faculty.assignments.some(a => a.year === '1' && a.section === 'A');

            if (!hasAssign) {
                console.log('Adding Assignment for Year 1, Section A...');
                faculty.assignments.push({
                    year: '1',
                    section: 'A',
                    branch: 'CSE',
                    subject: 'System Architecture (Forced)',
                    semester: '1'
                });
                await faculty.save();
                console.log(`✅ Added Assignment: Year=1, Section=A, Branch=CSE`);
            } else {
                console.log('✅ Faculty already assigned to Year 1, Section A.');
            }
        } else {
            console.log('⚠️ No faculty found in database!');
        }

        console.log('\n🎉 DATA ALIGNED. PLEASE REFRESH DASHBOARD.');
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

alignData();
