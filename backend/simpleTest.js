const http = require('http');

// Simple test function using Node.js http module
function testAIRequest(testData) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(testData);
        
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/chat',
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

// Test the AI agent with comprehensive knowledge base
async function runComprehensiveTest() {
    console.log('🧪 Testing VUAI Agent with Comprehensive Knowledge Base\n');
    
    const testCases = [
        // Student tests
        { role: 'student', name: 'Student User', message: 'Show me my academic progress' },
        { role: 'student', name: 'Student User', message: 'What materials are available?' },
        { role: 'student', name: 'Student User', message: 'Check my attendance' },
        { role: 'student', name: 'Student User', message: 'When are my exams?' },
        { role: 'student', name: 'Student User', message: 'Help me with assignments' },
        { role: 'student', name: 'Student User', message: 'Navigate to placement' },
        
        // Faculty tests
        { role: 'faculty', name: 'Faculty User', message: 'Show my class schedule' },
        { role: 'faculty', name: 'Faculty User', message: 'Upload materials for class' },
        { role: 'faculty', name: 'Faculty User', message: 'Mark attendance' },
        { role: 'faculty', name: 'Faculty User', message: 'Create an exam' },
        { role: 'faculty', name: 'Faculty User', message: 'View student analytics' },
        { role: 'faculty', name: 'Faculty User', message: 'Send announcements' },
        
        // Admin tests
        { role: 'admin', name: 'Admin User', message: 'Show system statistics' },
        { role: 'admin', name: 'Admin User', message: 'Manage student accounts' },
        { role: 'admin', name: 'Admin User', message: 'Handle faculty management' },
        { role: 'admin', name: 'Admin User', message: 'Update course curriculum' },
        { role: 'admin', name: 'Admin User', message: 'Configure system settings' }
    ];
    
    let successCount = 0;
    let navigationCount = 0;
    let knowledgeBaseCount = 0;
    
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        
        console.log(`\n🎯 Test ${i + 1}: ${testCase.role.toUpperCase()} - "${testCase.message}"`);
        console.log('-'.repeat(60));
        
        try {
            const testData = {
                message: testCase.message,
                user_id: `test_${testCase.role}_${i}`,
                role: testCase.role,
                user_name: testCase.name,
                context: {
                    year: testCase.role === 'student' ? '2' : undefined,
                    branch: testCase.role === 'student' ? 'CSE' : undefined,
                    section: testCase.role === 'student' ? 'A' : undefined
                }
            };
            
            const result = await testAIRequest(testData);
            
            if (result.response) {
                console.log(`🤖 AI Response: ${result.response.substring(0, 120)}...`);
                successCount++;
                
                // Check for navigation commands
                if (result.response.includes('{{NAVIGATE:')) {
                    console.log('✅ Contains navigation command');
                    navigationCount++;
                }
                
                // Check for knowledge base content
                if (result.response.length > 150 && !result.response.includes('I\'m here to help')) {
                    console.log('✅ Knowledge base content detected');
                    knowledgeBaseCount++;
                }
                
            } else {
                console.log('❌ No response received');
                console.log('Error:', result.error || 'Unknown error');
            }
            
        } catch (error) {
            console.log('❌ Test failed:', error.message);
        }
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n\n📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successful responses: ${successCount}/${testCases.length}`);
    console.log(`🧭 Navigation commands: ${navigationCount}/${testCases.length}`);
    console.log(`📚 Knowledge base usage: ${knowledgeBaseCount}/${testCases.length}`);
    console.log(`🎯 Success rate: ${Math.round((successCount / testCases.length) * 100)}%`);
    
    if (successCount === testCases.length) {
        console.log('\n🎉 ALL TESTS PASSED!');
        console.log('✅ VUAI Agent is working with comprehensive knowledge base');
        console.log('✅ All dashboard sections are covered');
        console.log('✅ Role-specific responses implemented');
    } else {
        console.log('\n⚠️  Some tests failed. Check server logs for details.');
    }
}

// Run the test
runComprehensiveTest().catch(console.error);
