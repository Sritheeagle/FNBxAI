const mongoose = require('mongoose');
const Faculty = require('./models/Faculty');
const Course = require('./models/Course');
const Schedule = require('./models/Schedule');
const fs = require('fs');

// Use the SAME URI as server.js
const uri = 'mongodb+srv://FNBXAI_db_user:1JlyINjrx54rhf9P@cluster0.kdss6af.mongodb.net/friendly_notebook?appName=Cluster0';

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB Atlas (Cloud)');
    resetDatabase();
}).catch(err => {
    console.error('❌ Connection Error:', err);
    process.exit(1);
});

async function resetDatabase() {
    console.log('\n========================================');
    console.log('🧹 DATABASE CLEANUP & RESET');
    console.log('========================================\n');

    try {
        // 1. Backup existing data
        const faculty = await Faculty.find({});
        const courses = await Course.find({});
        const schedule = await Schedule.find({});
        const backup = { faculty, courses, schedule, timestamp: new Date() };
        fs.writeFileSync('database-backup-before-reset.json', JSON.stringify(backup, null, 2));
        console.log(`📦 Backup created: database-backup-before-reset.json`);

        // 2. Delete All Faculty
        console.log('🗑️  Deleting all faculty...');
        const fResult = await Faculty.deleteMany({});
        console.log(`   ✅ Removed ${fResult.deletedCount} faculty records.`);

        // 3. Delete All Courses
        console.log('🗑️  Deleting all courses...');
        const cResult = await Course.deleteMany({});
        console.log(`   ✅ Removed ${cResult.deletedCount} course records.`);

        // 4. Delete All Schedules
        console.log('🗑️  Deleting all schedules...');
        const sResult = await Schedule.deleteMany({});
        console.log(`   ✅ Removed ${sResult.deletedCount} schedule records.`);

        // 5. Add Fresh Test Data
        console.log('\n✨ Adding fresh clean test data...');
        await seedData();

        console.log('\n========================================');
        console.log('✅ DATABASE RESET COMPLETE');
        console.log('========================================');

    } catch (error) {
        console.error('❌ Error during reset:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}

async function seedData() {
    console.log('🌱 Seeding fresh test data...');

    // 1. Add Faculty
    const drSmith = new Faculty({
        facultyId: 'FAC001',
        name: 'Dr. John Smith',
        email: 'john.smith@college.edu',
        password: 'password123',
        department: 'CSE',
        assignments: [
            { subject: 'Python Programming', year: '1', section: 'A', branch: 'CSE' },
            { subject: 'Data Structures', year: '1', section: 'A', branch: 'CSE' }
        ]
    });
    await drSmith.save();
    console.log('   ✅ Added Faculty: Dr. John Smith (FAC001)');

    const drSarah = new Faculty({
        facultyId: 'FAC002',
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@college.edu',
        password: 'password123',
        department: 'CSE',
        assignments: [
            { subject: 'Web Technologies', year: '1', section: 'A', branch: 'CSE' }
        ]
    });
    await drSarah.save();
    console.log('   ✅ Added Faculty: Dr. Sarah Johnson (FAC002)');

    // 2. Add Courses
    const courses = [
        { name: 'Python Programming', code: 'PY-101', year: '1', semester: '1', branch: 'CSE', section: 'All' },
        { name: 'Data Structures', code: 'DS-102', year: '1', semester: '1', branch: 'CSE', section: 'All' },
        { name: 'Web Technologies', code: 'WT-103', year: '1', semester: '2', branch: 'CSE', section: 'All' }
    ];

    for (const c of courses) {
        await new Course(c).save();
        console.log(`   ✅ Added Course: ${c.name} (${c.code})`);
    }

    // 3. Add Schedule
    const schedule = [
        { day: 'Monday', time: '09:00 - 10:00', subject: 'Python Programming', faculty: 'Dr. John Smith', room: 'LH-101', type: 'Theory', year: 1, section: 'A', branch: 'CSE', semester: 1 },
        { day: 'Monday', time: '10:00 - 11:00', subject: 'Data Structures', faculty: 'Dr. John Smith', room: 'LH-101', type: 'Theory', year: 1, section: 'A', branch: 'CSE', semester: 1 },
        { day: 'Tuesday', time: '09:00 - 10:00', subject: 'Web Technologies', faculty: 'Dr. Sarah Johnson', room: 'LH-102', type: 'Theory', year: 1, section: 'A', branch: 'CSE', semester: 1 },
        { day: 'Wednesday', time: '11:00 - 12:00', subject: 'Python Programming', faculty: 'Dr. John Smith', room: 'LH-101', type: 'Theory', year: 1, section: 'A', branch: 'CSE', semester: 1 }
    ];

    for (const s of schedule) {
        await new Schedule(s).save();
        console.log(`   ✅ Added Schedule: ${s.day} ${s.time} - ${s.subject}`);
    }

    console.log('\n✅ Seed complete! You can now login as Student (Year 1, CSE) and check Schedule.');
}
