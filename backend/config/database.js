const mongoose = require('mongoose');

// Database configuration and optimization
const databaseConfig = {
    // Connection options for performance
    connectionOptions: {
        maxPoolSize: 10, // Maximum number of socket connections
        serverSelectionTimeoutMS: 30000, // Increased timeout to 30s
        socketTimeoutMS: 45000, // How long a send or receive on a socket can take
        family: 4, // Force IPv4
        retryWrites: true, // Retry write operations
        writeConcern: { w: 'majority' } // Write concern
    },

    // Index configurations for faster queries
    indexes: {
        // Student AI indexes
        studentKnowledge: [
            { category: 1, subject: 1 },
            { tags: 1 },
            { difficulty: 1 },
            { lastUpdated: -1 }
        ],
        studentChatHistory: [
            { userId: 1, timestamp: -1 },
            { subject: 1 },
            { timestamp: -1 }
        ],

        // Faculty AI indexes
        facultyKnowledge: [
            { category: 1, subject: 1 },
            { tags: 1 },
            { lastUpdated: -1 }
        ],
        facultyChatHistory: [
            { userId: 1, timestamp: -1 },
            { action: 1 },
            { timestamp: -1 }
        ],

        // Admin AI indexes
        adminKnowledge: [
            { category: 1, module: 1 },
            { tags: 1 },
            { lastUpdated: -1 }
        ],
        adminChatHistory: [
            { userId: 1, timestamp: -1 },
            { module: 1 },
            { timestamp: -1 }
        ]
    },

    // Performance monitoring
    performance: {
        enableQueryLogging: process.env.NODE_ENV === 'development',
        slowQueryThreshold: 100, // ms
        enableProfiling: true
    }
};

// Optimized database connection
// Optimized database connection
const connectDatabase = async () => {
    try {
        console.log('🔄 Connecting to MongoDB (Cloud Atlas)...');
        const conn = await mongoose.connect(process.env.MONGO_URI, databaseConfig.connectionOptions);
        console.log(`✅ MongoDB Connected (Cloud): ${conn.connection.host}`);

        // Setup post-connection items
        setupPerformanceMonitoring();
        await createIndexes();
        setupConnectionHandlers();
        return conn;

    } catch (error) {
        console.warn('⚠️ Cloud MongoDB connection failed:', error.message);
        console.log('🔄 Attempting fallback to Local MongoDB (mongodb://127.0.0.1:27017/friendly_notebook)...');

        try {
            const localConn = await mongoose.connect('mongodb://127.0.0.1:27017/friendly_notebook', {
                ...databaseConfig.connectionOptions,
                serverSelectionTimeoutMS: 5000 // Shorter timeout for local
            });
            console.log(`✅ MongoDB Connected (Local): ${localConn.connection.host}`);

            setupPerformanceMonitoring();
            await createIndexes();
            setupConnectionHandlers();
            return localConn;

        } catch (localError) {
            console.error('❌ Critical: Both Cloud and Local Database connections failed.');
            console.error('   Cloud Error:', error.message);
            console.error('   Local Error:', localError.message);
            throw new Error('Database unavailable'); // Propagate to server.js
        }
    }
};

// Create indexes for all collections
const createIndexes = async () => {
    try {
        console.log('🔧 Creating optimized database indexes...');

        const db = mongoose.connection.db;

        // Helper to create indexes for a collection
        const createCollIndexes = async (collName, indexList) => {
            const coll = db.collection(collName);
            const specs = indexList.map((idx, i) => ({
                key: idx,
                name: `${collName}_idx_${i}`
            }));
            return coll.createIndexes(specs);
        };

        // Create indexes for all collections
        await createCollIndexes('studentknowledges', databaseConfig.indexes.studentKnowledge);
        await createCollIndexes('studentchathistories', databaseConfig.indexes.studentChatHistory);
        await createCollIndexes('facultyknowledges', databaseConfig.indexes.facultyKnowledge);
        await createCollIndexes('facultychathistories', databaseConfig.indexes.facultyChatHistory);
        await createCollIndexes('adminknowledges', databaseConfig.indexes.adminKnowledge);
        await createCollIndexes('adminchathistories', databaseConfig.indexes.adminChatHistory);

        console.log('✅ Database indexes created successfully');

    } catch (error) {
        console.error('❌ Error creating indexes:', error);
    }
};

