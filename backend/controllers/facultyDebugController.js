const Faculty = require('../models/Faculty');

// Debug endpoint to test faculty matching
exports.debugFacultyMatching = async (req, res) => {
    try {
        const { year, section, branch } = req.query;
        
        console.log('[Debug] Faculty matching request:', { year, section, branch });
        
        // Get all faculty first
        const allFaculty = await Faculty.find().select('-password');
        console.log('[Debug] Total faculty found:', allFaculty.length);
        
        // Log each faculty's assignments
        allFaculty.forEach(faculty => {
            console.log(`[Debug] Faculty ${faculty.name} (${faculty.facultyId}):`, faculty.assignments);
        });
        
        // Test the matching logic
        const searchYear = String(year).trim();
        const searchSection = String(section).trim().toUpperCase();
        const searchBranch = branch ? String(branch).trim().toUpperCase() : null;
        
        console.log('[Debug] Search parameters:', { searchYear, searchSection, searchBranch });
        
        // Test exact match
        const exactMatches = allFaculty.filter(faculty => {
            return faculty.assignments.some(assignment => {
                const matchYear = assignment.year === searchYear || assignment.year === Number(searchYear);
                const matchSection = assignment.section === searchSection;
                const matchBranch = !searchBranch || assignment.branch === searchBranch;
                
                console.log(`[Debug] Testing ${faculty.name}:`, {
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
        
        console.log('[Debug] Exact matches found:', exactMatches.length);
        
        res.json({
            searchParams: { searchYear, searchSection, searchBranch },
            totalFaculty: allFaculty.length,
            exactMatches: exactMatches.length,
            allFaculty: allFaculty.map(f => ({
                id: f.facultyId,
                name: f.name,
                assignments: f.assignments
            })),
            matchedFaculty: exactMatches.map(f => ({
                id: f.facultyId,
                name: f.name,
                assignments: f.assignments
            }))
        });
        
    } catch (err) {
        console.error('[Debug] Error:', err);
        res.status(500).json({ error: err.message });
    }
};

// Simple endpoint to get faculty by student parameters
exports.getFacultyForStudent = async (req, res) => {
    try {
        const { studentId } = req.params;
        
        // First get the student details
        const Student = require('../models/Student');
        const student = await Student.findOne({ sid: studentId }).select('-password');
        
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        
        console.log('[Faculty] Getting faculty for student:', student);
        
        // Find faculty matching student's year, section, and branch
        const facultyList = await Faculty.find({
            assignments: {
                $elemMatch: {
                    $and: [
                        {
                            $or: [
                                { year: String(student.year) },
                                { year: !isNaN(student.year) ? Number(student.year) : student.year }
                            ]
                        },
                        { section: { $regex: new RegExp(`(^|[\\s,])(${student.section}|ALL)($|[\\s,])`, 'i') } },
                        {
                            $or: [
                                { branch: { $regex: new RegExp(`(^|[\\s,])(${student.branch}|ALL)($|[\\s,])`, 'i') } },
                                { branch: { $exists: false } },
                                { branch: null },
                                { branch: "" }
                            ]
                        }
                    ]
                }
            }
        }).select('-password');
        
        // Filter assignments to only include those matching the student's criteria
        const filteredFaculty = facultyList.map(faculty => {
            const f = faculty.toObject ? faculty.toObject() : faculty;
            f.assignments = f.assignments.filter(a => {
                const yMatch = String(a.year) === String(student.year) || a.year === Number(student.year);
                const sMatch = (a.section && String(a.section).toUpperCase().includes('ALL')) || 
                               (a.section && new RegExp(`(^|[\\s,])(${student.section})($|[\\s,])`, 'i').test(a.section));
                const bMatch = !student.branch || 
                               (a.branch && String(a.branch).toUpperCase().includes('ALL')) || 
                               !a.branch || 
                               (a.branch && new RegExp(`(^|[\\s,])(${student.branch})($|[\\s,])`, 'i').test(a.branch));
                return yMatch && sMatch && bMatch;
            });
            return f;
        }).filter(f => f.assignments.length > 0);

        console.log('[Faculty] Found faculty for student:', filteredFaculty.length);
        
        res.json({
            student: {
                id: student.sid,
                name: student.name,
                year: student.year,
                section: student.section,
                branch: student.branch
            },
            faculty: filteredFaculty
        });
        
    } catch (err) {
        console.error('[Faculty] Error getting faculty for student:', err);
        res.status(500).json({ error: err.message });
    }
};
