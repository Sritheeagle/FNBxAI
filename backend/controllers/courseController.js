const Course = require('../models/Course');
const sse = require('../sse');

exports.getCourses = async (req, res) => {
    try {
        let { year, branch, section } = req.query;
        let query = {};

        if (year) {
            const sYear = String(year).replace(/[^0-9]/g, '');
            query.year = { $in: [sYear, 'All'] };
        }

        if (branch) {
            query.branch = { $regex: new RegExp(`(^|[\\s,])(${branch}|All)($|[\\s,])`, 'i') };
        }

        if (section) {
            const sSec = String(section).replace(/Section\s*/i, '').trim().toUpperCase();
            query.section = { $regex: new RegExp(`(^|[\\s,])(${sSec}|All)($|[\\s,])`, 'i') };
        }

        // Exclude hidden/soft-deleted courses
        query.isHidden = { $ne: true };

        const courses = await Course.find(query).sort({ name: 1 });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.year) data.year = String(data.year).replace(/[^0-9]/g, '');
        if (data.section) data.section = String(data.section).replace(/Section\s*/i, '').trim().toUpperCase();

        const newCourse = new Course(data);
        await newCourse.save();

        // Notify clients for immediate update
        sse.broadcast({ resource: 'courses', action: 'create', data: newCourse });

        res.status(201).json(newCourse);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Course code already exists' });
        }
        res.status(500).json({ error: err.message });
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });

        // Notify clients for immediate update
        sse.broadcast({ resource: 'courses', action: 'update', data: course });

        res.json(course);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStudentCourses = async (req, res) => {
    try {
        const { id } = req.params; // sid
        const Student = require('../models/Student');
        const student = await Student.findOne({ sid: id });
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const sYear = String(student.year || '').replace(/[^0-9]/g, '');
        const sSec = String(student.section || '').replace(/Section\s*/i, '').trim().toUpperCase();

        // Find courses matching student's year, branch, and section
        // Robust matching for Year (String vs Number) and flexible Branch matching
        const yearQuery = { $in: [sYear, parseInt(sYear), 'All'] };

        // Flexible branch matching: "CSE" matches "CSE", "CSE, ECE", "All"
        const branchQuery = {
            branch: { $regex: new RegExp(`(^|[\\s,])(${student.branch}|All)($|[\\s,])`, 'i') }
        };

        // Flexible section matching: "A" matches "A", "A, B", "All"
        const sectionQuery = {
            section: { $regex: new RegExp(`(^|[\\s,])(${sSec}|All)($|[\\s,])`, 'i') }
        };

        const courses = await Course.find({
            $and: [
                { year: yearQuery },
                branchQuery,
                sectionQuery,
                { isHidden: { $ne: true } }
            ]
        }).sort({ semester: 1, name: 1 });

        console.log(`[getStudentCourses] Found ${courses.length} courses for ${student.name} (${sYear}-${student.branch}-${sSec})`);
        res.json(courses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteCourse = async (req, res) => {
    const courseId = req.params.id;
    console.log(`[DELETE COURSE] Starting deletion for ID: ${courseId}`);

    try {
        // First, check if the course exists
        const courseToDelete = await Course.findById(courseId);

        if (!courseToDelete) {
            console.warn(`[DELETE COURSE] Course not found: ${courseId}`);
            return res.status(404).json({ error: 'Course not found' });
        }

        console.log(`[DELETE COURSE] Found course to delete:`, {
            id: courseToDelete._id,
            name: courseToDelete.name,
            code: courseToDelete.code,
            year: courseToDelete.year,
            semester: courseToDelete.semester,
            branch: courseToDelete.branch
        });

        // Perform the deletion
        const deletedCourse = await Course.findByIdAndDelete(courseId);
        console.log(`[DELETE COURSE] Successfully deleted course from database: ${deletedCourse.name}`);

        // Notify all connected clients for immediate update
        sse.broadcast({
            resource: 'courses',
            action: 'delete',
            id: courseId,
            data: {
                name: deletedCourse.name,
                code: deletedCourse.code
            }
        });
        console.log(`[DELETE COURSE] SSE broadcast sent to all clients`);

        res.json({
            message: 'Course deleted successfully',
            deletedCourse: {
                id: deletedCourse._id,
                name: deletedCourse.name,
                code: deletedCourse.code
            }
        });
    } catch (err) {
        console.error(`[DELETE COURSE] Error deleting course:`, err);
        res.status(500).json({ error: err.message });
    }
};
