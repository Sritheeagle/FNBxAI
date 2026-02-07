require('dotenv').config();
const mongoose = require('mongoose');
const Faculty = require('./models/Faculty');

async function testFacultyMatching() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to database');

        // Test parameters
        const searchYear = "3";
        const searchSection = "13";
        const searchBranch = "CSE";

        console.log('Search parameters:', { searchYear, searchSection, searchBranch });

        // Get all faculty
        const allFaculty = await Faculty.find();
        console.log('Total faculty:', allFaculty.length);

        // Test each faculty
        allFaculty.forEach(faculty => {
            console.log(`\nFaculty: ${faculty.name} (${faculty.facultyId})`);
            console.log('Assignments:', JSON.stringify(faculty.assignments, null, 2));
            
            const hasMatch = faculty.assignments.some(assignment => {
                const matchYear = assignment.year === searchYear || assignment.year === Number(searchYear);
                const matchSection = assignment.section === searchSection;
                const matchBranch = !searchBranch || assignment.branch === searchBranch;
                
                console.log(`  Assignment: year=${assignment.year}, section=${assignment.section}, branch=${assignment.branch}`);
                console.log(`  Matches: year=${matchYear}, section=${matchSection}, branch=${matchBranch}`);
                
                return matchYear && matchSection && matchBranch;
            });
            
            console.log(`  Overall match: ${hasMatch}`);
        });

        // Test MongoDB query
        const facultyList = await Faculty.find({
            assignments: {
                $elemMatch: {
                    year: searchYear,
                    section: searchSection,
                    branch: searchBranch
                }
            }
        });

        console.log('\nMongoDB query result:', facultyList.length);
        facultyList.forEach(f => console.log(`  - ${f.name} (${f.facultyId})`));

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
    }
}

testFacultyMatching();
