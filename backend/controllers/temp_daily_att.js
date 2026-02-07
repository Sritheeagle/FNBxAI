
// Start of getStudentDailyAttendance

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
            // Only count if status is explicit Present/Absent/Late
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

            // Status Logic
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
