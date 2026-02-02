const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Models
const Student = require('./models/Student');
const Faculty = require('./models/Faculty');
const Admin = require('./models/Admin');
const Mark = require('./models/Mark');
const Attendance = require('./models/Attendance');
const Course = require('./models/Course');
const Schedule = require('./models/Schedule');
const { StudentKnowledge } = require('./models/AIModels');

// --- DATA ---

const admins = [
    {
        adminId: 'ADMIN001',
        name: 'System Administrator',
        password: 'admin123', // Will be hashed
        role: 'admin'
    },
    {
        adminId: 'Bobbymartin@09',
        name: 'Bobby Martin (Head Admin)',
        password: 'papa@reddy', // Will be hashed
        role: 'admin'
    }
];

const faculties = [
    {
        facultyId: 'FAC001',
        name: 'Dr. Alan Turing',
        email: 'alan@vignan.edu',
        password: 'faculty123',
        department: 'CSE',
        assignments: [
            { year: 1, section: 'A', subject: 'Computers' },
            { year: 2, section: 'A', subject: 'Algorithms' }
        ]
    },
    {
        facultyId: 'FAC002',
        name: 'Prof. Grace Hopper',
        email: 'grace@vignan.edu',
        password: 'faculty123',
        department: 'CSE',
        assignments: [
            { year: 1, section: 'A', subject: 'Python' },
            { year: 3, section: 'B', subject: 'Compiler Design' }
        ]
    }
];

const students = [
    {
        sid: 'STU001',
        name: 'Raju B',
        email: 'raju@student.edu',
        password: 'student123',
        branch: 'CSE',
        year: 1,
        section: 'A'
    },
    {
        sid: 'STU002',
        name: 'Anita Sharma',
        email: 'anita@student.edu',
        password: 'student123',
        branch: 'CSE',
        year: 1,
        section: 'A'
    },
    {
        sid: 'STU003',
        name: 'John Doe',
        email: 'john@student.edu',
        password: 'student123',
        branch: 'CSE',
        year: 2,
        section: 'B'
    },
    {
        sid: '211FA04117',
        name: 'Vignan Student',
        email: '211fa04117@vignan.edu',
        password: 'vignan123',
        branch: 'CSE',
        year: 4,
        section: 'A'
    }
];

const subjects = ['Python', 'Computers', 'Mathematics', 'Physics'];

// --- SEED FUNCTION ---

const seedSystem = async () => {
    try {
        console.log('🌱 Starting Full System Seed...');

        // Connect (Try Local if Cloud fails, matching config logic roughly)
        try {
            await mongoose.connect(process.env.MONGO_URI);
            console.log('✅ Connected to MongoDB');
        } catch (err) {
            console.log('⚠️ Cloud failed, trying local...');
            await mongoose.connect('mongodb://127.0.0.1:27017/friendly_notebook');
            console.log('✅ Connected to Local MongoDB');
        }

        // 1. Clear Existing (Optional - maybe safer to upsert, but for a "fix it" request, clean slate is often better for demo)
        // actually, let's upsert to preserve anything good, or just nuking it ensures "it works"
        // Let's Nuke relevant collections to ensure clean Dashboard.
        await Admin.deleteMany({});
        await Faculty.deleteMany({});
        await Student.deleteMany({});
        await Mark.deleteMany({});
        await Attendance.deleteMany({});
        await Schedule.deleteMany({});
        console.log('🧹 Cleared old data (Admins, Faculty, Students, Marks, Attendance, Schedule)');

        // 2. Admins
        for (const a of admins) {
            const salt = await bcrypt.genSalt(10);
            a.password = await bcrypt.hash(a.password, salt);
            await Admin.create(a);
        }
        console.log(`👤 Seeded ${admins.length} Admins`);

        // 3. Faculty
        for (const f of faculties) {
            const salt = await bcrypt.genSalt(10);
            f.password = await bcrypt.hash(f.password, salt);
            await Faculty.create(f);
        }
        console.log(`🎓 Seeded ${faculties.length} Faculty`);

        // 4. Students
        const createdStudents = [];
        for (const s of students) {
            const salt = await bcrypt.genSalt(10);
            s.password = await bcrypt.hash(s.password, salt);
            const newS = await Student.create(s);
            createdStudents.push(newS);
        }
        console.log(`🎒 Seeded ${students.length} Students`);

        // 5. Marks & Attendance (Generate Random Data for Dashboards)
        const marksData = [];
        const attendanceData = [];

        for (const stu of createdStudents) {
            for (const sub of subjects) {
                // Marks
                marksData.push({
                    studentId: stu.sid,
                    subject: sub,
                    examType: 'cla1',
                    marksObtained: Math.floor(Math.random() * 10) + 10, // 10-20
                    maxMarks: 20,
                    semester: 1,
                    academicYear: '2025-26'
                });
                marksData.push({
                    studentId: stu.sid,
                    subject: sub,
                    examType: 'mid1',
                    marksObtained: Math.floor(Math.random() * 20) + 10, // 10-30
                    maxMarks: 30,
                    semester: 1,
                    academicYear: '2025-26'
                });

                // Attendance (Last 10 days)
                for (let i = 0; i < 10; i++) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    attendanceData.push({
                        studentId: stu.sid,
                        date: d,
                        subject: sub,
                        status: Math.random() > 0.2 ? 'Present' : 'Absent',
                        period: 1,
                        year: stu.year,
                        section: stu.section
                    });
                }
            }
        }
        await Mark.insertMany(marksData);
        await Attendance.insertMany(attendanceData);
        console.log(`📊 Seeded ${marksData.length} Marks and ${attendanceData.length} Attendance records`);

        // 6. Schedule
        const scheduleItems = [
            { day: 'Monday', time: '09:00 - 10:00', subject: 'Python', room: 'Lab 1', faculty: 'Prof. Grace Hopper', year: 1, section: 'A' },
            { day: 'Monday', time: '10:00 - 11:00', subject: 'Computers', room: 'Class 101', faculty: 'Dr. Alan Turing', year: 1, section: 'A' },
            { day: 'Tuesday', time: '09:00 - 10:00', subject: 'Mathematics', room: 'Class 102', faculty: 'Math Dept', year: 1, section: 'A' },
            { day: 'Wednesday', time: '11:00 - 12:00', subject: 'Physics', room: 'Lab 2', faculty: 'Physics Dept', year: 1, section: 'A' }
        ];
        await Schedule.insertMany(scheduleItems);
        console.log(`📅 Seeded Schedule`);

        console.log('✅ FULL SYSTEM SEED COMPLETE');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seed Failed:', error);
        process.exit(1);
    }
};

seedSystem();
