const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
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

        // Handle Password Update securely
        if (updateData.password && updateData.password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            updateData.password = await bcrypt.hash(updateData.password, salt);
        } else {
            delete updateData.password; // Don't overwrite with empty string
        }

        // Find by sid (custom ID) or _id
        const student = await Student.findOneAndUpdate(
            { sid: id },
            updateData,
            { new: true }
        );

        if (!student) return res.status(404).json({ error: 'Student not found' });

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

        // Try to update by facultyId (string) OR _id (ObjectId)
        // This fixes the "Faculty not found" if frontend sends _id instead of facultyId
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

        if (!faculty) return res.status(404).json({ error: 'Faculty not found' });

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
        const student = await Student.findOneAndDelete({ sid: req.params.id });
        if (student && student.folderPath) {
            // Basic recursive delete
            try {
                fs.rmSync(student.folderPath, { recursive: true, force: true });
            } catch (e) { console.error("Folder delete failed", e); }
        }

        // Broadcast Update
        sse.broadcast('students', { action: 'delete', id: req.params.id });

        res.json({ message: 'Student and data deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteFaculty = async (req, res) => {
    try {
        const fac = await Faculty.findOneAndDelete({ facultyId: req.params.id });
        if (fac && fac.folderPath) {
            try {
                fs.rmSync(fac.folderPath, { recursive: true, force: true });
            } catch (e) { console.error("Folder delete failed", e); }
        }

        // Broadcast Update
        sse.broadcast('faculty', { action: 'delete', id: req.params.id });

        res.json({ message: 'Faculty deleted' });
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
            criteria = faculty.assignments.map(a => ({
                year: String(a.year).trim(),
                section: String(a.section).trim().toUpperCase()
            }));
        } else if (faculty.year && faculty.section) {
            criteria = [{
                year: String(faculty.year).trim(),
                section: String(faculty.section).trim().toUpperCase()
            }];
        }

        if (criteria.length === 0) {
            return res.json([]);
        }

        const students = await Student.find({ $or: criteria }).select('-password');
        res.json(students);

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
        if (!year || !section) {
            return res.status(400).json({ error: "Year and Section required" });
        }

        const searchYear = String(year).trim();
        const searchSection = String(section).trim().toUpperCase();
        const searchBranch = branch ? String(branch).trim().toUpperCase() : null;

        // Find faculty where assignments array contains an object matching the student stats
        const query = {
            assignments: {
                $elemMatch: {
                    year: searchYear,
                    section: searchSection
                }
            }
        };

        if (searchBranch) {
            query.assignments.$elemMatch.branch = searchBranch;
        }

        const facultyList = await Faculty.find(query).select('-password');
        res.json(facultyList);
    } catch (err) {
        console.error("Fetch Teaching Faculty Error:", err);
        res.status(500).json({ error: err.message });
    }
};
