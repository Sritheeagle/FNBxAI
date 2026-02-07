const mongoose = require('mongoose');
const Faculty = require('./models/Faculty');
const Course = require('./models/Course');
const fs = require('fs');

// Use the SAME URI as server.js
const uri = 'mongodb+srv://FNBXAI_db_user:1JlyINjrx54rhf9P@cluster0.kdss6af.mongodb.net/friendly_notebook?appName=Cluster0';

mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
    checkDatabase();
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

async function checkDatabase() {
    let output = '';
    output += '='.repeat(60) + '\n';
    output += 'DATABASE CHECK - Faculty & Subjects\n';
    output += '='.repeat(60) + '\n\n';

    try {
        // Check Faculty
        const faculty = await Faculty.find({}).select('-password');
        output += `FACULTY COUNT: ${faculty.length}\n\n`;

        faculty.forEach((fac, i) => {
            output += `${i + 1}. ${fac.name} (${fac.email})\n`;
            output += `   ID: ${fac.facultyId}, Dept: ${fac.department}\n`;
            output += `   Assignments: ${(fac.assignments || []).length}\n`;

            if (fac.assignments && fac.assignments.length > 0) {
                fac.assignments.forEach((a, j) => {
                    output += `      - ${a.subject} (Y:${a.year}, S:${a.section}, B:${a.branch})\n`;
                });
            }
            output += '\n';
        });

        // Check Courses
        const courses = await Course.find({});
        output += `\nCOURSES COUNT: ${courses.length}\n\n`;

        courses.forEach((course, i) => {
            output += `${i + 1}. ${course.name} (${course.code})\n`;
            output += `   Year:${course.year}, Sem:${course.semester}, Sec:${course.section}, Branch:${course.branch}\n`;
        });

        // Matching
        output += '\n' + '='.repeat(60) + '\n';
        output += 'MATCHING ANALYSIS\n';
        output += '='.repeat(60) + '\n\n';

        let matched = 0, unmatched = 0;
        courses.forEach(course => {
            const courseName = (course.name || '').trim().toUpperCase();
            const courseCode = (course.code || '').trim().toUpperCase();

            const matchedFac = faculty.filter(fac => {
                return (fac.assignments || []).some(a => {
                    const assSubject = (a.subject || '').trim().toUpperCase();
                    return assSubject === courseName || assSubject === courseCode ||
                        courseName.includes(assSubject) || assSubject.includes(courseName);
                });
            });

            if (matchedFac.length > 0) {
                output += `✓ ${course.name} -> ${matchedFac.map(f => f.name).join(', ')}\n`;
                matched++;
            } else {
                output += `✗ ${course.name} -> NO FACULTY\n`;
                unmatched++;
            }
        });

        output += `\nMatched: ${matched}, Unmatched: ${unmatched}\n`;

        // Write to file
        fs.writeFileSync('database-check-result.txt', output);
        console.log('\n✅ Check complete! Results saved to: database-check-result.txt');
        console.log(output);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}
