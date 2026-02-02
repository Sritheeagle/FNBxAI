const Course = require('../models/Course');
const sse = require('../sse');

exports.getCourses = async (req, res) => {
    try {
        const courses = await Course.find().sort({ name: 1 });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createCourse = async (req, res) => {
    try {
        const newCourse = new Course(req.body);
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

exports.deleteCourse = async (req, res) => {
    try {
        await Course.findByIdAndDelete(req.params.id);

        // Notify clients for immediate update
        sse.broadcast({ resource: 'courses', action: 'delete', id: req.params.id });

        res.json({ message: 'Course deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
