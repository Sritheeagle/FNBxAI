const Message = require('../models/Message');
const Todo = require('../models/Todo');
const sse = require('../sse');

// --- MESSAGES ---
exports.getMessages = async (req, res) => {
    try {
        const { role, userId, year, section } = req.query;
        let query = {};

        // If filtering for a specific student
        if (role === 'student') {
            query = {
                $or: [
                    { target: 'all' },
                    { target: 'students' },
                    {
                        target: 'students-specific',
                        targetYear: year,
                        $or: [
                            { targetSections: section },
                            { targetSections: { $size: 0 } },
                            { targetSections: { $exists: false } }
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
        // Simple mapping for faculty messages if sent via /api/faculty/messages pattern
        if (messageData.sections && !messageData.targetSections) {
            messageData.targetSections = Array.isArray(messageData.sections) ? messageData.sections : [messageData.sections];
            messageData.targetYear = messageData.year;
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
