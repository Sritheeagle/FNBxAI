// Memory optimization and monitoring
const memoryMonitor = setInterval(() => {
    const used = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();
    const memUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);

    if (memUsage > 90) {
        console.log('[Memory] High memory usage detected:', memUsage + '%');
        console.log('[Memory] Process memory:', Math.round(used.heapUsed / 1024 / 1024) + 'MB');

        // Force garbage collection if available
        if (global.gc) {
            global.gc();
            console.log('[Memory] Garbage collection triggered');
        }
    }
}, 300000); // Check every 5 minutes

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[Shutdown] SIGTERM received, shutting down gracefully');
    clearInterval(memoryMonitor);
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('[Shutdown] SIGINT received, shutting down gracefully');
    clearInterval(memoryMonitor);
    process.exit(0);
});

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

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
const enhancedAIRoutes = require('./routes/enhancedAIRoutes');
const continuousLearningRoutes = require('./routes/continuousLearningRoutes');
const fastResponseRoutes = require('./routes/fastResponseRoutes');
const llmTrainingRoutes = require('./routes/llmTrainingRoutes');
const powerResponseRoutes = require('./routes/powerResponseRoutes');
const nonstopResponseRoutes = require('./routes/nonstopResponseRoutes');
const advancedResponseRoutes = require('./routes/advancedResponseRoutes');
const fixedFastResponseRoutes = require('./routes/fixedFastResponseRoutes');
const dashboardResponseRoutes = require('./routes/dashboardResponseRoutesFixed');
const enhancedDashboardRoutes = require('./routes/enhancedDashboardRoutes');

app.use('/api', authRoutes);
app.use('/api', apiRoutes); // Mount general API routes
app.use('/ai', specializedAIRoutes); // Mount specialized AI routes
app.use('/ai/fast', fastAIRoutes); // Mount fast AI routes
app.use('/llm', llmRoutes); // Mount LLM-specific routes
app.use('/ai/enhanced', enhancedAIRoutes); // Mount enhanced AI routes
app.use('/ai/learning', continuousLearningRoutes); // Mount continuous learning routes
app.use('/ai/llama', fastResponseRoutes); // Mount fast Llama response routes
app.use('/ai/training', llmTrainingRoutes); // Mount LLM training routes
app.use('/ai/power', powerResponseRoutes); // Mount ultimate power response routes
app.use('/ai/nonstop', nonstopResponseRoutes); // Mount nonstop response routes
app.use('/ai/advanced', advancedResponseRoutes); // Mount advanced quantum response routes
app.use('/ai/fixed-fast', fixedFastResponseRoutes); // Mount fixed fast response routes
app.use('/ai/dashboard', dashboardResponseRoutes); // Mount dashboard response routes
app.use('/ai/enhanced', enhancedDashboardRoutes); // Mount enhanced dashboard routes

// MongoDB Connection
let isDbConnected = false;

const initializeDatabase = async () => {
    try {
        const uri = process.env.MONGO_URI || 'mongodb+srv://FNBXAI_db_user:1JlyINjrx54rhf9P@cluster0.kdss6af.mongodb.net/friendly_notebook?appName=Cluster0';

        await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
        });

        isDbConnected = true;
        console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);

        // Setup connection error handlers
        mongoose.connection.on('error', err => {
            console.error('❌ MongoDB Connection Error:', err);
            isDbConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            console.warn('⚠️ MongoDB Disconnected');
            isDbConnected = false;
        });

    } catch (error) {
        console.error(`❌ Database Initialization Failed: ${error.message}`);
        isDbConnected = false;
        // Retry logic could go here
    }
};

// Middleware to check DB status (only for critical routes)
app.use((req, res, next) => {
    // Allow health checks, static files, and faculty data even without DB
    if (req.path.includes('/health') || req.path.includes('/uploads') || req.path === '/' || req.path.includes('/faculty')) {
        return next();
    }

    // For critical API routes, check DB connection
    const criticalRoutes = ['/api/students', '/api/materials', '/api/exams', '/api/schedule', '/api/courses'];
    const isCriticalRoute = criticalRoutes.some(route => req.path.startsWith(route));

    if (!isDbConnected && isCriticalRoute) {
        return res.status(503).json({
            error: 'Database Unavailable',
            details: 'The backend server cannot connect to MongoDB. Please check your connection or try again later.',
            status: 'offline'
        });
    }
    next();
});

initializeDatabase();

app.get('/', (req, res) => {
    res.send('Friendly Notebook API is running...');
});

// Start Server
app.get('/health', (req, res) => {
    const mongoose = require('mongoose');
    const os = require('os');

    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
            system: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
        },
        database: {
            status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            host: mongoose.connection.host || 'unknown'
        },
        services: {
            backend: true,
            python: false // Will be updated by actual check
        }
    };

    // Check Python backend
    const fetch = require('node-fetch');
    fetch('http://localhost:8000/health')
        .then(() => { health.services.python = true; })
        .catch(() => { health.services.python = false; });

    const overallHealth = health.database.status === 'connected' && health.memory.system < 95;
    health.status = overallHealth ? 'healthy' : 'degraded';

    res.status(overallHealth ? 200 : 503).json(health);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
