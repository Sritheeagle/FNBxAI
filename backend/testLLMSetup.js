const { 
    generateLLMResponse, 
    checkLLMHealth, 
    verifyLangChainSetup,
    createAdvancedChain,
    llmConfig
} = require('./config/llmConfig');

// Comprehensive LLM and LangChain testing
async function testLLMSetup() {
    console.log('🤖 TESTING LLM AND LANGCHAIN SETUP\n');
    console.log('='.repeat(60));
    
    let totalTests = 0;
    let passedTests = 0;
    
    // ==================== LANGCHAIN SETUP VERIFICATION ====================
    console.log('\n🔗 LANGCHAIN SETUP VERIFICATION');
    console.log('-'.repeat(40));
    
    totalTests++;
    console.log('\n📋 Verifying LangChain configuration...');
    
    try {
        const langchainStatus = verifyLangChainSetup();
        
        if (langchainStatus.status === 'configured') {
            console.log('✅ LangChain setup: CONFIGURED');
            console.log('📊 Details:', langchainStatus.details);
            passedTests++;
        } else {
            console.log('❌ LangChain setup: INCOMPLETE');
            console.log('❌ Details:', langchainStatus.details);
        }
    } catch (error) {
        console.log('❌ LangChain verification failed:', error.message);
    }
    
    // ==================== LLM HEALTH CHECK ====================
    console.log('\n\n🏥 LLM HEALTH CHECK');
    console.log('-'.repeat(40));
    
    totalTests++;
    console.log('\n📋 Checking LLM health and connectivity...');
    
    try {
        const healthStatus = await checkLLMHealth();
        
        if (healthStatus.status === 'healthy') {
            console.log('✅ LLM Health: HEALTHY');
            console.log(`📊 Response Time: ${healthStatus.responseTime}`);
            console.log(`🤖 Model: ${healthStatus.model}`);
            console.log(`🔑 API Key: ${healthStatus.apiKey}`);
            console.log(`📝 Test Response: ${healthStatus.testResponse}`);
            passedTests++;
        } else {
            console.log('❌ LLM Health: UNHEALTHY');
            console.log('❌ Error:', healthStatus.error || 'Unknown error');
        }
    } catch (error) {
        console.log('❌ LLM health check failed:', error.message);
    }
    
    // ==================== STUDENT AI TEST ====================
    console.log('\n\n👨‍🎓 STUDENT AI LLM TEST');
    console.log('-'.repeat(40));
    
    const studentTests = [
        {
            name: 'Python Programming Help',
            message: 'Explain Python variables and data types with examples',
            role: 'student',
            userProfile: { year: '2', branch: 'CSE', section: 'A' }
        },
        {
            name: 'Mathematics Help',
            message: 'What is calculus and how is it used in real life?',
            role: 'student',
            userProfile: { year: '2', branch: 'CSE', section: 'A' }
        },
        {
            name: 'Study Advice',
            message: 'How can I improve my programming skills?',
            role: 'student',
            userProfile: { year: '2', branch: 'CSE', section: 'A' }
        }
    ];
    
    for (const test of studentTests) {
        totalTests++;
        console.log(`\n📤 ${test.name}`);
        
        try {
            const result = await generateLLMResponse(test.message, test.role, test.userProfile);
            
            if (result.success) {
                console.log(`✅ Response: ${result.response.substring(0, 100)}...`);
                console.log(`🕐 Response Time: ${result.responseTime}ms`);
                console.log(`🤖 Model: ${result.model}`);
                passedTests++;
            } else {
                console.log('❌ LLM Response Failed');
                console.log('❌ Error:', result.error);
                console.log('🔄 Fallback:', result.fallback);
            }
        } catch (error) {
            console.log(`❌ Student AI test failed: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // ==================== FACULTY AI TEST ====================
    console.log('\n\n👨‍🏫 FACULTY AI LLM TEST');
    console.log('-'.repeat(40));
    
    const facultyTests = [
        {
            name: 'Attendance Management',
            message: 'How can I implement AI-powered attendance for my class?',
            role: 'faculty',
            userProfile: { subject: 'Computer Science', className: 'CSE-A' }
        },
        {
            name: 'Exam Paper Generation',
            message: 'Create a multiple choice exam paper for Python programming',
            role: 'faculty',
            userProfile: { subject: 'Python Programming', className: 'CSE-B' }
        },
        {
            name: 'Teaching Strategies',
            message: 'What are effective teaching strategies for programming courses?',
            role: 'faculty',
            userProfile: { subject: 'Data Structures', className: 'CSE-A' }
        }
    ];
    
    for (const test of facultyTests) {
        totalTests++;
        console.log(`\n📤 ${test.name}`);
        
        try {
            const result = await generateLLMResponse(test.message, test.role, test.userProfile);
            
            if (result.success) {
                console.log(`✅ Response: ${result.response.substring(0, 100)}...`);
                console.log(`🕐 Response Time: ${result.responseTime}ms`);
                console.log(`🤖 Model: ${result.model}`);
                passedTests++;
            } else {
                console.log('❌ LLM Response Failed');
                console.log('❌ Error:', result.error);
                console.log('🔄 Fallback:', result.fallback);
            }
        } catch (error) {
            console.log(`❌ Faculty AI test failed: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // ==================== ADMIN AI TEST ====================
    console.log('\n\n👨‍💼 ADMIN AI LLM TEST');
    console.log('-'.repeat(40));
    
    const adminTests = [
        {
            name: 'Student Management',
            message: 'What are the best practices for managing student admissions?',
            role: 'admin',
            userProfile: { department: 'Academic Affairs', role: 'Administrator' }
        },
        {
            name: 'Faculty Management',
            message: 'How can I optimize faculty workload distribution?',
            role: 'admin',
            userProfile: { department: 'Human Resources', role: 'Administrator' }
        },
        {
            name: 'System Optimization',
            message: 'What strategies can improve institutional efficiency?',
            role: 'admin',
            userProfile: { department: 'Administration', role: 'System Admin' }
        }
    ];
    
    for (const test of adminTests) {
        totalTests++;
        console.log(`\n📤 ${test.name}`);
        
        try {
            const result = await generateLLMResponse(test.message, test.role, test.userProfile);
            
            if (result.success) {
                console.log(`✅ Response: ${result.response.substring(0, 100)}...`);
                console.log(`🕐 Response Time: ${result.responseTime}ms`);
                console.log(`🤖 Model: ${result.model}`);
                passedTests++;
            } else {
                console.log('❌ LLM Response Failed');
                console.log('❌ Error:', result.error);
                console.log('🔄 Fallback:', result.fallback);
            }
        } catch (error) {
            console.log(`❌ Admin AI test failed: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // ==================== ADVANCED CHAIN TEST ====================
    console.log('\n\n🚀 ADVANCED CHAIN TEST');
    console.log('-'.repeat(40));
    
    totalTests++;
    console.log('\n📤 Testing advanced chain with complex query...');
    
    try {
        const advancedChain = createAdvancedChain('faculty', 
            { subject: 'AI Systems', experience: '5 years' },
            { task: 'System optimization', priority: 'high' }
        );
        
        const complexMessage = 'Design an AI-powered system for automated student performance analysis and prediction';
        const result = await advancedChain.invoke(complexMessage);
        
        console.log('✅ Advanced Chain Response:');
        console.log(`📝 ${result.substring(0, 150)}...`);
        console.log('🚀 Advanced chain working correctly');
        passedTests++;
        
    } catch (error) {
        console.log('❌ Advanced chain test failed:', error.message);
    }
    
    // ==================== CONFIGURATION VERIFICATION ====================
    console.log('\n\n⚙️ CONFIGURATION VERIFICATION');
    console.log('-'.repeat(40));
    
    totalTests++;
    console.log('\n📋 Verifying LLM configuration...');
    
    try {
        const config = llmConfig;
        
        const configValid = 
            config.openai.apiKey &&
            config.openai.modelName &&
            config.langchain.tracing !== undefined &&
            config.response.timeoutMs > 0;
        
        if (configValid) {
            console.log('✅ LLM Configuration: VALID');
            console.log(`🤖 Model: ${config.openai.modelName}`);
            console.log(`🌡️ Temperature: ${config.openai.temperature}`);
            console.log(`📝 Max Tokens: ${config.openai.maxTokens}`);
            console.log(`🔗 LangChain Tracing: ${config.langchain.tracing}`);
            console.log(`⏱️ Timeout: ${config.response.timeoutMs}ms`);
            passedTests++;
        } else {
            console.log('❌ LLM Configuration: INVALID');
        }
    } catch (error) {
        console.log('❌ Configuration verification failed:', error.message);
    }
    
    // ==================== FINAL RESULTS ====================
    console.log('\n\n📊 LLM AND LANGCHAIN TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Passed Tests: ${passedTests}/${totalTests}`);
    console.log(`🎯 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 ALL LLM AND LANGCHAIN TESTS PASSED!');
        console.log('✅ LangChain setup: Configured and working');
        console.log('✅ LLM health: Healthy and responsive');
        console.log('✅ Student AI: Working with proper responses');
        console.log('✅ Faculty AI: Working with professional assistance');
        console.log('✅ Admin AI: Working with administrative support');
        console.log('✅ Advanced chains: Complex query handling');
        console.log('✅ Configuration: All settings valid');
        console.log('\n🚀 LLM and LangChain system is ready for production!');
    } else {
        console.log(`\n⚠️  ${totalTests - passedTests} tests failed. Check the logs above for details.`);
        console.log('\n🔧 Troubleshooting Tips:');
        console.log('1. Verify OpenAI API key is valid and active');
        console.log('2. Check internet connection');
        console.log('3. Ensure LangChain packages are properly installed');
        console.log('4. Verify environment variables are set correctly');
    }
    
    // Performance Summary
    console.log('\n📈 PERFORMANCE SUMMARY');
    console.log('-'.repeat(40));
    console.log(`🤖 LLM Model: ${llmConfig.openai.modelName}`);
    console.log(`🌡️ Temperature: ${llmConfig.openai.temperature}`);
    console.log(`📝 Max Tokens: ${llmConfig.openai.maxTokens}`);
    console.log(`⏱️ Timeout: ${llmConfig.response.timeoutMs}ms`);
    console.log(`🔗 LangChain Tracing: ${llmConfig.langchain.tracing ? 'Enabled' : 'Disabled'}`);
    console.log(`📊 LangChain Project: ${llmConfig.langchain.project}`);
    
    return {
        totalTests,
        passedTests,
        successRate: Math.round((passedTests / totalTests) * 100),
        status: passedTests === totalTests ? 'success' : 'partial'
    };
}

// Run the comprehensive test
if (require.main === module) {
    testLLMSetup()
        .then(results => {
            console.log('\n✅ LLM testing completed');
            process.exit(results.status === 'success' ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ LLM testing failed:', error);
            process.exit(1);
        });
}

module.exports = { testLLMSetup };
