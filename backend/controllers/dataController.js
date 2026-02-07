const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Attendance = require('../models/Attendance');
const Mark = require('../models/Mark');
const Fee = require('../models/Fee');
const Assignment = require('../models/Assignment');
const { ChatHistory, StudentChatHistory } = require('../models/AIModels');
const sse = require('../sse');

exports.getStudents = async (req, res) => {
    try {
        const students = await Student.find().select('-password');
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOneStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findOne({ sid: id }).select('-password');
        if (!student) return res.status(404).json({ error: 'Student not found' });
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getFaculty = async (req, res) => {
    try {
        const faculty = await Faculty.find().select('-password');
        res.json(faculty);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOneFaculty = async (req, res) => {
    try {
        const { id } = req.params;
        const faculty = await Faculty.findOne({ facultyId: id }).select('-password');
        if (!faculty) return res.status(404).json({ error: 'Faculty not found' });
        res.json(faculty);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { syncStudentProfileFile } = require('./studentFeatureController');

exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        let updateData = { ...req.body };

        // Normalize Year and Section
        if (updateData.year) updateData.year = String(updateData.year).replace(/[^0-9]/g, '');
        if (updateData.section) updateData.section = String(updateData.section).replace(/Section\s*/i, '').trim().toUpperCase();
        if (updateData.branch) updateData.branch = String(updateData.branch).trim().toUpperCase();

        // Handle Password Update securely
        if (updateData.password && updateData.password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        } else {
            delete updateData.password; // Don't overwrite with empty string
        }

        // Find by sid (custom ID) or _id
        const oldStudent = await Student.findOne({ sid: id });
        if (!oldStudent) return res.status(404).json({ error: 'Student not found' });

        const student = await Student.findOneAndUpdate(
            { sid: id },
            updateData,
            { new: true }
        );

        // If SID changed, cascade update to other collections
        if (updateData.sid && updateData.sid !== oldStudent.sid) {
            const oldSid = oldStudent.sid;
            const newSid = updateData.sid;
            console.log(`[Cascade Update] SID change detected: ${oldSid} -> ${newSid}`);

            await Promise.all([
                Mark.updateMany({ studentId: oldSid }, { $set: { studentId: newSid } }),
                Attendance.updateMany({ studentId: oldSid }, { $set: { studentId: newSid } }),
                Fee.updateMany({ studentId: oldSid }, { $set: { studentId: newSid } }),
                ChatHistory.updateMany({ userId: oldSid, role: 'student' }, { $set: { userId: newSid } }),
                StudentChatHistory.updateMany({ userId: oldSid }, { $set: { userId: newSid } })
            ]);
        }

        // Sync File
        await syncStudentProfileFile(student.sid);

        // Broadcast Update
        sse.broadcast('students', { action: 'update', data: student });

        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateFaculty = async (req, res) => {
    try {
        const { id } = req.params;
        let updateData = { ...req.body };

        // Handle Password Update securely
        if (updateData.password && updateData.password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        } else {
            delete updateData.password;
        }

        // Handle Assignments Parsing if sent as string (FormData)
        if (typeof updateData.assignments === 'string') {
            try {
                updateData.assignments = JSON.parse(updateData.assignments);
            } catch (e) {
                console.error("Failed to parse faculty assignments:", e);
            }
        }

        // Normalize Assignments
        if (Array.isArray(updateData.assignments)) {
            updateData.assignments = updateData.assignments.map(a => ({
                ...a,
                year: String(a.year || '').replace(/[^0-9]/g, ''),
                section: String(a.section || '').replace(/Section\s*/i, '').trim().toUpperCase(),
                branch: String(a.branch || 'CSE').trim().toUpperCase()
            }));
        }

        // Handle File Upload
        if (req.file) {
            const facultyId = updateData.facultyId || id;
            const folderPath = path.join(__dirname, '../uploads/faculty', String(facultyId));
            if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

            const fileName = `profile_${Date.now()}${path.extname(req.file.originalname)}`;
            const destPath = path.join(folderPath, fileName);
            fs.renameSync(req.file.path, destPath);
            updateData.profilePic = `/uploads/faculty/${facultyId}/${fileName}`;
        }

        // Find old record for ID comparison
        const oldFaculty = await Faculty.findOne({ facultyId: id }) || await Faculty.findById(id);
        if (!oldFaculty) return res.status(404).json({ error: 'Faculty not found' });

        // Try to update by facultyId (string) OR _id (ObjectId)
        let faculty = await Faculty.findOneAndUpdate(
            { facultyId: id },
            updateData,
            { new: true }
        );

        if (!faculty) {
            // Fallback: Try by MongoDB _id
            try {
                faculty = await Faculty.findByIdAndUpdate(id, updateData, { new: true });
            } catch (e) { /* ignore invalid objectid error */ }
        }

        // If facultyId changed, cascade update
        if (updateData.facultyId && updateData.facultyId !== oldFaculty.facultyId) {
            const oldFid = oldFaculty.facultyId;
            const newFid = updateData.facultyId;
            console.log(`[Cascade Update] FacultyId change detected: ${oldFid} -> ${newFid}`);

            await Promise.all([
                Assignment.updateMany({ facultyId: oldFid }, { $set: { facultyId: newFid } }),
                ChatHistory.updateMany({ userId: oldFid, role: 'faculty' }, { $set: { userId: newFid } })
            ]);
        }

        // Post-Update: Ensure folder structure exists
        try {
            const baseDir = path.join(__dirname, '../uploads/faculty', faculty.facultyId);
            if (!fs.existsSync(baseDir)) {
                fs.mkdirSync(baseDir, { recursive: true });
                // Create default subfolders
                ['materials', 'assignments', 'exams', 'personal_notes'].forEach(sub => {
                    fs.mkdirSync(path.join(baseDir, sub));
                });
                // Update DB if folderPath was missing
                if (!faculty.folderPath) {
                    faculty.folderPath = baseDir;
                    await faculty.save();
                }
            }
        } catch (dirErr) {
            console.error("Faculty Folder Creation Error:", dirErr);
        }

        // Broadcast Update
        sse.broadcast('faculty', { action: 'update', data: faculty });

        res.json(faculty);
    } catch (err) {
        console.error("Update Faculty Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const studentId = req.params.id;
        const student = await Student.findOneAndDelete({ sid: studentId });

        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }

        if (student) {
            // Delete folder data
            if (student.folderPath) {
                try {
                    fs.rmSync(student.folderPath, { recursive: true, force: true });
                } catch (e) { console.error("Folder delete failed", e); }
            }

            // CASCADE DELETE: Remove all student dependencies
            console.log(`[Data Integrity] Deleting student dependencies for: ${studentId}`);
            await Promise.all([
                Attendance.deleteMany({ studentId: studentId }),
                Mark.deleteMany({ studentId: studentId }),
                Fee.deleteMany({ studentId: studentId }),
                ChatHistory.deleteMany({ userId: studentId, role: 'student' }),
                StudentChatHistory.deleteMany({ userId: studentId })
            ]);
        }

        // Broadcast Update
        sse.broadcast('students', { action: 'delete', id: studentId });

        res.json({ message: 'Student and all associated data deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteFaculty = async (req, res) => {
    try {
        const id = req.params.id;
        const fac = await Faculty.findOneAndDelete({ facultyId: id });

        if (!fac) {
            return res.status(404).json({ error: 'Faculty not found' });
        }

        if (fac) {
            // Delete folder data
            if (fac.folderPath) {
                try {
                    fs.rmSync(fac.folderPath, { recursive: true, force: true });
                } catch (e) { console.error("Folder delete failed", e); }
            }

            // CASCADE DELETE: Remove faculty dependencies
            console.log(`[Data Integrity] Deleting faculty dependencies for: ${id}`);
            await Promise.all([
                Assignment.deleteMany({ facultyId: id }),
                ChatHistory.deleteMany({ userId: id, role: 'faculty' })
            ]);
        }

        // Broadcast Update
        sse.broadcast('faculty', { action: 'delete', id: id });

        res.json({ message: 'Faculty and all associated data deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getFacultyStudents = async (req, res) => {
    try {
        const { id } = req.params;
        const faculty = await Faculty.findOne({ facultyId: id });

        if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

        let criteria = [];
        if (faculty.assignments && Array.isArray(faculty.assignments) && faculty.assignments.length > 0) {
            criteria = faculty.assignments.map(a => {
                const conditions = [];

                // 1. Year Match (String or Number)
                const yStr = String(a.year).trim();
                conditions.push({
                    $or: [
                        { year: yStr },
                        { year: !isNaN(yStr) ? Number(yStr) : yStr }
                    ]
                });

                // 2. Section Match (Exact or 'Section X')
                const sec = String(a.section || 'All').trim().toUpperCase();
                if (sec !== 'ALL' && sec !== 'ALL SECTIONS') {
                    const sectionArray = sec.split(',').map(s => s.trim()).filter(s => s);
                    if (sectionArray.length > 0) {
                        conditions.push({
                            section: {
                                $in: sectionArray.flatMap(s => [s, `Section ${s}`, `SECTION ${s}`])
                            }
                        });
                    }
                }

                // 3. Branch Match (Partial/Regex for coverage)
                const bran = String(a.branch || 'All').trim().toUpperCase();
                if (bran !== 'ALL') {
                    const branchArray = bran.split(',').map(b => b.trim()).filter(b => b);
                    if (branchArray.length > 0) {
                        conditions.push({
                            $or: branchArray.map(b => ({
                                branch: { $regex: new RegExp(b, 'i') }
                            }))
                        });
                    }
                }

                // Combine with AND
                return { $and: conditions };
            });
        }

        if (criteria.length === 0) {
            return res.json([]);
        }

        const students = await Student.find({ $or: criteria }).select('-password');

        // ENHANCEMENT: Calculate Attendance Risk for each student
        // This adds "Smart Intelligence" to the raw list
        const detailedStudents = await Promise.all(students.map(async (student) => {
            const studentObj = student.toObject();

            // Fetch basic attendance stats
            // We optimized this by not fetching every single record, but for now correctness > speed
            const records = await Attendance.find({ studentId: student.sid }).sort({ date: -1 });

            const total = records.length;
            if (total === 0) {
                studentObj.attendanceRisk = 'neutral';
                studentObj.attendancePct = 100; // Benefit of doubt
                return studentObj;
            }

            const present = records.filter(r => r.status === 'Present').length;
            const pct = Math.round((present / total) * 100);

            studentObj.attendancePct = pct;

            // Risk Logic
            if (pct < 65) studentObj.attendanceRisk = 'critical';
            else if (pct < 75) studentObj.attendanceRisk = 'warning';
            else studentObj.attendanceRisk = 'good';

            // Streak Logic (Last 3 classes)
            const recent = records.slice(0, 3);
            const absentCount = recent.filter(r => r.status === 'Absent').length;

            if (absentCount === 3) studentObj.recentTrend = 'absent_streak';
            else if (recent.every(r => r.status === 'Present') && recent.length === 3) studentObj.recentTrend = 'present_streak';
            else studentObj.recentTrend = 'mixed';

            return studentObj;
        }));

        res.json(detailedStudents);

    } catch (err) {
        console.error("Fetch Faculty Students Error:", err);
        res.status(500).json({ error: err.message });
    }
};

/**
 * FETCH TEACHING FACULTY FOR STUDENT
 * Returns list of faculty who have assignments matching the student's year, section, and branch.
 */
exports.getTeachingFaculty = async (req, res) => {
    try {
        const { year, section, branch } = req.query;
        console.log('[getTeachingFaculty] ===== REQUEST START =====');
        console.log('[getTeachingFaculty] Query params:', { year, section, branch });

        if (!year || !section) {
            console.log('[getTeachingFaculty] ❌ Missing required parameters');
            return res.status(400).json({ error: "Year and Section required" });
        }

        const searchYear = String(year).trim();
        const searchSection = String(section).trim().toUpperCase();
        const searchBranch = branch ? String(branch).trim().toUpperCase() : null;

        console.log('[getTeachingFaculty] Normalized search:', { searchYear, searchSection, searchBranch });

        // First, get ALL faculty to see what we have
        const allFaculty = await Faculty.find({}).select('-password');
        console.log(`[getTeachingFaculty] Total faculty in database: ${allFaculty.length}`);

        if (allFaculty.length > 0) {
            console.log('[getTeachingFaculty] Sample faculty data:', {
                name: allFaculty[0].name,
                hasAssignments: !!allFaculty[0].assignments,
                assignmentCount: (allFaculty[0].assignments || []).length,
                sampleAssignment: allFaculty[0].assignments?.[0]
            });
        }

        // Now search with the specific criteria
        const facultyList = await Faculty.find({
            assignments: {
                $elemMatch: {
                    $and: [
                        {
                            $or: [
                                { year: searchYear },
                                { year: !isNaN(searchYear) ? Number(searchYear) : searchYear }
                            ]
                        },
                        { section: { $regex: new RegExp(`(^|[\\s,])(${searchSection}|ALL)($|[\\s,])`, 'i') } },
                        searchBranch ? {
                            $or: [
                                { branch: { $regex: new RegExp(`(^|[\\s,])(${searchBranch}|ALL)($|[\\s,])`, 'i') } },
                                { branch: { $exists: false } },
                                { branch: null },
                                { branch: "" }
                            ]
                        } : {}
                    ]
                }
            }
        }).select('-password');

        console.log(`[getTeachingFaculty] Matched ${facultyList.length} faculty with relevant assignments`);

        // Filter assignments to only include those matching the student's criteria
        const filteredFaculty = facultyList.map((faculty, index) => {
            const f = faculty.toObject ? faculty.toObject() : faculty;
            const originalCount = f.assignments.length;

            f.assignments = f.assignments.filter(a => {
                const yMatch = String(a.year) === searchYear || a.year === Number(searchYear);
                const sMatch = (a.section && String(a.section).toUpperCase().includes('ALL')) ||
                    (a.section && new RegExp(`(^|[\\s,])(${searchSection})($|[\\s,])`, 'i').test(a.section));
                // Bidirectional safe match for branch
                const bMatch = !searchBranch ||
                    !a.branch ||
                    String(a.branch).toUpperCase().includes('ALL') ||
                    String(a.branch).toUpperCase().includes(searchBranch) ||
                    searchBranch.includes(String(a.branch).toUpperCase().trim());

                const matches = yMatch && sMatch && bMatch;

                if (index === 0) { // Log first faculty's filtering details
                    console.log(`[getTeachingFaculty] Faculty "${f.name}" assignment check:`, {
                        assignment: a.subject,
                        year: a.year,
                        section: a.section,
                        branch: a.branch,
                        yMatch,
                        sMatch,
                        bMatch,
                        finalMatch: matches
                    });
                }

                return matches;
            });

            console.log(`[getTeachingFaculty] Faculty "${f.name}": ${originalCount} total → ${f.assignments.length} matched`);
            return f;
        }).filter(f => f.assignments.length > 0);

        console.log(`[getTeachingFaculty] ✅ Returning ${filteredFaculty.length} faculty`);
        if (filteredFaculty.length > 0) {
            console.log('[getTeachingFaculty] Sample faculty being returned:', {
                name: filteredFaculty[0].name,
                email: filteredFaculty[0].email,
                assignments: filteredFaculty[0].assignments.map(a => ({
                    subject: a.subject,
                    year: a.year,
                    section: a.section,
                    branch: a.branch
                }))
            });
        } else {
            console.log('[getTeachingFaculty] ⚠️  No faculty matched the criteria');
            console.log('[getTeachingFaculty] Suggestion: Check if faculty have assignments with:');
            console.log(`  - year: "${searchYear}" or ${Number(searchYear)}`);
            console.log(`  - section containing: "${searchSection}" or "ALL"`);
            console.log(`  - branch containing: "${searchBranch}" or "ALL" or empty`);
        }
        console.log('[getTeachingFaculty] ===== REQUEST END =====\n');

        return res.json(filteredFaculty);

    } catch (err) {
        console.error("[getTeachingFaculty] ❌ ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};
