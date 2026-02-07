const Assignment = require('../models/Assignment');
const Faculty = require('../models/Faculty');
const sse = require('../sse');

exports.createAssignment = async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.year) data.year = String(data.year).replace(/[^0-9]/g, '');
        if (data.section) data.section = String(data.section).replace(/Section\s*/i, '').trim().toUpperCase();

        const assignment = new Assignment(data);
        await assignment.save();
        // Also sync this assignment into the Faculty.assignments array for quick faculty->student matching
        if (assignment.facultyId) {
            try {
                await Faculty.findOneAndUpdate(
                    { facultyId: assignment.facultyId },
                    {
                        $addToSet: {
                            assignments: {
                                year: assignment.year,
                                section: assignment.section,
                                subject: assignment.subject,
                                branch: assignment.branch,
                                semester: assignment.semester
                            }
                        }
                    },
                    { upsert: false }
                );
            } catch (syncErr) {
                console.warn('Failed to sync assignment into Faculty.assignments:', syncErr.message);
            }
        }

        // Broadcast to relevant students
        sse.broadcast({ resource: 'assignments', action: 'create', data: assignment });
        res.status(201).json(assignment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getFacultyAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find({ facultyId: req.params.id }).sort({ createdAt: -1 });
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.syncAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find({});
        if (!assignments || assignments.length === 0) return res.json({ message: 'No assignments to sync' });

        // Group assignments by facultyId
        const facultyMap = {};
        assignments.forEach(asm => {
            if (asm.facultyId) {
                if (!facultyMap[asm.facultyId]) facultyMap[asm.facultyId] = [];
                facultyMap[asm.facultyId].push({
                    year: asm.year,
                    section: asm.section,
                    subject: asm.subject,
                    branch: asm.branch,
                    semester: asm.semester
                });
            }
        });

        let count = 0;
        for (const [fid, asms] of Object.entries(facultyMap)) {
            await Faculty.findOneAndUpdate(
                { facultyId: fid },
                { $set: { assignments: asms } } // Replace entire array to ensure accuracy
            );
            count += asms.length;
        }

        console.log(`[Sync] Successfully synced assignments for ${Object.keys(facultyMap).length} faculty.`);
        res.json({ message: `Synced assignments for ${Object.keys(facultyMap).length} faculty members` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const oldAssignment = await Assignment.findById(id);
        if (!oldAssignment) return res.status(404).json({ error: 'Assignment not found' });

        const updatedAssignment = await Assignment.findByIdAndUpdate(id, req.body, { new: true });

        // Sync with Faculty: Remove old, Add new
        if (oldAssignment.facultyId) {
            try {
                await Faculty.findOneAndUpdate(
                    { facultyId: oldAssignment.facultyId },
                    {
                        $pull: {
                            assignments: {
                                year: oldAssignment.year,
                                section: oldAssignment.section,
                                subject: oldAssignment.subject,
                                branch: oldAssignment.branch
                            }
                        }
                    }
                );
            } catch (e) { console.warn("Failed to unsync old assignment", e.message); }
        }

        if (updatedAssignment.facultyId) {
            try {
                await Faculty.findOneAndUpdate(
                    { facultyId: updatedAssignment.facultyId },
                    {
                        $addToSet: {
                            assignments: {
                                year: updatedAssignment.year,
                                section: updatedAssignment.section,
                                subject: updatedAssignment.subject,
                                branch: updatedAssignment.branch,
                                semester: updatedAssignment.semester
                            }
                        }
                    }
                );
            } catch (e) { console.warn("Failed to sync new assignment", e.message); }
        }

        sse.broadcast({ resource: 'assignments', action: 'update', data: updatedAssignment });
        res.json(updatedAssignment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteAssignment = async (req, res) => {
    try {
        const removed = await Assignment.findByIdAndDelete(req.params.id);
        if (removed) {
            // Remove the assignment from faculty record if present
            try {
                await Faculty.findOneAndUpdate(
                    { facultyId: removed.facultyId },
                    { $pull: { assignments: { year: removed.year, section: removed.section, subject: removed.subject, branch: removed.branch } } }
                );
            } catch (syncErr) {
                console.warn('Failed to remove assignment from Faculty.assignments:', syncErr.message);
            }
            // Broadcast deletion
            sse.broadcast({ resource: 'assignments', action: 'delete', id: req.params.id });
        }

        res.json({ message: 'Assignment deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStudentAssignments = async (req, res) => {
    try {
        let { year, section, branch } = req.query;
        const query = {};

        const sYear = String(year || '').replace(/[^0-9]/g, '');
        const sSec = String(section || '').replace(/Section\s*/i, '').trim().toUpperCase();

        if (sYear) query.year = sYear;

        if (sSec) {
            query.$or = [
                { section: 'All' },
                { section: { $regex: /^all$/i } },
                { section: { $regex: new RegExp(`(^|[\\s,])(${sSec})($|[\\s,])`, 'i') } }
            ];
        }

        if (branch) {
            const branchFilter = [
                { branch: 'All' },
                { branch: { $regex: /^all$/i } },
                { branch: { $regex: new RegExp(`(^|[\\s,])(${branch})($|[\\s,])`, 'i') } },
                { branch: "" },
                { branch: { $exists: false } }
            ];

            if (query.$or) {
                // If section already has $or, we need to $and them
                const existingSectionOr = query.$or;
                delete query.$or;
                query.$and = [
                    { $or: existingSectionOr },
                    { $or: branchFilter }
                ];
            } else {
                query.$or = branchFilter;
            }
        }

        const assignments = await Assignment.find(query).sort({ createdAt: -1 });
        res.json(assignments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
