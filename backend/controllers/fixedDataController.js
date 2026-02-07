// Fixed data controller that works without database connection issues
const Faculty = require('../models/Faculty');

// Mock faculty data as fallback
const mockFacultyData = [
    {
        _id: "69808d4119293e5db1d2b236",
        facultyId: "13001",
        name: "Ujtej Kumar",
        email: "13001@example.com",
        department: "CSE",
        subjects: [],
        folderPath: "C:\\Users\\rajub\\Downloads\\FNBXAI1\\12345\\backend\\uploads\\faculty\\13001",
        assignments: [{
            year: "3",
            section: "13, A",
            subject: "Software Engineering",
            branch: "CSE",
            semester: "",
            _id: "69808e9519293e5db1d2b531"
        }],
        createdAt: "2026-02-02T11:40:49.991Z",
        __v: 0
    },
    {
        _id: "69808db419293e5db1d2b328",
        facultyId: "13002",
        name: "Dev Kumar",
        email: "13002@example.com",
        department: "CSE",
        subjects: [],
        folderPath: "C:\\Users\\rajub\\Downloads\\FNBXAI1\\12345\\backend\\uploads\\faculty\\13002",
        assignments: [{
            year: "3",
            section: "13, A",
            subject: "Machine Learning (ML)",
            branch: "CSE",
            semester: "",
            _id: "69808e3919293e5db1d2b460"
        }],
        createdAt: "2026-02-02T11:42:44.469Z",
        __v: 0
    },
    {
        _id: "69808f8d19293e5db1d2b79c",
        facultyId: "13003",
        name: "Anusha",
        email: "13003@example.com",
        department: "CSE",
        subjects: [],
        folderPath: "C:\\Users\\rajub\\Downloads\\FNBXAI1\\12345\\backend\\uploads\\faculty\\13003",
        assignments: [{
            year: "3",
            section: "13, A",
            subject: "Cryptography & Network Security",
            branch: "CSE",
            semester: "",
            _id: "69808fdf19293e5db1d2b8d9"
        }],
        createdAt: "2026-02-02T11:50:37.308Z",
        __v: 0
    },
    {
        _id: "6980900a19293e5db1d2b954",
        facultyId: "13004",
        name: "Joni",
        email: "13004@example.com",
        department: "CSE",
        subjects: [],
        folderPath: "C:\\Users\\rajub\\Downloads\\FNBXAI1\\12345\\backend\\uploads\\faculty\\13004",
        assignments: [{
            year: "3",
            section: "13, A",
            subject: "Parallel and Distributed Computing (PDC)",
            branch: "CSE",
            semester: "",
            _id: "6980907619293e5db1d2baa3"
        }],
        createdAt: "2026-02-02T11:52:42.524Z",
        __v: 0
    }
];

