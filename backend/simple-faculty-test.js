require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const Faculty = require('./models/Faculty');

const app = express();

// Simple test endpoint
app.get('/test-faculty', async (req, res) => {
    try {
        const { year, section, branch } = req.query;
        
        console.log('Test endpoint called with:', { year, section, branch });
        
        if (!year || !section) {
            return res.status(400).json({ error: "Year and Section required" });
        }

        const searchYear = String(year).trim();
        const searchSection = String(section).trim().toUpperCase();
        const searchBranch = branch ? String(branch).trim().toUpperCase() : null;

        console.log('Search parameters:', { searchYear, searchSection, searchBranch });

        // Test the exact same query as our test script
        const facultyList = await Faculty.find({
            assignments: {
                $elemMatch: {
                    year: searchYear,
                    section: searchSection,
                    branch: searchBranch
                }
            }
        }).select('-password');

        console.log('Found faculty:', facultyList.length);

        if (facultyList.length === 0) {
            return res.status(404).json({ error: "Faculty not found" });
        }

        res.json(facultyList);
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ error: err.message });
    }
});

// Start server
const PORT = 5001;
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('Connected to database');
        app.listen(PORT, () => {
            console.log(`Test server running on port ${PORT}`);
            console.log(`Test URL: http://localhost:${PORT}/test-faculty?year=3&section=13&branch=CSE`);
        });
    })
    .catch(err => {
        console.error('Database connection error:', err);
    });
