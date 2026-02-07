const Schedule = require('../models/Schedule');
const sse = require('../sse');

exports.getSchedules = async (req, res) => {
    try {
        const { year, section, branch, day, faculty, type } = req.query;
        let query = {};
        if (year) {
            const sYear = String(year).replace(/[^0-9]/g, '');
            query.year = { $in: [sYear, parseInt(sYear)] };
        }
        if (section) {
            const sSec = String(section).replace(/Section\s*/i, '').trim().toUpperCase();
            query.section = { $regex: new RegExp(`(^|[\\s,])(${sSec}|All)($|[\\s,])`, 'i') };
        }
        if (branch) query.branch = { $regex: new RegExp(`(^|[\\s,])(${branch}|All)($|[\\s,])`, 'i') };
        if (day) query.day = { $regex: new RegExp(`^${day}$`, 'i') };
        if (faculty) query.faculty = { $regex: faculty, $options: 'i' };
        if (type) query.type = type;

        const schedules = await Schedule.find(query).sort({ day: 1, time: 1 });
        res.json(schedules);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getLabsSchedule = async (req, res) => {
    try {
        const { year, section, branch } = req.query;
        let query = { type: 'Lab' };

        if (year) {
            const sYear = String(year).replace(/[^0-9]/g, '');
            query.year = { $in: [sYear, parseInt(sYear)] };
        }
        if (section) {
            const sSec = String(section).replace(/Section\s*/i, '').trim().toUpperCase();
            query.section = { $regex: new RegExp(`(^|[\\s,])(${sSec}|All)($|[\\s,])`, 'i') };
        }
        if (branch) query.branch = { $regex: new RegExp(`(^|[\\s,])(${branch}|All)($|[\\s,])`, 'i') };

        const schedules = await Schedule.find(query).sort({ day: 1, time: 1 });
        // Map to expected format for frontend if needed
        const formatted = schedules.map(s => ({
            labName: s.subject,
            faculty: s.faculty,
            room: s.room || 'TBD',
            day: s.day,
            time: s.time,
            batch: s.batch || 'All',
            description: s.description
        }));
        res.json(formatted);
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
