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

// Test GET requests
function testGETRequest(endpoint) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: endpoint,
            method: 'GET'
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
        
        req.end();
    });
}

// Comprehensive dashboard AI testing
async function testDashboardAI() {
    console.log('🎯 TESTING AI AGENT RESPONSES IN ALL DASHBOARDS\n');
    console.log('='.repeat(60));
    
    let totalTests = 0;
    let passedTests = 0;
    let responseTimes = [];
    
    // ==================== STUDENT DASHBOARD AI TESTS ====================
    console.log('\n👨‍🎓 STUDENT DASHBOARD AI AGENT');
    console.log('-'.repeat(50));
    
    const studentTests = [
        {
            name: 'Python Programming Help',
            endpoint: '/ai/student/chat',
            data: {
                message: 'Explain Python variables and data types with examples',
                user_id: 'student_001',
                subject: 'Python Programming',
                user_name: 'John Student',
                context: { year: '2', branch: 'CSE', section: 'A' }
            }
        },
        {
            name: 'Mathematics Doubt',
            endpoint: '/ai/student/chat',
            data: {
                message: 'What are derivatives in calculus and how are they used?',
                user_id: 'student_002',
                subject: 'Mathematics',
                user_name: 'Jane Student',
                context: { year: '2', branch: 'CSE', section: 'B' }
            }
        },
        {
            name: 'Study Guidance',
            endpoint: '/ai/student/chat',
            data: {
                message: 'How can I improve my programming skills effectively?',
                user_id: 'student_003',
                subject: 'General',
                user_name: 'Bob Student',
                context: { year: '2', branch: 'CSE', section: 'A' }
            }
        },
        {
            name: 'Assignment Help',
            endpoint: '/ai/student/chat',
            data: {
                message: 'Help me understand data structures for my assignment',
                user_id: 'student_004',
                subject: 'Data Structures',
                user_name: 'Alice Student',
                context: { year: '2', branch: 'CSE', section: 'C' }
            }
        }
    ];
    
    for (const test of studentTests) {
        totalTests++;
        console.log(`\n📤 ${test.name}`);
        
        try {
            const startTime = Date.now();
            const result = await testAPIRequest(test.endpoint, test.data);
            const responseTime = Date.now() - startTime;
            responseTimes.push(responseTime);
            
            if (result.response) {
                console.log(`✅ Response: ${result.response.substring(0, 100)}...`);
                console.log(`🕐 Response Time: ${responseTime}ms`);
                console.log('🎯 Student AI: Working correctly');
                passedTests++;
            } else {
                console.log('❌ No response from Student AI');
                console.log('Error:', result.error || 'Unknown error');
            }
        } catch (error) {
            console.log(`❌ Student AI test failed: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // ==================== FACULTY DASHBOARD AI TESTS ====================
    console.log('\n\n👨‍🏫 FACULTY DASHBOARD AI AGENT');
    console.log('-'.repeat(50));
    
    const facultyTests = [
        {
            name: 'AI Attendance Marking',
            endpoint: '/ai/faculty/chat',
            data: {
                message: 'How can I use AI to mark attendance for my CSE-A class?',
                user_id: 'faculty_001',
                action: 'attendance',
                subject: 'Computer Science',
                user_name: 'Dr. Smith Faculty',
                context: { className: 'CSE-A', studentsCount: 45 }
            }
        },
        {
            name: 'Exam Paper Generation',
            endpoint: '/ai/faculty/chat',
            data: {
                message: 'Generate a multiple choice exam paper for Python programming with 20 questions',
                user_id: 'faculty_002',
                action: 'exam',
                subject: 'Python Programming',
                user_name: 'Prof. Johnson Faculty',
                context: { className: 'CSE-B' }
            }
        },
        {
            name: 'Material Creation Help',
            endpoint: '/ai/faculty/chat',
            data: {
                message: 'Help me create lecture notes for data structures with examples',
                user_id: 'faculty_003',
                action: 'materials',
                subject: 'Data Structures',
                user_name: 'Dr. Williams Faculty',
                context: { className: 'CSE-A' }
            }
        },
        {
            name: 'Student Analytics',
            endpoint: '/ai/faculty/chat',
            data: {
                message: 'How can I analyze student performance in my programming course?',
                user_id: 'faculty_004',
                action: 'analytics',
                subject: 'Programming',
                user_name: 'Prof. Brown Faculty',
                context: { className: 'CSE-C' }
            }
        }
    ];
    
    for (const test of facultyTests) {
        totalTests++;
        console.log(`\n📤 ${test.name}`);
        
        try {
            const startTime = Date.now();
            const result = await testAPIRequest(test.endpoint, test.data);
            const responseTime = Date.now() - startTime;
            responseTimes.push(responseTime);
            
            if (result.response) {
                console.log(`✅ Response: ${result.response.substring(0, 100)}...`);
                console.log(`🕐 Response Time: ${responseTime}ms`);
                console.log('🎯 Faculty AI: Working correctly');
                passedTests++;
            } else {
                console.log('❌ No response from Faculty AI');
                console.log('Error:', result.error || 'Unknown error');
            }
        } catch (error) {
            console.log(`❌ Faculty AI test failed: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // ==================== ADMIN DASHBOARD AI TESTS ====================
    console.log('\n\n👨‍💼 ADMIN DASHBOARD AI AGENT');
    console.log('-'.repeat(50));
    
    const adminTests = [
        {
            name: 'Student Management',
            endpoint: '/ai/admin/chat',
            data: {
                message: 'What are the best practices for managing student admissions efficiently?',
                user_id: 'admin_001',
                module: 'students',
                action: 'admission',
                user_name: 'Admin User',
                context: { department: 'Academic Affairs', recordsCount: 150 }
            }
        },
        {
            name: 'Faculty Workload Optimization',
            endpoint: '/ai/admin/chat',
            data: {
                message: 'How can I optimize faculty workload distribution across departments?',
                user_id: 'admin_002',
                module: 'faculty',
                action: 'workload',
                user_name: 'Admin Manager',
                context: { department: 'Human Resources', facultyCount: 50 }
            }
        },
        {
            name: 'Fee Collection Management',
            endpoint: '/ai/admin/chat',
            data: {
                message: 'What strategies can improve fee collection rates and reduce defaults?',
                user_id: 'admin_003',
                module: 'fees',
                action: 'collection',
                user_name: 'Finance Admin',
                context: { department: 'Finance', totalAmount: 2500000 }
            }
        },
        {
            name: 'Database Optimization',
            endpoint: '/ai/admin/chat',
            data: {
                message: 'How can I optimize database performance for better system responsiveness?',
                user_id: 'admin_004',
                module: 'database',
                action: 'optimization',
                user_name: 'System Admin',
                context: { department: 'IT', databaseSize: '10GB' }
            }
        }
    ];
    
    for (const test of adminTests) {
        totalTests++;
        console.log(`\n📤 ${test.name}`);
        
        try {
            const startTime = Date.now();
            const result = await testAPIRequest(test.endpoint, test.data);
            const responseTime = Date.now() - startTime;
            responseTimes.push(responseTime);
            
            if (result.response) {
                console.log(`✅ Response: ${result.response.substring(0, 100)}...`);
                console.log(`🕐 Response Time: ${responseTime}ms`);
                console.log('🎯 Admin AI: Working correctly');
                passedTests++;
            } else {
                console.log('❌ No response from Admin AI');
                console.log('Error:', result.error || 'Unknown error');
            }
        } catch (error) {
            console.log(`❌ Admin AI test failed: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // ==================== FAST AI ENDPOINTS TEST ====================
    console.log('\n\n⚡ FAST AI ENDPOINTS TEST');
    console.log('-'.repeat(50));
    
    const fastTests = [
        {
            name: 'Fast Student Chat',
            endpoint: '/ai/fast/chat',
            data: {
                message: 'Quick help with Python syntax',
                user_id: 'fast_student',
                role: 'student',
                user_name: 'Fast Student',
                context: { year: '2', branch: 'CSE' }
            }
        },
        {
            name: 'Fast Faculty Chat',
            endpoint: '/ai/fast/chat',
            data: {
                message: 'Quick attendance tips',
                user_id: 'fast_faculty',
                role: 'faculty',
                user_name: 'Fast Faculty',
                context: { className: 'CSE-A' }
            }
        },
        {
            name: 'Fast Admin Chat',
            endpoint: '/ai/fast/chat',
            data: {
                message: 'Quick system status check',
                user_id: 'fast_admin',
                role: 'admin',
                user_name: 'Fast Admin',
                context: { department: 'IT' }
            }
        }
    ];
    
    for (const test of fastTests) {
        totalTests++;
        console.log(`\n📤 ${test.name}`);
        
        try {
            const startTime = Date.now();
            const result = await testAPIRequest(test.endpoint, test.data);
            const responseTime = Date.now() - startTime;
            responseTimes.push(responseTime);
            
            if (result.response) {
                console.log(`✅ Response: ${result.response.substring(0, 80)}...`);
                console.log(`🕐 Response Time: ${responseTime}ms`);
                console.log('⚡ Fast AI: Working correctly');
                passedTests++;
            } else {
                console.log('❌ No response from Fast AI');
                console.log('Error:', result.error || 'Unknown error');
            }
        } catch (error) {
            console.log(`❌ Fast AI test failed: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // ==================== SYSTEM HEALTH CHECK ====================
    console.log('\n\n🏥 SYSTEM HEALTH CHECK');
    console.log('-'.repeat(50));
    
    totalTests++;
    console.log('\n📤 Checking AI system health...');
    
    try {
        const healthResult = await testGETRequest('/ai/fast/health');
        
        if (healthResult.status === 'healthy') {
            console.log('✅ System Health: HEALTHY');
            console.log(`📊 Database: ${healthResult.database}`);
            console.log(`🚀 Performance: ${healthResult.performance}`);
            console.log(`🕐 Response Time: ${healthResult.response_time}`);
            passedTests++;
        } else {
            console.log('❌ System Health: UNHEALTHY');
        }
    } catch (error) {
        console.log(`❌ Health check failed: ${error.message}`);
    }
    
    // ==================== FINAL RESULTS ====================
    console.log('\n\n📊 DASHBOARD AI TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Passed Tests: ${passedTests}/${totalTests}`);
    console.log(`🎯 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (responseTimes.length > 0) {
        const avgResponseTime = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
        const minResponseTime = Math.min(...responseTimes);
        const maxResponseTime = Math.max(...responseTimes);
        
        console.log(`🕐 Average Response Time: ${avgResponseTime}ms`);
        console.log(`⚡ Fastest Response: ${minResponseTime}ms`);
        console.log(`🐌 Slowest Response: ${maxResponseTime}ms`);
    }
    
    if (passedTests === totalTests) {
        console.log('\n🎉 ALL DASHBOARD AI AGENTS WORKING PERFECTLY!');
        console.log('✅ Student Dashboard AI: Fully functional');
        console.log('✅ Faculty Dashboard AI: Fully functional');
        console.log('✅ Admin Dashboard AI: Fully functional');
        console.log('✅ Fast AI Endpoints: Optimized and working');
        console.log('✅ System Health: Excellent');
        console.log('\n🚀 All dashboard AI agents are ready for production!');
    } else {
        console.log(`\n⚠️  ${totalTests - passedTests} tests failed. Check the logs above for details.`);
        console.log('\n🔧 Troubleshooting Tips:');
        console.log('1. Ensure server is running on port 5000');
        console.log('2. Check all API routes are properly mounted');
        console.log('3. Verify AI controllers are functioning');
        console.log('4. Check database connectivity');
    }
    
    return {
        totalTests,
        passedTests,
        successRate: Math.round((passedTests / totalTests) * 100),
        avgResponseTime: responseTimes.length > 0 ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length) : 0,
        status: passedTests === totalTests ? 'success' : 'partial'
    };
}

// Run the dashboard AI test
if (require.main === module) {
    testDashboardAI()
        .then(results => {
            console.log('\n✅ Dashboard AI testing completed');
            process.exit(results.status === 'success' ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Dashboard AI testing failed:', error);
            process.exit(1);
        });
}

module.exports = { testDashboardAI };
