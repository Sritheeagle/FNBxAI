const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Faculty = require('./models/Faculty');

dotenv.config();

const testQuery = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to DB');

        const searchYear = "1";
        const searchSection = "A";
        const searchBranch = "CSE";

        console.log(`🔎 Searching for: Year=${searchYear}, Section=${searchSection}, Branch=${searchBranch}`);

        // EXACT LOGIC FROM dataController.js
        const query = {
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
                        // Relaxed Branch Logic
                        /*
                        searchBranch ? {
                            $or: [
                                { branch: { $regex: new RegExp(`(^|[\\s,])(${searchBranch}|ALL)($|[\\s,])`, 'i') } },
                                { branch: { $exists: false } },
                                { branch: null },
                                { branch: "" }
                            ]
                        } : {}
                        */
                    ]
                }
            }
        };

        console.log('📋 Running Query...');
        const faculty = await Faculty.find(query);
        console.log(`👉 Found ${faculty.length} faculty BEFORE JS filtering.`);

        // Now JS Filtering (mimicking controller)
        const filtered = faculty.filter(f => {
            return f.assignments.some(a => {
                const yMatch = String(a.year) === searchYear || a.year === Number(searchYear);

                const sMatch = (a.section && String(a.section).toUpperCase().includes('ALL')) ||
                    (a.section && new RegExp(`(^|[\\s,])(${searchSection})($|[\\s,])`, 'i').test(a.section));

                // Bidirectional Branch Match (New Logic)
                const bMatch = !searchBranch ||
                    !a.branch ||
                    String(a.branch).toUpperCase().includes('ALL') ||
                    String(a.branch).toUpperCase().includes(searchBranch) ||
                    searchBranch.includes(String(a.branch).toUpperCase().trim());

                if (yMatch && sMatch && bMatch) {
                    console.log(`   ✅ Match found for ${f.name}: [Y:${a.year} S:${a.section} B:${a.branch}]`);
                    return true;
                }
                return false;
            });
        });

        console.log(`👉 Found ${filtered.length} faculty AFTER JS filtering.`);

        if (filtered.length === 0) {
            console.log('⚠️  NO MATCHES. Dumping all assignments for debugging:');
            const all = await Faculty.find({});
            all.forEach(f => {
                console.log(`\nFaculty: ${f.name}`);
                f.assignments.forEach(a => console.log(` - [Y:${a.year} S:${a.section} B:${a.branch}]`));
            });
        }

        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

testQuery();
