const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { syncStudentProfileFile } = require('./studentFeatureController');
const sse = require('../sse');

// Helper to create user folder
const createUserFolder = (role, id) => {
    const baseDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);

    const roleDir = path.join(baseDir, role === 'student' ? 'students' : role === 'admin' ? 'admin' : 'faculty');
    if (!fs.existsSync(roleDir)) fs.mkdirSync(roleDir);

    const userDir = path.join(roleDir, id.toString());
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir);
    }

    // Create subfolders based on role
    if (role === 'student') {
        const subfolders = ['notes', 'videos', 'model_papers', 'exams', 'results'];
        subfolders.forEach(sub => {
            const subPath = path.join(userDir, sub);
            if (!fs.existsSync(subPath)) fs.mkdirSync(subPath);
        });
    } else if (role === 'faculty') {
        const subfolders = ['materials', 'assignments', 'exams', 'personal_notes'];
        subfolders.forEach(sub => {
            const subPath = path.join(userDir, sub);
            if (!fs.existsSync(subPath)) fs.mkdirSync(subPath);
        });
    }

    return userDir;
};

// Helper for Smart Password Check & Self-Healing
const checkAndHealPassword = async (user, inputPassword) => {
    let isMatch = false;
    let isPlainText = false;

    // 1. Try Bcrypt Key
    try {
        isMatch = await bcrypt.compare(inputPassword, user.password);
    } catch (e) {
        // user.password is likely not a valid hash (legacy/manual entry)
        isPlainText = true;
    }

    // 2. If Failed or Invalid Hash, try Plain Text
    if (!isMatch) {
        if (inputPassword === user.password) {
            isMatch = true;
            isPlainText = true;
        }
    }

    // 3. If Match found via Plain Text, Self-Heal (Hash it)
    if (isMatch && isPlainText) {
        try {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(inputPassword, salt);
            await user.save();
            console.log(`Self-healed password for user ${user.sid || user.facultyId || user.adminId}`);
        } catch (err) { console.error("Self-heal fail", err); }
    }

    return isMatch;
};

// ADMIN LOGIN (Database Backed)
exports.adminLogin = async (req, res) => {
    const { adminId, password } = req.body;

    try {
        let admin = await Admin.findOne({ adminId });

        // Auto-seed (First Run / Recovery / Requested Update)
        const targetAdminId = 'Bobbymartin@09';
        const targetPass = 'papa@reddy';

        // If the user tries to login with the specific requested credentials, but doesn't exist yet, Create/Seed them.
        if (!admin && adminId === targetAdminId && password === targetPass) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const folderPath = createUserFolder('admin', adminId);

            admin = new Admin({
                adminId: targetAdminId,
                name: 'Administrator',
                password: hashedPassword,
                folderPath
            });
            await admin.save();
            console.log("Admin seeded successfully with new credentials");
        }

        // Original Seed Logic (Keep fallback just in case)
        if (!admin && adminId === 'bobbymartin' && (password === 'martin@FNB1' || password === 'bobbymartin@' || password === '123456')) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const folderPath = createUserFolder('admin', adminId);

            admin = new Admin({
                adminId,
                name: 'Administrator',
                password: hashedPassword,
                folderPath
            });
            await admin.save();
            console.log("Admin seeded successfully");
        }

        if (!admin) return res.status(401).json({ error: 'Invalid Admin Credentials' });

        const isMatch = await checkAndHealPassword(admin, password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid Admin Credentials' });

        // Ensure folder exists
        if (!fs.existsSync(admin.folderPath || path.join(__dirname, '../uploads/admin', adminId))) {
            createUserFolder('admin', adminId);
        }

        const token = jwt.sign({ role: 'admin', id: admin.adminId }, process.env.JWT_SECRET, { expiresIn: '1d' });
        return res.json({ token, role: 'admin', message: 'Admin login successful' });

    } catch (err) {
        console.error("Admin Login Error:", err);
        res.status(500).json({ error: 'Server Error during Admin Login' });
    }
};

// STUDENT REGISTER (By Admin or Self)
exports.registerStudent = async (req, res) => {
    try {
        const { sid, name, email, password, year, branch, section } = req.body;

        const existing = await Student.findOne({ sid });
        if (existing) return res.status(400).json({ error: 'Student ID already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const folderPath = createUserFolder('student', sid);

        const newStudent = new Student({
            sid, name, email, password: hashedPassword, year, branch, section, folderPath
        });

        await newStudent.save();
        await syncStudentProfileFile(sid);

        // Broadcast Update
        sse.broadcast('students', { action: 'create', data: newStudent });

        const token = jwt.sign({ role: 'student', id: newStudent.sid }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({ message: 'Student registered successfully', token });
    } catch (error) {
        console.error("Registration Error:", error);
        if (error.code === 11000) return res.status(400).json({ error: 'ID already exists' });
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// FACULTY REGISTER (By Admin)
exports.registerFaculty = async (req, res) => {
    try {
        const { facultyId, name, email, password, department } = req.body;

        const existing = await Faculty.findOne({ facultyId });
        if (existing) return res.status(400).json({ error: 'Faculty ID already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const folderPath = createUserFolder('faculty', facultyId);

        const newFaculty = new Faculty({
            facultyId, name, email, password: hashedPassword, department, folderPath
        });

        await newFaculty.save();

        // Broadcast Update
        sse.broadcast('faculty', { action: 'create', data: newFaculty });

        res.status(201).json({ message: 'Faculty Registered Successfully', faculty: newFaculty });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error during faculty registration' });
    }
};

// STUDENT LOGIN
exports.studentLogin = async (req, res) => {
    try {
        const { sid, password } = req.body;
        // Accept sid param as 'email' logic if needed, but primary is sid
        const student = await Student.findOne({ sid });
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const isMatch = await checkAndHealPassword(student, password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ role: 'student', id: student.sid }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, role: 'student', studentData: student });

    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
};

// FACULTY LOGIN
exports.facultyLogin = async (req, res) => {
    try {
        const { facultyId, password } = req.body;
        const faculty = await Faculty.findOne({ facultyId });
        if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

        const isMatch = await checkAndHealPassword(faculty, password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

        const token = jwt.sign({ role: 'faculty', id: faculty.facultyId }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, role: 'faculty', facultyData: faculty });

    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
};
