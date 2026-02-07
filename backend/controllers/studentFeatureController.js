const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Mark = require('../models/Mark');
const Faculty = require('../models/Faculty'); // Added for absentee lookup
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const sse = require('../sse');
const ActiveSession = require('../models/ActiveSession'); // OTP Model

// Helper: Get Student Folder Path
const getStudentFolder = (sid) => {
    return path.join(__dirname, '../uploads/students', sid);
};

// Helper: Write/Update JSON File in Student Folder
const updateStudentFile = (sid, filename, data) => {
    try {
        const folder = getStudentFolder(sid);
        if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

        const filePath = path.join(folder, filename);
        let existingData = [];

        // If file exists and we are appending/updating list-based data
        if (Array.isArray(data)) {
            // Overwrite lists completely (e.g., full attendance refresh) or append?
            // Strategy: We will read, merge/update, write.
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf8');
                try { existingData = JSON.parse(content); } catch (e) { }
            }
            if (!Array.isArray(existingData)) existingData = [];

            // Allow caller to handle merging, but for now, we'll just overwrite with the passed data
            // assuming the controller fetches all data first.
            // ACTUALLY, simpler request: "save that student details...". 
            // We will write the specific object passed.
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        } else {
            // Object (like profile) - simple overwrite
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        }

    } catch (err) {
        console.error(`Failed to update file ${filename} for student ${sid}:`, err);
    }
};

