require('dotenv').config();

// Test the AI agent functionality
const testAIAgent = async () => {
    try {
        console.log('🧪 Testing VUAI Agent with LLM Integration...\n');
        
        // Test chat API
        const testChat = {
            message: "Hello! Can you help me navigate to my attendance?",
            user_id: "test_student_001",
            role: "student",
            user_name: "Test Student",
            context: {
                year: "2",
                branch: "CSE",
                section: "A"
            }
        };
        
        console.log('📤 Sending test message:', testChat.message);
        console.log('👤 User Profile:', testChat.role, testChat.user_name);
        
        // Make API call to test the chat endpoint
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testChat)
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ AI Response:', data.response);
            console.log('\n🎉 AI Agent is working with LLM integration!');
            
            // Check if navigation command is present
            if (data.response.includes('{{NAVIGATE:')) {
                console.log('✅ Navigation commands are working');
            }
            
        } else {
            console.error('❌ API Error:', response.status, response.statusText);
        }
        
        // Test knowledge base
        console.log('\n📚 Testing knowledge base...');
        const kbResponse = await fetch('http://localhost:5000/api/knowledge?role=student');
        
        if (kbResponse.ok) {
            const knowledgeData = await kbResponse.json();
            console.log(`✅ Knowledge base loaded with ${knowledgeData.length} entries`);
            
            // Show some sample entries
            console.log('\n📖 Sample knowledge entries:');
            knowledgeData.slice(0, 3).forEach((entry, index) => {
                console.log(`${index + 1}. ${entry.topic} (${entry.role}): ${entry.content.substring(0, 100)}...`);
            });
        }
        
        console.log('\n🚀 VUAI Agent LLM Integration Test Complete!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

// Run the test
testAIAgent();
