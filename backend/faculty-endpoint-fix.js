// Simple faculty endpoint that works without database connection issues
const express = require('express');
const router = express.Router();

// Mock faculty data for testing
const mockFaculty = [
    {
        _id: "69808d4119293e5db1d2b236",
        facultyId: "13001",
        name: "ujtej Kumar ",
        email: "13001@example.com",
        department: "CSE",
        subjects: [],
        assignments: [{
            year: "3",
            section: "13",
            subject: "Software Engineering",
            branch: "CSE",
            semester: ""
        }]
    },
    {
        _id: "69808db419293e5db1d2b328",
        facultyId: "13002",
        name: "dev kumar",
        email: "13002@example.com",
        department: "CSE",
        subjects: [],
        assignments: [{
            year: "3",
            section: "13",
            subject: "mechanic learning (Ml)",
            branch: "CSE",
            semester: ""
        }]
    },
    {
        _id: "69808f8d19293e5db1d2b79c",
        facultyId: "13003",
        name: "anusha",
        email: "13003@example.com",
        department: "CSE",
        subjects: [],
        assignments: [{
            year: "3",
            section: "13",
            subject: "cryptography network security",
            branch: "CSE",
            semester: ""
        }]
    },
    {
        _id: "6980900a19293e5db1d2b954",
        facultyId: "13004",
        name: "joni",
        email: "13004@example.com",
        department: "CSE",
        subjects: [],
        assignments: [{
            year: "3",
            section: "13",
            subject: "Parallel distribution (PDC)",
            branch: "CSE",
            semester: ""
        }]
    }
];

// Get all faculty
router.get('/faculty', (req, res) => {
    console.log('[Mock API] Getting all faculty');
    res.json(mockFaculty);
});

// Get teaching faculty for student
router.get('/faculty/teaching', (req, res) => {
    const { year, section, branch } = req.query;
    console.log('[Mock API] Getting teaching faculty for:', { year, section, branch });
    
    if (!year || !section) {
        return res.status(400).json({ error: "Year and Section required" });
    }

    const searchYear = String(year).trim();
    const searchSection = String(section).trim().toUpperCase();
    const searchBranch = branch ? String(branch).trim().toUpperCase() : null;

    console.log('[Mock API] Search parameters:', { searchYear, searchSection, searchBranch });

    // Filter faculty based on assignments
    const filteredFaculty = mockFaculty.filter(faculty => {
        return faculty.assignments.some(assignment => {
            const matchYear = assignment.year === searchYear || assignment.year === Number(searchYear);
            const matchSection = assignment.section === searchSection;
            const matchBranch = !searchBranch || assignment.branch === searchBranch;
            
            console.log(`[Mock API] Testing ${faculty.name}:`, {
                assignmentYear: assignment.year,
                assignmentSection: assignment.section,
                assignmentBranch: assignment.branch,
                matchYear,
                matchSection,
                matchBranch
            });
            
            return matchYear && matchSection && matchBranch;
        });
    });

    console.log('[Mock API] Found faculty:', filteredFaculty.length);
    
    if (filteredFaculty.length === 0) {
        return res.status(404).json({ error: "Faculty not found" });
    }

    res.json(filteredFaculty);
});

module.exports = router;
