const Message = require('../models/Message');
const Todo = require('../models/Todo');
const sse = require('../sse');

// --- MESSAGES ---
exports.getMessages = async (req, res) => {
    try {
        let { role, userId, year, section } = req.query;
        year = year ? String(year).replace(/[^0-9]/g, '') : year;
        section = section ? String(section).replace(/Section\s*/i, '').trim().toUpperCase() : section;

        let query = {};

        // If filtering for a specific student
        if (role === 'student') {
            const studentBranch = String(req.query.branch || '').toUpperCase();
            query = {
                $or: [
                    { target: 'all' },
                    { target: 'students' },
                    {
                        target: 'students-specific',
                        targetYear: year,
                        $and: [
                            {
                                $or: [
                                    { targetBranch: { $regex: new RegExp(`(^|[\\s,])(${studentBranch}|All)($|[\\s,])`, 'i') } },
                                    { targetBranch: { $exists: false } },
                                    { targetBranch: "" }
                                ]
                            },
                            {
                                $or: [
                                    { targetSections: { $regex: new RegExp(`(^|[\\s,])(${section})($|[\\s,])`, 'i') } },
                                    { targetSections: { $regex: /^all$/i } },
                                    { targetSections: { $size: 0 } },
                                    { targetSections: { $exists: false } }
                                ]
                            }
                        ]
                    }
                ]
            };
        } else if (role === 'faculty') {
            // Faculty can see global announcements and faculty-specific ones
            query = {
                $or: [
                    { target: 'all' },
                    { target: 'faculty' }
                ]
            };
        }

        const messages = await Message.find(query).sort({ createdAt: -1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createMessage = async (req, res) => {
    try {
        const messageData = { ...req.body };

        if (messageData.targetYear) {
            messageData.targetYear = String(messageData.targetYear).replace(/[^0-9]/g, '');
        }

        // Split comma-separated sections if string
        if (typeof messageData.targetSections === 'string') {
            messageData.targetSections = messageData.targetSections.split(',').map(s => String(s).replace(/Section\s*/i, '').trim().toUpperCase());
        } else if (Array.isArray(messageData.targetSections)) {
            messageData.targetSections = messageData.targetSections.map(s => String(s).replace(/Section\s*/i, '').trim().toUpperCase());
        }
        // Simple mapping for faculty messages if sent via /api/faculty/messages pattern
        if (messageData.sections && !messageData.targetSections) {
            messageData.targetSections = (Array.isArray(messageData.sections) ? messageData.sections : [messageData.sections])
                .map(s => String(s).replace(/Section\s*/i, '').trim().toUpperCase());
            messageData.targetYear = String(messageData.year || '').replace(/[^0-9]/g, '');
            messageData.targetBranch = messageData.branch || 'All';
            messageData.target = 'students-specific';
        }

        const msg = new Message(messageData);
        await msg.save();

        // Notify clients for immediate update
        sse.broadcast('messages', { action: 'create', data: msg });

        res.status(201).json(msg);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- SENTINEL TRANSMISSIONS (High-Priority Alerts) ---
exports.sendTransmission = async (req, res) => {
    try {
        const { title, message, type, priority, target } = req.body;

        const transmission = {
            id: Date.now(),
            title: title || 'SYSTEM TRANSMISSION',
            message: message,
            type: type || 'info', // info, alert, emergency
            priority: priority || 'normal',
            target: target || 'all',
            timestamp: new Date().toISOString()
        };

        // Broadcast to SSE directly without saving to DB (for volatile, high-priority alerts)
        sse.broadcast('transmission', { action: 'active', data: transmission });

        res.json({ success: true, transmission });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// --- TODOS ---
exports.getTodos = async (req, res) => {
    try {
        const { role, userId } = req.query;
        let query = {};

        if (role === 'admin') {
            query = { target: 'admin' };
        } else if (userId) {
            query = { $or: [{ userId: userId }, { target: 'student', userId: null }] }; // Specific or General Student Tasks
        }

        const todos = await Todo.find(query).sort({ createdAt: -1 });
        res.json(todos);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createTodo = async (req, res) => {
    try {
        const todo = new Todo(req.body);
        await todo.save();

        // Notify clients for immediate update
        sse.broadcast({ resource: 'todos', action: 'create', data: todo });

        res.status(201).json(todo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateTodo = async (req, res) => {
    try {
        const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, { new: true });

        // Notify clients for immediate update
        sse.broadcast({ resource: 'todos', action: 'update', data: todo });

        res.json(todo);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteTodo = async (req, res) => {
    try {
        await Todo.findByIdAndDelete(req.params.id);

        // Notify clients for immediate update
        sse.broadcast({ resource: 'todos', action: 'delete', id: req.params.id });

        res.json({ message: 'Todo deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
