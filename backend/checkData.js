const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Faculty = require('./models/Faculty');
const Student = require('./models/Student');

// Load env vars
dotenv.config();

const checkData = async () => {
    try {
        console.log('🔌 Connecting...');
        await mongoose.connect(process.env.MONGO_URI);

        console.log('\n--- STUDENTS ---');
        const students = await Student.find({});
        const studentYears = [...new Set(students.map(s => s.year))];
        const studentSections = [...new Set(students.map(s => s.section))];
        const studentBranches = [...new Set(students.map(s => s.branch))];

        console.log('Unique Years:', studentYears);
        console.log('Unique Sections:', studentSections);
        console.log('Unique Branches:', studentBranches);
        console.log(`Total Students: ${students.length}`);

        console.log('\n--- FACULTY ASSIGNMENTS ---');
        const faculty = await Faculty.find({});
        const assigns = faculty.flatMap(f => f.assignments || []);

        const facYears = [...new Set(assigns.map(a => a.year))];
        const facSections = [...new Set(assigns.map(a => a.section))];
        const facBranches = [...new Set(assigns.map(a => a.branch))];

        console.log('Unique Years:', facYears);
        console.log('Unique Sections:', facSections);
        console.log('Unique Branches:', facBranches);
        console.log(`Total Assignments: ${assigns.length}`);

        // Check for "CSE" vs "Computer Science"
        const cseStudents = students.filter(s => s.branch === 'CSE').length;
        const cseAssigns = assigns.filter(a => a.branch === 'CSE').length;
        console.log(`\nCSE Students: ${cseStudents} vs CSE Assignments: ${cseAssigns}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkData();
