const Placement = require('../models/Placement');
const sse = require('../sse');

// Get all placements
exports.getPlacements = async (req, res) => {
    try {
        const placements = await Placement.find().sort({ createdAt: -1 });
        res.json(placements);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a placement
exports.createPlacement = async (req, res) => {
    try {
        const placement = new Placement(req.body);
        await placement.save();
        sse.broadcast('placements', { action: 'create', data: placement });
        res.status(201).json(placement);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Update a placement
exports.updatePlacement = async (req, res) => {
    try {
        const placement = await Placement.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!placement) return res.status(404).json({ error: 'Placement not found' });
        sse.broadcast('placements', { action: 'update', data: placement });
        res.json(placement);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete a placement
exports.deletePlacement = async (req, res) => {
    try {
        const placement = await Placement.findByIdAndDelete(req.params.id);
        if (!placement) return res.status(404).json({ error: 'Placement not found' });
        sse.broadcast('placements', { action: 'delete', id: req.params.id });
        res.json({ message: 'Placement deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
