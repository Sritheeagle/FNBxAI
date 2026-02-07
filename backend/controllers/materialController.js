const Material = require('../models/Material');
const sse = require('../sse');

exports.getMaterials = async (req, res) => {
    try {
        const { year, subject, section, isAdvanced, branch } = req.query;
        const query = {};
        if (year) {
            const sYear = String(year).replace(/[^0-9]/g, '');
            query.year = { $in: [sYear, 'All', 'all'] };
        }
        if (subject) query.subject = subject;
        if (isAdvanced) query.isAdvanced = isAdvanced === 'true';
        if (branch) query.branch = { $regex: new RegExp(`(^|[\\s,])(${branch}|All)($|[\\s,])`, 'i') };
        if (section) {
            const sSec = String(section).replace(/Section\s*/i, '').trim().toUpperCase();
            query.$or = [
                { section: 'All' },
                { section: { $regex: /^all$/i } },
                { section: { $regex: new RegExp(`(^|[\\s,])(${sSec})($|[\\s,])`, 'i') } },
                { section: "" },
                { section: { $exists: false } }
            ];
        }

        const materials = await Material.find(query).sort({ createdAt: -1 });
        res.json(materials);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createMaterial = async (req, res) => {
    try {
        const {
            title, subject, type, year, semester, branch, section,
            module, unit, topic, duration, videoAnalysis, examYear,
            dueDate, message, link, uploadedBy
        } = req.body;

        let finalFileUrl = '';
        if (req.file) {
            finalFileUrl = '/uploads/materials/' + req.file.filename;
        }

        const newMaterial = new Material({
            title: title || (req.file ? req.file.originalname : 'Untitled'),
            subject,
            type,
            year,
            semester,
            branch: branch || 'CSE',
            section: section || 'All',
            module,
            unit,
            topic,
            duration,
            videoAnalysis,
            examYear,
            dueDate,
            message,
            fileUrl: finalFileUrl,
            url: link || '',
            uploadedBy: uploadedBy || 'admin'
        });

        await newMaterial.save();

        // Notify clients for immediate update
        sse.broadcast({ resource: 'materials', action: 'create', data: newMaterial });

        res.json(newMaterial);
    } catch (err) {
        console.error("Create Material Error:", err);
        res.status(500).json({ error: err.message });
    }
};

exports.updateMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        if (req.file) {
            updates.fileUrl = '/uploads/materials/' + req.file.filename;
        }

        const updated = await Material.findByIdAndUpdate(id, updates, { new: true });
        if (!updated) return res.status(404).json({ error: 'Material not found' });

        // Notify clients for immediate update
        sse.broadcast({ resource: 'materials', action: 'update', data: updated });

        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Material.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ error: 'Material not found' });

        // Optional: delete file from disk
        if (deleted.fileUrl) {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, '..', deleted.fileUrl);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.json({ message: 'Material deleted successfully' });

        // Notify clients for immediate update
        sse.broadcast({ resource: 'materials', action: 'delete', id });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
