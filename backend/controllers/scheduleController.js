const Schedule = require('../models/Schedule');
const sse = require('../sse');

exports.getSchedules = async (req, res) => {
    try {
        const { year, section, branch, day, faculty } = req.query;
        let query = {};
        if (year) query.year = parseInt(year);
        if (section) query.section = section;
        if (branch) query.branch = branch;
        if (day) query.day = day;
        if (faculty) query.faculty = { $regex: faculty, $options: 'i' };

        const schedules = await Schedule.find(query).sort({ day: 1, time: 1 });
        res.json(schedules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createSchedule = async (req, res) => {
    try {
        const schedule = new Schedule(req.body);
        await schedule.save();

        // Broadcast Update
        sse.broadcast('schedule', { action: 'create', data: schedule });

        res.status(201).json(schedule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await Schedule.findByIdAndUpdate(id, req.body, { new: true });
        if (!schedule) return res.status(404).json({ error: 'Schedule entry not found' });

        // Broadcast Update
        sse.broadcast('schedule', { action: 'update', data: schedule });

        res.json(schedule);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await Schedule.findByIdAndDelete(id);
        if (!schedule) return res.status(404).json({ error: 'Schedule entry not found' });

        // Broadcast Update
        sse.broadcast('schedule', { action: 'delete', id });

        res.json({ message: 'Schedule entry deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