// Performance monitoring setup
const setupPerformanceMonitoring = () => {
    if (!databaseConfig.performance.enableQueryLogging) return;

    mongoose.set('debug', (collectionName, method, query, doc) => {
        const start = Date.now();

        // Log slow queries
        setTimeout(() => {
            const duration = Date.now() - start;
            if (duration > databaseConfig.performance.slowQueryThreshold) {
                console.warn(`🐌 Slow Query (${duration}ms): ${collectionName}.${method}`, JSON.stringify(query));
            }
        }, 0);
    });
};

// Connection event handlers
const setupConnectionHandlers = () => {
    const db = mongoose.connection;

    db.on('error', (error) => {
        console.error('❌ MongoDB Error:', error);
    });

    db.on('disconnected', () => {
        console.warn('⚠️ MongoDB Disconnected');
    });

    db.on('reconnected', () => {
        console.log('🔄 MongoDB Reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
        try {
            await mongoose.connection.close();
            console.log('✅ MongoDB connection closed through app termination');
            process.exit(0);
        } catch (error) {
            console.error('❌ Error closing MongoDB connection:', error);
            process.exit(1);
        }
    });
};

// Fast data operations utilities
const fastOperations = {
    // Bulk insert with error handling
    bulkInsert: async (model, documents) => {
        try {
            const result = await model.insertMany(documents, {
                ordered: false, // Continue on errors
                lean: true // Return plain JavaScript objects
            });
            return { success: true, data: result };
        } catch (error) {
            console.error('Bulk insert error:', error);
            return { success: false, error: error.message };
        }
    },

    // Fast find with lean queries
    fastFind: async (model, filter = {}, options = {}) => {
        try {
            const result = await model
                .find(filter, null, {
                    lean: true, // Faster queries
                    maxTimeMS: 5000, // Timeout
                    ...options
                })
                .limit(options.limit || 100);
            return { success: true, data: result };
        } catch (error) {
            console.error('Fast find error:', error);
            return { success: false, error: error.message };
        }
    },

    // Fast update with upsert
    fastUpdate: async (model, filter, update, options = {}) => {
        try {
            const result = await model.updateOne(filter, update, {
                upsert: true, // Create if doesn't exist
                lean: true,
                maxTimeMS: 3000,
                ...options
            });
            return { success: true, data: result };
        } catch (error) {
            console.error('Fast update error:', error);
            return { success: false, error: error.message };
        }
    },

    // Optimized aggregation
    fastAggregate: async (model, pipeline, options = {}) => {
        try {
            const result = await model
                .aggregate(pipeline, {
                    allowDiskUse: true,
                    maxTimeMS: 10000,
                    ...options
                });
            return { success: true, data: result };
        } catch (error) {
            console.error('Fast aggregate error:', error);
            return { success: false, error: error.message };
        }
    }
};

// Cache utilities for frequently accessed data
const cacheUtils = {
    // Simple in-memory cache
    cache: new Map(),
    ttl: 5 * 60 * 1000, // 5 minutes

    set: (key, value) => {
        cacheUtils.cache.set(key, {
            value,
            timestamp: Date.now()
        });
    },

    get: (key) => {
        const item = cacheUtils.cache.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > cacheUtils.ttl) {
            cacheUtils.cache.delete(key);
            return null;
        }

        return item.value;
    },

    clear: () => {
        cacheUtils.cache.clear();
    },

    // Cache knowledge base queries
    getCachedKnowledge: async (model, filter) => {
        const cacheKey = `knowledge:${JSON.stringify(filter)}`;
        const cached = cacheUtils.get(cacheKey);

        if (cached) {
            return cached;
        }

        const result = await fastOperations.fastFind(model, filter, { limit: 50 });
        if (result.success) {
            cacheUtils.set(cacheKey, result.data);
        }

        return result;
    }
};

module.exports = {
    connectDatabase,
    databaseConfig,
    fastOperations,
    cacheUtils
};
