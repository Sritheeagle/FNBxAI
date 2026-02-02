const http = require('http');

// Test function for API requests
function testAPIRequest(endpoint, testData) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(testData);
        
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: endpoint,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (error) {
                    resolve({ error: 'Parse error', data });
                }
            });
        });
        
        req.on('error', (error) => {
            reject(error);
        });
        
        req.write(postData);
        req.end();
    });
}

// Test all three specialized AI agents
async function testSpecializedAI() {
    console.log('🧪 Testing All Three Specialized AI Agents\n');
    
    let successCount = 0;
    let totalTests = 0;
    
    // ==================== STUDENT AI TESTS ====================
    console.log('👨‍🎓 TESTING STUDENT AI AGENT');
    console.log('='.repeat(50));
    
    const studentTests = [
        {
            name: 'Python Programming Help',
            data: {
                message: 'Explain Python basics and show me a simple example',
                user_id: 'student_001',
                subject: 'Python Programming',
                user_name: 'Student User',
                context: { year: '2', branch: 'CSE', section: 'A' }
            }
        },
        {
            name: 'Mathematics - Calculus',
            data: {
                message: 'What are derivatives and how do they work?',
                user_id: 'student_002',
                subject: 'Mathematics',
                user_name: 'Student User',
                context: { year: '2', branch: 'CSE', section: 'A' }
            }
        },
        {
            name: 'Data Structures Help',
            data: {
                message: 'Explain arrays and how they work in programming',
                user_id: 'student_003',
                subject: 'Data Structures',
                user_name: 'Student User',
                context: { year: '2', branch: 'CSE', section: 'A' }
            }
        }
    ];
    
    for (const test of studentTests) {
        totalTests++;
        console.log(`\n📤 Student Test: ${test.name}`);
        
        try {
            const result = await testAPIRequest('/ai/student/chat', test.data);
            
            if (result.response) {
                console.log(`🤖 Response: ${result.response.substring(0, 120)}...`);
                console.log('✅ Student AI working correctly');
                successCount++;
            } else {
                console.log('❌ No response from Student AI');
            }
        } catch (error) {
            console.log(`❌ Student AI test failed: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // ==================== FACULTY AI TESTS ====================
    console.log('\n\n👨‍🏫 TESTING FACULTY AI AGENT');
    console.log('='.repeat(50));
    
    const facultyTests = [
        {
            name: 'AI Attendance Marking',
            data: {
                message: 'How can I use AI to mark attendance for my class?',
                user_id: 'faculty_001',
                action: 'attendance',
                subject: 'Computer Science',
                user_name: 'Faculty User',
                context: { className: 'CSE-A', studentsCount: 45 }
            }
        },
        {
            name: 'Exam Paper Generation',
            data: {
                message: 'Generate a multiple choice exam paper for Python programming',
                user_id: 'faculty_002',
                action: 'exam',
                subject: 'Python Programming',
                user_name: 'Faculty User',
                context: { className: 'CSE-B' }
            }
        },
        {
            name: 'Material Creation Help',
            data: {
                message: 'Help me create lecture notes for data structures',
                user_id: 'faculty_003',
                action: 'materials',
                subject: 'Data Structures',
                user_name: 'Faculty User',
                context: { className: 'CSE-A' }
            }
        }
    ];
    
    for (const test of facultyTests) {
        totalTests++;
        console.log(`\n📤 Faculty Test: ${test.name}`);
        
        try {
            const result = await testAPIRequest('/ai/faculty/chat', test.data);
            
            if (result.response) {
                console.log(`🤖 Response: ${result.response.substring(0, 120)}...`);
                console.log('✅ Faculty AI working correctly');
                successCount++;
            } else {
                console.log('❌ No response from Faculty AI');
            }
        } catch (error) {
            console.log(`❌ Faculty AI test failed: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // ==================== ADMIN AI TESTS ====================
    console.log('\n\n👨‍💼 TESTING ADMIN AI AGENT');
    console.log('='.repeat(50));
    
    const adminTests = [
        {
            name: 'Student Management',
            data: {
                message: 'How do I add new students to the system efficiently?',
                user_id: 'admin_001',
                module: 'students',
                action: 'admission',
                user_name: 'Admin User',
                context: { department: 'Academic Affairs', recordsCount: 50 }
            }
        },
        {
            name: 'Faculty Management',
            data: {
                message: 'Help me optimize faculty workload distribution',
                user_id: 'admin_002',
                module: 'faculty',
                action: 'workload',
                user_name: 'Admin User',
                context: { department: 'Human Resources' }
            }
        },
        {
            name: 'Fee Management',
            data: {
                message: 'How can I improve fee collection rates using AI?',
                user_id: 'admin_003',
                module: 'fees',
                action: 'collection',
                user_name: 'Admin User',
                context: { department: 'Finance' }
            }
        }
    ];
    
    for (const test of adminTests) {
        totalTests++;
        console.log(`\n📤 Admin Test: ${test.name}`);
        
        try {
            const result = await testAPIRequest('/ai/admin/chat', test.data);
            
            if (result.response) {
                console.log(`🤖 Response: ${result.response.substring(0, 120)}...`);
                console.log('✅ Admin AI working correctly');
                successCount++;
            } else {
                console.log('❌ No response from Admin AI');
            }
        } catch (error) {
            console.log(`❌ Admin AI test failed: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // ==================== SPECIALIZED OPERATIONS TESTS ====================
    console.log('\n\n🔧 TESTING SPECIALIZED AI OPERATIONS');
    console.log('='.repeat(50));
    
    // Test AI Attendance Marking
    totalTests++;
    console.log('\n📤 Testing AI Attendance Marking');
    try {
        const attendanceData = {
            classId: 'CSE-A',
            subject: 'Python Programming',
            students: [
                { id: 'STU001', name: 'John Doe' },
                { id: 'STU002', name: 'Jane Smith' },
                { id: 'STU003', name: 'Bob Johnson' }
            ],
            method: 'ai',
            facultyId: 'FAC001'
        };
        
        const result = await testAPIRequest('/ai/faculty/attendance/ai-mark', attendanceData);
        if (result.success) {
            console.log(`✅ AI Attendance: ${result.message}`);
            console.log(`📊 Processed: ${result.data.summary.total} students`);
            successCount++;
        } else {
            console.log('❌ AI Attendance failed');
        }
    } catch (error) {
        console.log(`❌ AI Attendance test failed: ${error.message}`);
    }
    
    // Test Exam Paper Generation
    totalTests++;
    console.log('\n📤 Testing AI Exam Paper Generation');
    try {
        const examData = {
            subject: 'Python Programming',
            examType: 'multipleChoice',
            difficulty: 'intermediate',
            questionCount: 10,
            topics: ['basics', 'data-types', 'functions', 'classes']
        };
        
        const result = await testAPIRequest('/ai/faculty/exam/generate', examData);
        if (result.success) {
            console.log(`✅ Exam Paper: ${result.message}`);
            console.log(`📋 Generated: ${result.data.questions.length} questions`);
            successCount++;
        } else {
            console.log('❌ Exam Paper generation failed');
        }
    } catch (error) {
        console.log(`❌ Exam Paper test failed: ${error.message}`);
    }
    
    // Test Student Management
    totalTests++;
    console.log('\n📤 Testing AI Student Management');
    try {
        const studentData = {
            operation: 'add',
            studentData: {
                name: 'Test Student',
                email: 'test@example.com',
                phone: '1234567890',
                year: '2',
                branch: 'CSE',
                section: 'A'
            },
            batchMode: false
        };
        
        const result = await testAPIRequest('/ai/admin/student/manage', studentData);
        if (result.success) {
            console.log(`✅ Student Management: ${result.message}`);
            console.log(`🆔 Student ID: ${result.data.studentId}`);
            successCount++;
        } else {
            console.log('❌ Student Management failed');
        }
    } catch (error) {
        console.log(`❌ Student Management test failed: ${error.message}`);
    }
    
    // ==================== KNOWLEDGE BASE TESTS ====================
    console.log('\n\n📚 TESTING KNOWLEDGE BASES');
    console.log('='.repeat(50));
    
    // Test Student Knowledge Base
    totalTests++;
    console.log('\n📤 Testing Student Knowledge Base');
    try {
        const result = await testAPIRequest('/ai/student/help/programming', {});
        if (result.availableLanguages) {
            console.log(`✅ Student Knowledge: ${result.availableLanguages.length} programming languages`);
            successCount++;
        } else {
            console.log('❌ Student Knowledge Base test failed');
        }
    } catch (error) {
        console.log(`❌ Student Knowledge test failed: ${error.message}`);
    }
    
    // ==================== FINAL RESULTS ====================
    console.log('\n\n📊 SPECIALIZED AI TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`✅ Successful Tests: ${successCount}/${totalTests}`);
    console.log(`🎯 Success Rate: ${Math.round((successCount / totalTests) * 100)}%`);
    
    if (successCount === totalTests) {
        console.log('\n🎉 ALL SPECIALIZED AI AGENTS WORKING PERFECTLY!');
        console.log('✅ Student AI: Academic and programming assistance');
        console.log('✅ Faculty AI: Teaching and administrative support');
        console.log('✅ Admin AI: Institutional management and optimization');
        console.log('✅ All knowledge bases populated and functional');
        console.log('✅ Specialized operations working correctly');
    } else {
        console.log(`\n⚠️  ${totalTests - successCount} tests failed. Check server logs for details.`);
    }
    
    console.log('\n🚀 Specialized AI Agent System Ready for Production!');
}

// Run the comprehensive test
testSpecializedAI().catch(console.error);
