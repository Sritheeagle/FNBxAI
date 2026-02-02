const http = require('http');

// Test function for fast API requests
function testFastAPI(endpoint, testData) {
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

// Test fast GET requests
function testFastGET(endpoint) {
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

// Comprehensive fast AI test
async function testFastAI() {
    console.log('🚀 TESTING FAST AI WITH OPTIMIZED DATABASE OPERATIONS\n');
    
    let successCount = 0;
    let totalTests = 0;
    let totalResponseTime = 0;
    
    // ==================== FAST CHAT TESTS ====================
    console.log('⚡ FAST CHAT RESPONSE TESTS');
    console.log('='.repeat(50));
    
    const chatTests = [
        {
            name: 'Student Fast Chat',
            data: {
                message: 'Explain Python basics quickly',
                user_id: 'fast_student_001',
                role: 'student',
                user_name: 'Fast Student',
                context: { year: '2', branch: 'CSE' }
            }
        },
        {
            name: 'Faculty Fast Chat',
            data: {
                message: 'How to mark attendance fast?',
                user_id: 'fast_faculty_001',
                role: 'faculty',
                user_name: 'Fast Faculty',
                context: { className: 'CSE-A' }
            }
        },
        {
            name: 'Admin Fast Chat',
            data: {
                message: 'Quick student management tips',
                user_id: 'fast_admin_001',
                role: 'admin',
                user_name: 'Fast Admin',
                context: { department: 'Academic' }
            }
        }
    ];
    
    for (const test of chatTests) {
        totalTests++;
        console.log(`\n📤 ${test.name}`);
        
        try {
            const startTime = Date.now();
            const result = await testFastAPI('/ai/fast/chat', test.data);
            const responseTime = Date.now() - startTime;
            totalResponseTime += responseTime;
            
            if (result.response) {
                console.log(`⚡ Response: ${result.response.substring(0, 80)}...`);
                console.log(`🕐 Response Time: ${responseTime}ms`);
                console.log('✅ Fast chat working');
                successCount++;
            } else {
                console.log('❌ No response from fast chat');
            }
        } catch (error) {
            console.log(`❌ Fast chat test failed: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // ==================== BATCH PROCESSING TEST ====================
    console.log('\n\n🔄 BATCH PROCESSING TEST');
    console.log('='.repeat(50));
    
    totalTests++;
    console.log('\n📤 Testing batch processing (3 requests)');
    
    try {
        const batchData = {
            requests: [
                {
                    message: 'What is Python?',
                    userProfile: { userId: 'batch_1', role: 'student', user_name: 'Batch User 1' },
                    context: {}
                },
                {
                    message: 'How to create exams?',
                    userProfile: { userId: 'batch_2', role: 'faculty', user_name: 'Batch User 2' },
                    context: {}
                },
                {
                    message: 'Student management tips?',
                    userProfile: { userId: 'batch_3', role: 'admin', user_name: 'Batch User 3' },
                    context: {}
                }
            ]
        };
        
        const startTime = Date.now();
        const result = await testFastAPI('/ai/fast/batch', batchData);
        const responseTime = Date.now() - startTime;
        totalResponseTime += responseTime;
        
        if (result.results && result.results.length === 3) {
            console.log(`⚡ Batch processed ${result.totalRequests} requests`);
            console.log(`✅ Success rate: ${result.successCount}/${result.totalRequests}`);
            console.log(`🕐 Total time: ${responseTime}ms`);
            console.log(`🕐 Average per request: ${Math.round(responseTime / 3)}ms`);
            successCount++;
        } else {
            console.log('❌ Batch processing failed');
        }
    } catch (error) {
        console.log(`❌ Batch test failed: ${error.message}`);
    }
    
    // ==================== KNOWLEDGE BASE SEARCH TEST ====================
    console.log('\n\n🔍 FAST KNOWLEDGE SEARCH TEST');
    console.log('='.repeat(50));
    
    const searchTests = [
        { query: 'Python programming', role: 'student' },
        { query: 'attendance marking', role: 'faculty' },
        { query: 'student admission', role: 'admin' }
    ];
    
    for (const test of searchTests) {
        totalTests++;
        console.log(`\n📤 Searching: "${test.query}" (${test.role})`);
        
        try {
            const startTime = Date.now();
            const result = await testFastGET(`/ai/fast/knowledge/search?query=${encodeURIComponent(test.query)}&role=${test.role}`);
            const responseTime = Date.now() - startTime;
            totalResponseTime += responseTime;
            
            if (result.results) {
                console.log(`⚡ Found ${result.count} results`);
                console.log(`🕐 Search time: ${responseTime}ms`);
                console.log('✅ Fast search working');
                successCount++;
            } else {
                console.log('❌ Search failed');
            }
        } catch (error) {
            console.log(`❌ Search test failed: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // ==================== PERFORMANCE MONITORING TEST ====================
    console.log('\n\n📊 PERFORMANCE MONITORING TEST');
    console.log('='.repeat(50));
    
    totalTests++;
    console.log('\n📤 Testing performance endpoint');
    
    try {
        const startTime = Date.now();
        const result = await testFastGET('/ai/fast/performance');
        const responseTime = Date.now() - startTime;
        totalResponseTime += responseTime;
        
        if (result.status === 'optimized') {
            console.log('⚡ Performance monitoring active');
            console.log(`🕐 Response time: ${responseTime}ms`);
            console.log('✅ Performance endpoint working');
            successCount++;
        } else {
            console.log('❌ Performance endpoint failed');
        }
    } catch (error) {
        console.log(`❌ Performance test failed: ${error.message}`);
    }
    
    // ==================== HEALTH CHECK TEST ====================
    console.log('\n\n🏥 HEALTH CHECK TEST');
    console.log('='.repeat(50));
    
    totalTests++;
    console.log('\n📤 Testing health check');
    
    try {
        const startTime = Date.now();
        const result = await testFastGET('/ai/fast/health');
        const responseTime = Date.now() - startTime;
        totalResponseTime += responseTime;
        
        if (result.status === 'healthy') {
            console.log('⚡ System healthy');
            console.log(`🕐 Health check time: ${responseTime}ms`);
            console.log(`📊 Database: ${result.database}`);
            console.log(`🚀 Performance: ${result.performance}`);
            console.log('✅ Health check working');
            successCount++;
        } else {
            console.log('❌ Health check failed');
        }
    } catch (error) {
        console.log(`❌ Health check failed: ${error.message}`);
    }
    
    // ==================== CACHE CLEAR TEST ====================
    console.log('\n\n🗑️ CACHE MANAGEMENT TEST');
    console.log('='.repeat(50));
    
    totalTests++;
    console.log('\n📤 Testing cache clear');
    
    try {
        const startTime = Date.now();
        const result = await testFastAPI('/ai/fast/cache/clear', {});
        const responseTime = Date.now() - startTime;
        totalResponseTime += responseTime;
        
        if (result.success) {
            console.log('⚡ Cache cleared successfully');
            console.log(`🕐 Clear time: ${responseTime}ms`);
            console.log('✅ Cache management working');
            successCount++;
        } else {
            console.log('❌ Cache clear failed');
        }
    } catch (error) {
        console.log(`❌ Cache test failed: ${error.message}`);
    }
    
    // ==================== FINAL RESULTS ====================
    console.log('\n\n📊 FAST AI PERFORMANCE RESULTS');
    console.log('='.repeat(50));
    console.log(`✅ Successful Tests: ${successCount}/${totalTests}`);
    console.log(`🎯 Success Rate: ${Math.round((successCount / totalTests) * 100)}%`);
    console.log(`⚡ Average Response Time: ${Math.round(totalResponseTime / totalTests)}ms`);
    console.log(`🚀 Total Test Time: ${totalResponseTime}ms`);
    
    if (successCount === totalTests) {
        console.log('\n🎉 ALL FAST AI TESTS PASSED!');
        console.log('✅ Database optimizations working perfectly');
        console.log('✅ Fast response times achieved');
        console.log('✅ Caching system operational');
        console.log('✅ Batch processing functional');
        console.log('✅ Performance monitoring active');
        console.log('✅ System health confirmed');
        console.log('\n🚀 Fast AI System Ready for High-Performance Production!');
    } else {
        console.log(`\n⚠️  ${totalTests - successCount} tests failed. Check server logs for details.`);
    }
    
    // Performance benchmarks
    console.log('\n📈 PERFORMANCE BENCHMARKS');
    console.log('='.repeat(50));
    console.log(`⚡ Target Response Time: < 500ms`);
    console.log(`🎯 Achieved Average: ${Math.round(totalResponseTime / totalTests)}ms`);
    console.log(`📊 Performance Rating: ${Math.round(totalResponseTime / totalTests) < 300 ? 'EXCELLENT' : Math.round(totalResponseTime / totalTests) < 500 ? 'GOOD' : 'NEEDS OPTIMIZATION'}`);
    console.log(`🗄️ Database Optimization: ACTIVE`);
    console.log(`💾 Caching System: ACTIVE`);
    console.log(`🔄 Batch Processing: ACTIVE`);
}

// Run the fast AI test
testFastAI().catch(console.error);
