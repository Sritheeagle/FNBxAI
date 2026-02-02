const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Mark = require('../models/Mark');
const fs = require('fs');
const path = require('path');
const sse = require('../sse');

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
    const { studentId, date, subject, status, recordedBy } = req.body;

    try {
        // 1. Save to DB
        const update = { status, recordedBy, period: 1 };
        const record = await Attendance.findOneAndUpdate(
            { studentId, date, subject },
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
    const { date, subject, year, section, facultyName, records } = req.body;
    try {
        const results = [];
        for (const r of records) {
            const update = { status: r.status, recordedBy: facultyName || 'Faculty', period: 1, year, section };
            const record = await Attendance.findOneAndUpdate(
                { studentId: r.studentId, date, subject },
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

exports.getBulkAttendance = async (req, res) => {
    try {
        const { date, year, section, subject } = req.query;
        // If date is provided, return status for that specific day
        if (date) {
            // Find records for this class on this day
            // We need to look up students? Or just search attendance?
            // Attendance table stores studentId.
            // But we actually need to match the "Year/Section" filter indirectly if it's not stored in Attendance.
            // If I updated markBulkAttendance to store year/section, we are good.
            // Otherwise we accept loosely.

            // To be robust, let's assume we search by subject/date and filter by student IDs if needed?
            // Actually, querying by date + subject is usually enough if the subject is unique to the class.

            const query = { date, subject };
            if (year) query.year = year;
            if (section) query.section = section;

            // If the schema doesn't have year/section, this might fail to filter correctly if multiple sections have same subject.
            // Let's assume we added year/section in the bulk update (which we did above).

            const records = await Attendance.find(query);
            // Return shape expected: [{ records: [...] }] or just the records? 
            // Frontend expects: `existing[0].records` -> so it expects an array of "Session" objects?
            // The frontend logic is:
            /*
             if (existing && existing.length > 0) {
                const record = existing[0]; 
                record.records.forEach...
             }
            */
            // So we need to wrap it to look like a "Session Document"

            const wrapped = [{
                date,
                subject,
                year,
                section,
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

            // 1. Attendance
            const attendanceRecords = await Attendance.find({ studentId: sid });
            attendanceRecords.forEach(rec => {
                if (!attDetails[rec.subject]) {
                    attDetails[rec.subject] = { totalClasses: 0, totalPresent: 0, totalAbsent: 0, percentage: 0 };
                }
                attDetails[rec.subject].totalClasses++;
                if (rec.status === 'Present') attDetails[rec.subject].totalPresent++;
                else attDetails[rec.subject].totalAbsent++;
            });
            Object.keys(attDetails).forEach(subj => {
                const s = attDetails[subj];
                s.percentage = s.totalClasses > 0 ? Math.round((s.totalPresent / s.totalClasses) * 100) : 0;
            });

            // 2. Marks
            marksRecords = await Mark.find({ studentId: sid });

            // Group by subject for calculations
            const subjects = [...new Set(marksRecords.map(m => m.subject))];

            subjects.forEach(subj => {
                const records = marksRecords.filter(r => r.subject === subj);
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
        if (section) studentQuery.section = section;

        const students = await Student.find(studentQuery).select('sid');
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
        const { year, section, branch } = req.params;
        const students = await Student.find({ year, section, branch }).select('sid name');

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

