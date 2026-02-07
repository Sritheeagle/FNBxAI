const Curriculum = require('../models/Curriculum');
const sse = require('../sse');

exports.getCurriculum = async (req, res) => {
    try {
        const { subject, year } = req.query;
        // Simple find. If multiple due to branch, this might need refinement.
        // But for now, subject+year is unique enough for this app logic.
        const query = { subject };
        if (year) query.year = year;

        const curriculum = await Curriculum.findOne(query);
        res.json(curriculum || null); // Return null if not customized yet
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateCurriculum = async (req, res) => {
    try {
        const { subject, year, units, branch } = req.body;

        const curriculum = await Curriculum.findOneAndUpdate(
            { subject, year },
            { subject, year, branch, units, lastUpdated: new Date() },
            { upsert: true, new: true }
        );

        sse.broadcast({ resource: 'curriculum', action: 'update', data: { subject, year } });
        res.json(curriculum);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
