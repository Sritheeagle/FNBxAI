require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://localhost:8000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

// Routes
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
const specializedAIRoutes = require('./routes/specializedAIRoutes');
const fastAIRoutes = require('./routes/fastAIRoutes');
const llmRoutes = require('./routes/llmRoutes');

app.use('/api', authRoutes);
app.use('/api', apiRoutes); // Mount general API routes
app.use('/ai', specializedAIRoutes); // Mount specialized AI routes
app.use('/ai/fast', fastAIRoutes); // Mount fast AI routes
app.use('/llm', llmRoutes); // Mount LLM-specific routes

// MongoDB Connection
const { connectDatabase } = require('./config/database');

let isDbConnected = false;

const connectDB = async () => {
    try {
        await connectDatabase();
        isDbConnected = true;
    } catch (error) {
        console.error(`❌ CRITICAL: Database connection failed. Server will start but API may trigger errors.`);
        console.error(`Error details: ${error.message}`);
        // Do NOT process.exit(1) so the server can still respond with friendly errors
    }
};

// Middleware to check DB status
app.use((req, res, next) => {
    if (!isDbConnected && !req.path.includes('/stream')) { // Allow stream or static if needed
        return res.status(503).json({
            error: 'Database Disconnected',
            details: 'The backend server cannot connect to MongoDB. Please check IP Whitelist or Network.',
            status: 'offline'
        });
    }
    next();
});

connectDB();

app.get('/', (req, res) => {
    res.send('Friendly Notebook API is running...');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