// --- ATTENDANCE ---
exports.markAttendance = async (req, res) => {
    // Determine if it's a bulk update (array) or single record
    // Frontend sends payload: { date, subject, year, section, records: [ { studentId, status } ] }
    if (req.body.records && Array.isArray(req.body.records)) {
        return exports.markBulkAttendance(req, res);
    }

    // Default Single Mark
    const { studentId, date, subject, status, recordedBy, period = 1 } = req.body;

    try {
        // 1. Save to DB
        const update = { status, recordedBy, period, subject };
        const record = await Attendance.findOneAndUpdate(
            { studentId, date, period },
            update,
            { upsert: true, new: true }
        );

        // 2. Update Student Folder File (Full attendance history for this student)
        // Fetch all attendance for this student to keep file in sync
        const fullHistory = await Attendance.find({ studentId }).sort({ date: -1 });
        updateStudentFile(studentId, 'attendance_record.json', fullHistory);

        // Notify clients for immediate update
        sse.broadcast({ resource: 'attendance', action: 'update', data: record });

        res.json(record);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.markBulkAttendance = async (req, res) => {
    let { date, subject, year, section, facultyName, records, period = 1 } = req.body;
    year = String(year || '').replace(/[^0-9]/g, '');
    section = String(section || '').replace(/Section\s*/i, '').trim().toUpperCase();
    try {
        const results = [];
        for (const r of records) {
            const update = { status: r.status, recordedBy: facultyName || 'Faculty', period, year, section, subject };
            const record = await Attendance.findOneAndUpdate(
                { studentId: r.studentId, date, period },
                update,
                { upsert: true, new: true }
            );
            results.push(record);
        }

        // Background Sync unique students
        const uniqueStudents = [...new Set(records.map(r => r.studentId))];
        uniqueStudents.forEach(async (sid) => {
            try {
                const fullHistory = await Attendance.find({ studentId: sid }).sort({ date: -1 });
                updateStudentFile(sid, 'attendance_record.json', fullHistory);
            } catch (e) { console.error(`Failed to sync history for ${sid}`, e); }
        });

        res.json({ message: 'Attendance marked', count: results.length });

        // Notify clients for immediate update
        sse.broadcast({ resource: 'attendance', action: 'update', metadata: { subject, year, section, date } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.batchUpdateAttendance = async (req, res) => {
    const { date, period, year, section, branch, subject, status = 'Present' } = req.body;
    try {
        if (!date || !period || !year || !section) {
            return res.status(400).json({ error: 'Date, period, year and section are required' });
        }

        // 1. Find all students in this section
        const query = { year, section };
        if (branch) query.branch = branch;
        const students = await Student.find(query).select('sid');

        if (students.length === 0) {
            return res.json({ message: 'No students found in this section', count: 0 });
        }

        const results = [];
        for (const s of students) {
            const update = {
                status,
                recordedBy: 'Admin (Batch)',
                period,
                year,
                section,
                branch,
                subject: subject || 'General'
            };

            const record = await Attendance.findOneAndUpdate(
                { studentId: s.sid, date, period },
                update,
                { upsert: true, new: true }
            );
            results.push(record);

            // Sync student file in background
            (async () => {
                try {
                    const fullHistory = await Attendance.find({ studentId: s.sid }).sort({ date: -1 });
                    updateStudentFile(s.sid, 'attendance_record.json', fullHistory);
                } catch (e) { }
            })();
        }

        // Notify via SSE
        sse.broadcast({ resource: 'attendance', action: 'batch-update', metadata: { date, period, year, section } });

        res.json({ message: `Successfully marked ${results.length} students as ${status}`, count: results.length });
    } catch (err) {
        console.error("Batch Attendance Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.getBulkAttendance = async (req, res) => {
    try {
        let { date, year, section, subject, period } = req.query;
        year = year ? String(year).replace(/[^0-9]/g, '') : year;
        section = section ? String(section).replace(/Section\s*/i, '').trim().toUpperCase() : section;
        // If date is provided, return status for that specific day
        if (date) {
            const query = { date };
            if (subject) query.subject = subject;
            if (year) query.year = year;
            if (section) query.section = section;
            if (period) query.period = period;

            const records = await Attendance.find(query);

            const wrapped = [{
                date,
                subject,
                year,
                section,
                period,
                records: records.map(r => ({ studentId: r.studentId, status: r.status }))
            }];

            return res.json(wrapped);
        }

        // If no date, maybe return history?
        // Frontend fetchHistory called without date query sometimes?
        // `apiGet(/api/attendance/all?year=...&section=...&subject=...)`

        const query = { subject };
        if (year) query.year = year;
        if (section) query.section = section;

        const allRecords = await Attendance.find(query).sort({ date: -1 });

        // Group by Date
        const grouped = {};
        allRecords.forEach(r => {
            const d = r.date ? r.date.toISOString().split('T')[0] : 'Unknown';
            if (!grouped[d]) {
                grouped[d] = {
                    date: d,
                    subject: r.subject,
                    section: r.section,
                    records: []
                };
            }
            grouped[d].records.push({ studentId: r.studentId, status: r.status });
        });

        res.json(Object.values(grouped));

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStudentAttendance = async (req, res) => {
    try {
        const history = await Attendance.find({ studentId: req.params.id }).sort({ date: -1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- MARKS ---
exports.addMark = async (req, res) => {
    const { studentId, examType, subject, marksObtained, maxMarks, semester, remarks } = req.body;

    try {
        // 1. Save to DB
        const result = await Mark.findOneAndUpdate(
            { studentId, examType, subject },
            { marksObtained, maxMarks, semester, remarks },
            { upsert: true, new: true }
        );

        // 2. Update Student Folder File
        const fullMarks = await Mark.find({ studentId }).sort({ semester: 1, subject: 1 });
        updateStudentFile(studentId, 'academic_marks.json', fullMarks);

        // Notify clients for immediate update
        sse.broadcast({ resource: 'marks', action: 'update', data: result });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.bulkSaveMarks = async (req, res) => {
    // Expects: { marks: [ { studentId, subject, assessmentType, marks, year, section } ] }
    const { marks } = req.body;
    try {
        if (!marks || !Array.isArray(marks)) return res.status(400).json({ error: 'Invalid payload' });

        const results = [];
        for (const m of marks) {
            // Map frontend 'assessmentType' to backend 'examType'
            // Map frontend 'marks' to 'marksObtained'
            // Default max marks? Maybe we can infer or leave it generic (e.g., 100 or 20/10 based on type)
            // Ideally frontend sends maxMarks or we lookup config.
            // For now, let's assume 'maxMarks' is not strictly enforced or we set a default.

            // Note: FacultyMarks.jsx has `max` in `assessmentStructure`. It doesn't seem to send `maxMarks` in bulk-save payload.
            // We'll set a reasonable default or 0 if unknown.
            let max = 100;
            if (m.assessmentType.startsWith('cla')) max = 20;
            if (m.assessmentType.includes('t')) max = 10;

            const update = {
                marksObtained: m.marks,
                maxMarks: max,
                academicYear: m.year,
                // store section if we add field to schema, otherwise ignore
            };

            const result = await Mark.findOneAndUpdate(
                { studentId: m.studentId, examType: m.assessmentType, subject: m.subject },
                update,
                { upsert: true, new: true }
            );
            results.push(result);
        }

        // Background Sync unique students
        const uniqueStudents = [...new Set(marks.map(m => m.studentId))];
        uniqueStudents.forEach(async (sid) => {
            try {
                const fullMarks = await Mark.find({ studentId: sid }).sort({ academicYear: 1, subject: 1 });
                updateStudentFile(sid, 'academic_marks.json', fullMarks);
            } catch (e) { console.error(`Failed to sync marks for ${sid}`, e); }
        });

        // Notify clients for immediate update
        sse.broadcast('marks', { action: 'bulk-update', count: results.length });

        res.json({ success: true, modified: results.length });
    } catch (err) {
        console.error("Bulk Save Marks Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.getAllSubjectMarks = async (req, res) => {
    try {
        const { subject } = req.params;
        // Fetch all marks for this subject
        // Optionally filter by year/section if valid query params existed? 
        // Logic in FacultyMarks.jsx just calls /api/marks/${subject}/all

        // Return flat list: [{ studentId, assessmentType, marks }]
        // Backend stores: examType, marksObtained

        const marks = await Mark.find({ subject });

        // remap to frontend expectations
        // frontend expects: { studentId, assessmentType, marks }
        const mapped = marks.map(m => ({
            studentId: m.studentId,
            assessmentType: m.examType,
            marks: m.marksObtained,
            sid: m.studentId
        }));

        res.json(mapped);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStudentMarks = async (req, res) => {
    try {
        const marks = await Mark.find({ studentId: req.params.id });
        res.json(marks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStudentOverview = async (req, res) => {
    try {
        const sid = req.params.id;
        let student = await Student.findOne({ sid }).select('-password');

        // Data Containers
        const attDetails = {};
        const acaDetails = {};
        let marksRecords = [];
        let classmates = [];

        // Fallback for empty/local DB: Create a temporary mock in-memory
        if (!student) {
            console.warn(`⚠️ Student ${sid} not found. Sending mock profile for dashboard visualization.`);
            student = {
                sid: sid,
                name: "Student (Demo)",
                branch: "CSE",
                year: 1,
                section: "A",
                email: `${sid}@example.com`,
                role: "student"
            };

            // Mock Data for Demo Visualization
            const subjects = ['Python', 'Computers', 'Mathematics', 'Physics'];
            subjects.forEach(sub => {
                attDetails[sub] = {
                    totalClasses: 20,
                    totalPresent: 18,
                    totalAbsent: 2,
                    percentage: 90
                };
                acaDetails[sub] = {
                    percentage: 85,
                    categorized: {
                        cla: { 'cla1': 18 },
                        module1: { 'm1t1': 9 },
                        module2: { 'm2t1': 8 }
                    }
                };
            });
        } else {
            // Real Data Fetching
            const Course = require('../models/Course'); // Ensure Course model is loaded

            // 0. Fetch All Enrolled Courses (Standard + Dynamic) to initialize empty states
            // IMPORTANT: Exclude hidden/deleted courses
            const sYear = String(student.year || '').replace(/[^0-9]/g, '');
            const sSec = String(student.section || '').replace(/Section\s*/i, '').trim().toUpperCase();

            const enrolledCourses = await Course.find({
                $and: [
                    { year: { $in: [sYear, parseInt(sYear), 'All'] } },
                    {
                        $or: [
                            { branch: student.branch },
                            { branch: 'All' },
                            { branch: { $regex: new RegExp(`^${student.branch}$`, 'i') } }
                        ]
                    },
                    {
                        $or: [
                            { section: sSec },
                            { section: 'All' },
                            { section: { $regex: new RegExp(`^${sSec}$`, 'i') } }
                        ]
                    },
                    { isHidden: { $ne: true } },  // Exclude deleted/hidden courses
                    { status: { $ne: 'Inactive' } } // Exclude inactive courses
                ]
            });

            // Initialize details for ALL enrolled courses (even if no records exist yet)
            enrolledCourses.forEach(c => {
                attDetails[c.name] = { totalClasses: 0, totalPresent: 0, totalAbsent: 0, percentage: 0 };
                acaDetails[c.name] = { percentage: 0, categorized: { cla: {}, module1: {}, module2: {} } };
            });

            // 1. Attendance (Overlay actual data)
            const attendanceRecords = await Attendance.find({ studentId: sid });
            attendanceRecords.forEach(rec => {
                // Determine Subject Name (Handle loosely or precise)
                // If subject not in enrolled list (legacy?), add it.
                // Note: rec.subject might be "Computer Networks" while course.name is "Computer Networks". Case matching?
                // Let's rely on exact string match for now, or fallback close match if needed.

                let subjName = rec.subject;
                // Try to match with existing keys case-insensitively if direct match missing
                if (!attDetails[subjName]) {
                    const match = Object.keys(attDetails).find(k => k.toLowerCase() === subjName.toLowerCase());
                    if (match) subjName = match;
                    else {
                        // Init if truly new (legacy data not in current course list?)
                        attDetails[subjName] = { totalClasses: 0, totalPresent: 0, totalAbsent: 0, percentage: 0 };
                    }
                }

                attDetails[subjName].totalClasses++;
                if (rec.status === 'Present') attDetails[subjName].totalPresent++;
                else attDetails[subjName].totalAbsent++;
            });

            Object.keys(attDetails).forEach(subj => {
                const s = attDetails[subj];
                s.percentage = s.totalClasses > 0 ? Math.round((s.totalPresent / s.totalClasses) * 100) : 0;
            });

            // 2. Marks (Overlay actual data)
            marksRecords = await Mark.find({ studentId: sid });

            // Ensure marks also respect the subject map
            const marksBySubject = {};
            marksRecords.forEach(m => {
                let subjName = m.subject;
                if (!acaDetails[subjName]) {
                    const match = Object.keys(acaDetails).find(k => k.toLowerCase() === subjName.toLowerCase());
                    if (match) subjName = match;
                    else {
                        acaDetails[subjName] = { percentage: 0, categorized: { cla: {}, module1: {}, module2: {} } };
                    }
                }
                if (!marksBySubject[subjName]) marksBySubject[subjName] = [];
                marksBySubject[subjName].push(m);
            });

            Object.keys(acaDetails).forEach(subj => {
                const records = marksBySubject[subj] || [];
                const percentages = records.map(m => (m.marksObtained / m.maxMarks) * 100);
                const avg = percentages.length ? percentages.reduce((a, b) => a + b, 0) / percentages.length : 0;

                const categorized = { cla: {}, module1: {}, module2: {} };
                records.forEach(r => {
                    if (r.examType.startsWith('cla')) categorized.cla[r.examType] = r.marksObtained;
                    else if (r.examType.startsWith('m1')) categorized.module1[r.examType] = r.marksObtained;
                    else if (r.examType.startsWith('m2')) categorized.module2[r.examType] = r.marksObtained;
                });

                acaDetails[subj] = {
                    percentage: Math.round(avg),
                    categorized
                };
            });

            // 3. Classmates for Ranking
            classmates = await Student.find({ branch: student.branch, year: student.year, section: student.section }).select('sid');
        }

        // --- Aggregations ---

        // Overall Attendance
        const allAttPct = Object.values(attDetails).map(a => a.percentage);
        const avgAtt = allAttPct.length ? allAttPct.reduce((a, b) => a + b, 0) / allAttPct.length : 0;

        // Overall Academics
        const allMarksPct = Object.values(acaDetails).map(a => a.percentage);
        const avgMarks = allMarksPct.length ? allMarksPct.reduce((a, b) => a + b, 0) / allMarksPct.length : 0;

        // Dynamic CGPA
        const calculatedCGPA = avgMarks > 0 ? (avgMarks / 10).toFixed(2) : '8.50';

        // Semester Progress
        const currentMonth = new Date().getMonth() + 1;
        let semesterProgress = 60;
        if (currentMonth >= 1 && currentMonth <= 5) semesterProgress = (currentMonth / 5) * 100;
        else if (currentMonth >= 7 && currentMonth <= 11) semesterProgress = ((currentMonth - 6) / 5) * 100;

        // Ranking Calculation
        let rank = 1;
        let totalStudents = classmates.length || 1;

        if (classmates.length > 0) {
            const classmateSids = classmates.map(c => c.sid);
            const classmateMarks = await Mark.find({ studentId: { $in: classmateSids } });
            const classPerformance = {};

            classmateMarks.forEach(m => {
                if (!classPerformance[m.studentId]) classPerformance[m.studentId] = { scored: 0, max: 0 };
                classPerformance[m.studentId].scored += m.marksObtained;
                classPerformance[m.studentId].max += m.maxMarks;
            });

            const sortedPerformance = Object.entries(classPerformance)
                .map(([id, stats]) => ({ id, avg: stats.max > 0 ? (stats.scored / stats.max) : 0 }))
                .sort((a, b) => b.avg - a.avg);

            rank = sortedPerformance.findIndex(p => p.id === sid) + 1 || totalStudents;
        }

        // Construct Overview Payload
        const overview = {
            student: student,
            semesterProgress: Math.min(100, Math.round(semesterProgress)),
            ranking: {
                rank: rank,
                total: totalStudents,
                percentile: totalStudents > 0 ? Math.round(((totalStudents - rank) / totalStudents) * 100) : 100
            },
            activity: {
                streak: 5,
                aiUsage: 85,
                calculatedCGPA: calculatedCGPA,
                careerReadyScore: Math.round((avgAtt + avgMarks) / 2) || 85
            },
            attendance: {
                details: attDetails,
                overall: Math.round(avgAtt)
            },
            academics: {
                details: acaDetails,
                overallPercentage: Math.round(avgMarks),
                totalExamsTaken: marksRecords.length || 4
            },
            roadmapProgress: {}
        };

        res.json(overview);

    } catch (err) {
        console.error("Overview fetch error:", err);
        res.status(500).json({ error: err.message });
    }
};

// --- UTILS ---
// Call this on registration/profile update
exports.syncStudentProfileFile = async (sid) => {
    try {
        const student = await Student.findOne({ sid });
        if (student) {
            updateStudentFile(sid, 'student_details.json', {
                name: student.name,
                sid: student.sid,
                email: student.email,
                branch: student.branch,
                section: student.section,
                year: student.year,
                folderPath: student.folderPath,
                profilePic: student.profilePic,
                registeredAt: student.createdAt,
                lastLogin: 'See auth logs' // We don't track this yet but placeholder is nice
            });
        }
    } catch (e) { console.error("Profile sync failed", e); }
};

exports.getMarksBySubject = async (req, res) => {
    try {
        const sid = req.params.id;
        const marks = await Mark.find({ studentId: sid });
        const grouped = {};

        marks.forEach(m => {
            if (!grouped[m.subject]) {
                grouped[m.subject] = {
                    subject: m.subject,
                    cla: [],
                    module1: [],
                    module2: [],
                    overall: { total: 0, max: 0, percentage: 0 }
                };
            }
            const s = grouped[m.subject];
            const item = { test: m.examType.replace(/cla|m1t|m2t/, ''), scored: m.marksObtained, total: m.maxMarks };

            if (m.examType.startsWith('cla')) s.cla.push(item);
            else if (m.examType.startsWith('m1')) s.module1.push(item);
            else if (m.examType.startsWith('m2')) s.module2.push(item);

            s.overall.total += m.marksObtained;
            s.overall.max += m.maxMarks;
        });

        const result = Object.values(grouped).map(s => {
            s.overall.percentage = s.overall.max > 0 ? Math.round((s.overall.total / s.overall.max) * 100) : 0;
            return s;
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAdminMarksOverview = async (req, res) => {
    try {
        const { year, section, subject } = req.query;
        let markQuery = {};
        if (subject) markQuery.subject = subject;

        let studentQuery = {};
        if (year) studentQuery.year = year;
        if (section) {
            // Flexible section matching: "A" matches "A", "A, B", "B, A", "All"
            studentQuery.$or = [
                { section: { $regex: /^all$/i } },
                { section: { $regex: new RegExp(`(^|[\\s,])(${section})($|[\\s,])`, 'i') } }
            ];
        }
        const sids = students.map(s => s.sid);

        markQuery.studentId = { $in: sids };

        const marks = await Mark.find(markQuery);

        // Calculate averages by subject
        const averagesBySubject = {};
        marks.forEach(m => {
            if (!averagesBySubject[m.subject]) {
                averagesBySubject[m.subject] = { totalMarks: 0, maxMarks: 0, count: 0 };
            }
            averagesBySubject[m.subject].totalMarks += m.marksObtained;
            averagesBySubject[m.subject].maxMarks += m.maxMarks;
            averagesBySubject[m.subject].count++;
        });

        Object.keys(averagesBySubject).forEach(subj => {
            const s = averagesBySubject[subj];
            s.percentage = s.maxMarks > 0 ? Math.round((s.totalMarks / s.maxMarks) * 100) : 0;
        });

        const totalScored = marks.reduce((acc, m) => acc + m.marksObtained, 0);
        const totalMax = marks.reduce((acc, m) => acc + m.maxMarks, 0);

        const overview = {
            totalStudents: students.length,
            subjectsAnalyzed: Object.keys(averagesBySubject),
            averagesBySubject,
            overallAverage: totalMax > 0 ? Math.round((totalScored / totalMax) * 100) : 0
        };

        res.json(overview);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getClassAttendance = async (req, res) => {
    try {
        let { year, section, branch } = req.params;
        const sYear = String(year || '').replace(/[^0-9]/g, '');
        const sSec = String(section || '').replace(/Section\s*/i, '').trim().toUpperCase();

        const students = await Student.find({
            year: sYear,
            section: sSec,
            branch
        }).select('sid name');

        const attendance = await Attendance.find({
            studentId: { $in: students.map(s => s.sid) }
        });

        const report = students.map(s => {
            const studentAtt = attendance.filter(a => a.studentId === s.sid);
            const totalClasses = studentAtt.length;
            const totalPresent = studentAtt.filter(a => a.status === 'Present').length;
            const overallPercentage = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;

            return {
                sid: s.sid,
                name: s.name,
                totalClasses,
                totalPresent,
                overallPercentage
            };
        });

        res.json({ students: report });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.getAbsenteesForDate = async (req, res) => {
    try {
        const { date, year, section, branch } = req.query;
        if (!date || !year || !section) {
            return res.status(400).json({ error: 'Missing required parameters: date, year, section' });
        }

        // Find all attendance records for this section on this date where status is Absent
        // We match by year/section indirectly. 
        // Option A: If we saved year/section in Attendance records (we started doing this in markBulkAttendance).
        // Option B: Find students in this section first, then match IDs.

        // Let's go with Option B to be safe across legacy data, but Option A is faster if data exists.
        // We'll use a mix: Query Attendance where date matches. Then filter by year/section if available, 
        // OR filter by studentId list from Student collection.

        // 1. Get Students in this Section
        const studentQuery = { year, section };
        if (branch) studentQuery.branch = branch;
        const students = await Student.find(studentQuery).select('sid name');
        const sids = students.map(s => s.sid);
        const studentMap = students.reduce((acc, s) => { acc[s.sid] = s.name; return acc; }, {});

        // 2. Find Absenses
        const absencyRecords = await Attendance.find({
            studentId: { $in: sids },
            date: date,
            status: 'Absent'
        });

        // 3. Fetch Faculty Details
        // recordedBy contains the Faculty ID (string). We need to resolve this to a name.
        // We filter for valid ObjectIds to avoid CastErrors if 'Admin' or other strings are used.
        const facultyIds = [...new Set(absencyRecords.map(r => r.recordedBy).filter(id => id && mongoose.Types.ObjectId.isValid(id)))];
        let facultyMap = {};

        if (facultyIds.length > 0) {
            const facultyDocs = await Faculty.find({ _id: { $in: facultyIds } }).select('name');
            facultyMap = facultyDocs.reduce((acc, f) => { acc[f._id.toString()] = f.name; return acc; }, {});
        }

        // 4. Group by Student
        const absenteeMap = {};
        absencyRecords.forEach(record => {
            if (!absenteeMap[record.studentId]) {
                absenteeMap[record.studentId] = {
                    studentId: record.studentId,
                    studentName: studentMap[record.studentId] || 'Unknown',
                    periods: []
                };
            }
            absenteeMap[record.studentId].periods.push({
                subject: record.subject,
                status: record.status,
                period: record.period || 1,
                facultyName: facultyMap[record.recordedBy] || 'System'
            });
        });

        res.json(Object.values(absenteeMap));

    } catch (err) {
        console.error("Error fetching absentees:", err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * GET /api/attendance/daily-report
 * Returns comprehensive daily attendance report (Hour-wise)
 * Query: date, year, section, branch
 */
exports.getDailyAttendanceReport = async (req, res) => {
    try {
        let { date, year, section, branch } = req.query;
        year = String(year || '').replace(/[^0-9]/g, '');
        section = String(section || '').replace(/Section\s*/i, '').trim().toUpperCase();

        if (!date || !year || !section) {
            return res.status(400).json({ error: 'Missing required parameters: date, year, section' });
        }

        // 1. Get All Students in Section
        const studentQuery = { year, section };
        if (branch) studentQuery.branch = branch;
        const students = await Student.find(studentQuery).select('sid name profilePic');
        const sids = students.map(s => s.sid);

        // 2. Get All Attendance Records for Date & Section (Universal check across all subjects/periods)
        // We match by studentId to be sure.
        const attendanceRecords = await Attendance.find({
            studentId: { $in: sids },
            date: date
        });

        // 3. Process Report
        const report = students.map(student => {
            const studentRecords = attendanceRecords.filter(r => r.studentId === student.sid);

            // Determine periods (assuming 1-8 max, or dynamic based on records)
            // We'll standardise to 5 hours as per user request example, or map existing.
            // Let's gather all unique periods found for this student.
            const periodData = {};
            studentRecords.forEach(r => {
                const p = r.period || 1;
                periodData[p] = {
                    status: r.status || 'Present',
                    subject: r.subject || 'General'
                };
            });

            const maxPeriod = 5;
            const hourWise = [];
            let presentCount = 0;
            let absentCount = 0;

            for (let i = 1; i <= maxPeriod; i++) {
                const entry = periodData[i];
                const status = entry ? entry.status : 'N/A';
                const subject = entry ? entry.subject : 'General';

                let symbol = '-';
                if (status === 'Present') { presentCount++; symbol = 'P'; }
                if (status === 'Absent') { absentCount++; symbol = 'A'; }

                hourWise.push({ period: i, status, symbol, subject });
            }

            const totalRecorded = presentCount + absentCount;
            let percentage = 0;
            if (totalRecorded > 0) {
                percentage = Math.round((presentCount / totalRecorded) * 100);
            }

            // Status Logic
            let dailyStatus = 'N/A';
            if (totalRecorded > 0) {
                if (percentage >= 75) dailyStatus = 'Regular';
                else if (percentage >= 40) dailyStatus = 'Irregular';
                else dailyStatus = 'Absent';
            }

            return {
                sid: student.sid,
                name: student.name,
                profilePic: student.profilePic,
                hourWise,
                stats: {
                    present: presentCount,
                    absent: absentCount,
                    total: totalRecorded,
                    percentage
                },
                dailyStatus
            };
        });

        res.json(report);

    } catch (err) {
        console.error("Daily Report Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// Start Live OTP Session
exports.createSessionOTP = async (req, res) => {
    try {
        let { facultyId, year, section, branch, subject, period = 1, duration = 60 } = req.body;
        year = String(year || '').replace(/[^0-9]/g, '');
        section = String(section || '').replace(/Section\s*/i, '').trim().toUpperCase();

        // Generate 4 digit code
        const code = Math.floor(1000 + Math.random() * 9000).toString();

        // Set expiry
        const validUntil = new Date(Date.now() + duration * 1000);

        const session = new ActiveSession({
            code,
            facultyId,
            section: { year, section, branch },
            subject,
            period,
            validUntil
        });

        await session.save();

        res.json({ code, validUntil, message: 'Session Active' });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Verify OTP & Mark Attendance
exports.verifySessionOTP = async (req, res) => {
    try {
        const { code, studentId, studentName } = req.body; // studentName optional for logging

        // 1. Find Session
        const session = await ActiveSession.findOne({ code });
        if (!session) {
            return res.status(404).json({ error: 'Invalid or Expired Code' });
        }

        // 2. Check Expiry (Double check, though TTL handles cleanup eventually)
        if (new Date() > session.validUntil) {
            return res.status(400).json({ error: 'Code Expired' });
        }

        // 3. Mark Attendance
        // We use the date from the time of marking
        const dateStr = new Date().toISOString().split('T')[0];

        // Check if already marked to prevent dupes (or use upsert)
        const existing = await Attendance.findOne({
            studentId,
            date: dateStr,
            period: session.period || 1
        });

        if (existing) {
            existing.status = 'Present';
            existing.recordedBy = 'OTP_VERIFY';
            await existing.save();

            // Broadcast Real-time Update
            if (sse && sse.broadcast) {
                sse.broadcast('attendance_update', {
                    studentId,
                    status: 'Present',
                    subject: session.subject,
                    section: session.section
                });
            }
            return res.json({ success: true, message: 'Attendance Updated', subject: session.subject });
        }

        const newRecord = new Attendance({
            studentId,
            date: dateStr,
            subject: session.subject,
            year: session.section.year,
            section: session.section.section,
            status: 'Present',
            period: session.period || 1,
            recordedBy: 'OTP_VERIFY'
        });

        await newRecord.save();

        // Broadcast Real-time Update
        if (sse && sse.broadcast) {
            sse.broadcast('attendance_update', {
                studentId,
                status: 'Present',
                subject: session.subject,
                section: session.section
            });
        }

        res.json({ success: true, message: 'Attendance Marked Successfully', subject: session.subject });

    } catch (err) {
        console.error("OTP Verify Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.getStudentDailyAttendance = async (req, res) => {
    try {
        const studentId = req.params.id;
        const allRecords = await Attendance.find({ studentId }).sort({ date: -1 });

        // Group by Date
        const grouped = {};
        allRecords.forEach(r => {
            const d = r.date;
            if (!grouped[d]) grouped[d] = { date: d, hourWise: {}, total: 0, present: 0, absent: 0 };

            // Hour wise
            const h = r.period || 1;
            grouped[d].hourWise[h] = r.status || 'Present';

            // Stats
            if (r.status === 'Present' || r.status === 'Late') {
                grouped[d].present++;
                grouped[d].total++;
            }
            if (r.status === 'Absent') {
                grouped[d].absent++;
                grouped[d].total++;
            }
        });

        const report = Object.values(grouped).map(day => {
            let percentage = 0;
            if (day.total > 0) {
                percentage = Math.round((day.present / day.total) * 100);
            }

            // Status Logic (User Rule: Present = All -> Regular, >75% Regular)
            let status = 'Absent';
            if (percentage >= 75) status = 'Regular';
            else if (percentage >= 40) status = 'Irregular';
            else status = 'Absent';

            // Hour-wise array
            const maxP = Math.max(5, ...Object.keys(day.hourWise).map(Number).filter(n => !isNaN(n)));
            const periods = [];
            for (let i = 1; i <= maxP; i++) {
                periods.push({ period: i, status: day.hourWise[i] || 'N/A' });
            }

            return {
                date: day.date,
                periods,
                present: day.present,
                absent: day.absent,
                percentage,
                status
            };
        });

        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
