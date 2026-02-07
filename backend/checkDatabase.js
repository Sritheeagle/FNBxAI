// Quick Database Check Script
// This will show what faculty and subjects exist in the database

const mongoose = require('mongoose');
const Faculty = require('./models/Faculty');
const Course = require('./models/Course');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/college-management', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ Connected to MongoDB');
    checkDatabase();
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});

async function checkDatabase() {
    console.log('\n========================================');
    console.log('📊 DATABASE CHECK - Faculty & Subjects');
    console.log('========================================\n');

    try {
        // 1. Check Faculty
        console.log('👥 FACULTY IN DATABASE:');
        console.log('─'.repeat(60));

        const faculty = await Faculty.find({}).select('-password');
        console.log(`Total faculty: ${faculty.length}\n`);

        if (faculty.length === 0) {
            console.log('⚠️  NO FACULTY FOUND IN DATABASE!');
            console.log('   You need to add faculty in Admin Dashboard\n');
        } else {
            faculty.forEach((fac, index) => {
                console.log(`${index + 1}. ${fac.name} (${fac.email})`);
                console.log(`   Faculty ID: ${fac.facultyId}`);
                console.log(`   Department: ${fac.department}`);
                console.log(`   Assignments: ${(fac.assignments || []).length}`);

                if (fac.assignments && fac.assignments.length > 0) {
                    fac.assignments.forEach((assign, i) => {
                        console.log(`      ${i + 1}. ${assign.subject}`);
                        console.log(`         Year: ${assign.year}, Section: ${assign.section}, Branch: ${assign.branch}`);
                    });
                } else {
                    console.log('      ⚠️  NO ASSIGNMENTS!');
                }
                console.log('');
            });
        }

        // 2. Check Courses
        console.log('\n📚 SUBJECTS/COURSES IN DATABASE:');
        console.log('─'.repeat(60));

        const courses = await Course.find({});
        console.log(`Total courses: ${courses.length}\n`);

        if (courses.length === 0) {
            console.log('⚠️  NO COURSES FOUND IN DATABASE!');
            console.log('   You need to add subjects in Admin Dashboard\n');
        } else {
            // Group by year
            const byYear = {};
            courses.forEach(course => {
                const year = course.year || 1;
                if (!byYear[year]) byYear[year] = [];
                byYear[year].push(course);
            });

            Object.keys(byYear).sort().forEach(year => {
                console.log(`Year ${year}:`);
                byYear[year].forEach(course => {
                    console.log(`   • ${course.name} (${course.code})`);
                    console.log(`     Semester: ${course.semester}, Section: ${course.section}, Branch: ${course.branch}`);
                });
                console.log('');
            });
        }

        // 3. Match Analysis
        console.log('\n🔍 FACULTY-SUBJECT MATCHING ANALYSIS:');
        console.log('─'.repeat(60));

        if (faculty.length === 0 || courses.length === 0) {
            console.log('⚠️  Cannot perform matching - missing faculty or courses\n');
        } else {
            console.log('Checking which courses have faculty assigned...\n');

            let matchedCount = 0;
            let unmatchedCount = 0;

            courses.forEach(course => {
                const courseName = (course.name || '').trim().toUpperCase();
                const courseCode = (course.code || '').trim().toUpperCase();

                // Find faculty with matching assignment
                const matchedFaculty = faculty.filter(fac => {
                    return (fac.assignments || []).some(assign => {
                        const assSubject = (assign.subject || '').trim().toUpperCase();
                        return assSubject === courseName ||
                            assSubject === courseCode ||
                            courseName.includes(assSubject) ||
                            assSubject.includes(courseName);
                    });
                });

                if (matchedFaculty.length > 0) {
                    console.log(`✅ ${course.name}`);
                    matchedFaculty.forEach(fac => {
                        console.log(`   → Faculty: ${fac.name}`);
                    });
                    matchedCount++;
                } else {
                    console.log(`❌ ${course.name}`);
                    console.log(`   → No faculty assigned!`);
                    unmatchedCount++;
                }
            });

            console.log(`\nSummary:`);
            console.log(`   ✅ Courses with faculty: ${matchedCount}`);
            console.log(`   ❌ Courses without faculty: ${unmatchedCount}`);
        }

        // 4. Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('─'.repeat(60));

        if (faculty.length === 0) {
            console.log('1. Add faculty in Admin Dashboard → Faculty Management');
            console.log('2. Set name, email, department');
        }

        if (faculty.length > 0 && faculty.every(f => !f.assignments || f.assignments.length === 0)) {
            console.log('1. Faculty exist but have no assignments');
            console.log('2. Edit each faculty member and add assignments:');
            console.log('   - Subject: Must match course name EXACTLY');
            console.log('   - Year, Section, Branch: Match your students');
        }

        if (unmatchedCount > 0) {
            console.log(`1. ${unmatchedCount} courses have no faculty assigned`);
            console.log('2. Add faculty assignments with matching subject names');
        }

        if (matchedCount > 0) {
            console.log(`✅ ${matchedCount} courses are ready to show faculty!`);
            console.log('   Student Dashboard should display faculty for these subjects');
        }

        console.log('\n========================================');
        console.log('✅ Database check complete!');
        console.log('========================================\n');

    } catch (error) {
        console.error('❌ Error checking database:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}
