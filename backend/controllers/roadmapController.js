const Roadmap = require('../models/Roadmap');
const Student = require('../models/Student');

exports.getRoadmaps = async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = {};

        if (category && category !== 'All') {
            query.category = category;
        }

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } }
            ];
        }

        const roadmaps = await Roadmap.find(query).sort({ isBest: -1, createdAt: -1 });
        res.json(roadmaps);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getOneRoadmap = async (req, res) => {
    try {
        const roadmap = await Roadmap.findOne({ slug: req.params.slug });
        if (!roadmap) return res.status(404).json({ error: 'Roadmap not found' });
        res.json(roadmap);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateProgress = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { roadmapSlug, completedTopics } = req.body;

        const student = await Student.findOne({ sid: studentId });
        if (!student) return res.status(404).json({ error: 'Student not found' });

        if (!student.roadmapProgress) student.roadmapProgress = new Map();

        // Use .set for Mongoose Map
        student.roadmapProgress.set(roadmapSlug, completedTopics);

        await student.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createRoadmap = async (req, res) => {
    try {
        const newRoadmap = new Roadmap(req.body);
        await newRoadmap.save();
        res.status(201).json(newRoadmap);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