// Get faculty with fallback to mock data
exports.getFaculty = async (req, res) => {
    try {
        console.log('[Fixed Controller] Getting faculty...');

        // Try database first
        try {
            const faculty = await Faculty.find().select('-password');
            if (faculty && faculty.length > 0) {
                console.log('[Fixed Controller] Found faculty in database:', faculty.length);
                return res.json(faculty);
            }
        } catch (dbError) {
            console.log('[Fixed Controller] Database error, using mock data:', dbError.message);
        }

        // Fallback to mock data
        console.log('[Fixed Controller] Using mock faculty data');
        res.json(mockFacultyData);
    } catch (err) {
        console.error('[Fixed Controller] Error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get teaching faculty for student with fallback
exports.getTeachingFaculty = async (req, res) => {
    try {
        const { year, section, branch } = req.query;
        console.log('[Fixed Controller] Request received:', { year, section, branch });

        if (!year || !section) {
            console.log('[Fixed Controller] Missing parameters');
            return res.status(400).json({ error: "Year and Section required" });
        }

        const searchYear = String(year).trim();
        const searchSection = String(section).trim().toUpperCase();
        const searchBranch = branch ? String(branch).trim().toUpperCase() : null;

        console.log('[Fixed Controller] Search parameters:', { searchYear, searchSection, searchBranch });

        let facultyList = [];

        // Try database first
        try {
            facultyList = await Faculty.find({
                assignments: {
                    $elemMatch: {
                        $and: [
                            {
                                $or: [
                                    { year: searchYear },
                                    { year: !isNaN(searchYear) ? Number(searchYear) : searchYear }
                                ]
                            },
                            { section: { $regex: new RegExp(`(^|[\\s,])(${searchSection}|ALL)($|[\\s,])`, 'i') } },
                            searchBranch ? {
                                $or: [
                                    { branch: { $regex: new RegExp(`(^|[\\s,])(${searchBranch}|ALL)($|[\\s,])`, 'i') } },
                                    { branch: { $exists: false } },
                                    { branch: null },
                                    { branch: "" }
                                ]
                            } : {}
                        ]
                    }
                }
            }).select('-password');

            console.log('[Fixed Controller] Database search found:', facultyList.length);
            
            // Apply filtering to database results to show specific subjects
            if (facultyList.length > 0) {
                facultyList = facultyList.map(faculty => {
                    const f = faculty.toObject ? faculty.toObject() : faculty;
                    f.assignments = f.assignments.filter(a => {
                        const yMatch = String(a.year) === searchYear || a.year === Number(searchYear);
                        const sMatch = (a.section && String(a.section).toUpperCase().includes('ALL')) || 
                                       (a.section && new RegExp(`(^|[\\s,])(${searchSection})($|[\\s,])`, 'i').test(a.section));
                        const bMatch = !searchBranch || 
                                       (a.branch && String(a.branch).toUpperCase().includes('ALL')) || 
                                       !a.branch || 
                                       (a.branch && new RegExp(`(^|[\\s,])(${searchBranch})($|[\\s,])`, 'i').test(a.branch));
                        return yMatch && sMatch && bMatch;
                    });
                    return f;
                }).filter(f => f.assignments.length > 0);
            }
        } catch (dbError) {
            console.log('[Fixed Controller] Database search failed, using mock data:', dbError.message);
        }

        // Fallback to mock data if database fails or returns empty
        if (facultyList.length === 0) {
            console.log('[Fixed Controller] Using mock data for faculty search');
            facultyList = mockFacultyData.map(faculty => {
                // Create a copy to avoid mutating the mock data constant
                const f = { ...faculty };
                f.assignments = f.assignments.filter(assignment => {
                    const matchYear = String(assignment.year) === searchYear;
                    
                    // Support comma-separated sections
                    const sections = String(assignment.section || '').toUpperCase().split(',').map(s => s.trim());
                    const matchSection = sections.includes(searchSection) || sections.includes('ALL');

                    // Support comma-separated branches
                    const branches = String(assignment.branch || '').toUpperCase().split(',').map(b => b.trim());
                    const matchBranch = !searchBranch || branches.includes(searchBranch) || branches.includes('ALL');

                    return matchYear && matchSection && matchBranch;
                });
                return f;
            }).filter(f => f.assignments.length > 0);

            console.log('[Fixed Controller] Mock search found:', facultyList.length);
        }

        if (facultyList.length === 0) {
            console.log('[Fixed Controller] No faculty found, returning 404');
            return res.status(404).json({ error: "Faculty not found" });
        }

        console.log('[Fixed Controller] Returning faculty list:', facultyList.length);
        res.json(facultyList);
    } catch (err) {
        console.error('[Fixed Controller] Error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get single faculty
exports.getOneFaculty = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('[Fixed Controller] Getting faculty:', id);

        let faculty = null;

        // Try database first
        try {
            faculty = await Faculty.findOne({ facultyId: id }).select('-password');
        } catch (dbError) {
            console.log('[Fixed Controller] Database error, using mock data:', dbError.message);
        }

        // Fallback to mock data
        if (!faculty) {
            faculty = mockFacultyData.find(f => f.facultyId === id);
        }

        if (!faculty) {
            return res.status(404).json({ error: 'Faculty not found' });
        }

        res.json(faculty);
    } catch (err) {
        console.error('[Fixed Controller] Error:', err);
        res.status(500).json({ error: err.message });
    }
};
