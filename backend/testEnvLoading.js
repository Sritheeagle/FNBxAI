require('dotenv').config();

console.log('🔍 Testing Environment Variable Loading\n');
console.log('='.repeat(50));

console.log('📋 Environment Variables:');
console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'}`);
console.log(`GOOGLE_API_KEY: ${process.env.GOOGLE_API_KEY ? 'SET' : 'NOT SET'}`);
console.log(`LANGCHAIN_TRACING_V2: ${process.env.LANGCHAIN_TRACING_V2}`);
console.log(`LANGCHAIN_PROJECT: ${process.env.LANGCHAIN_PROJECT}`);

console.log('\n📄 .env file content:');
const fs = require('fs');
try {
    const envContent = fs.readFileSync('.env', 'utf8');
    console.log(envContent);
} catch (error) {
    console.log('❌ Error reading .env file:', error.message);
}

console.log('\n🧪 Testing OpenAI API Key...');
if (process.env.OPENAI_API_KEY) {
    console.log('✅ API Key found:', process.env.OPENAI_API_KEY.substring(0, 20) + '...');
    
    // Test with OpenAI directly
    const { ChatOpenAI } = require('@langchain/openai');
    
    try {
        const chatModel = new ChatOpenAI({
            openAIApiKey: process.env.OPENAI_API_KEY,
            modelName: "gpt-3.5-turbo",
            temperature: 0.7,
            maxTokens: 100
        });
        
        console.log('✅ ChatOpenAI model created successfully');
        
        // Test a simple call
        chatModel.invoke('Hello! Respond with "Test successful"').then(response => {
            console.log('✅ OpenAI API Test:', response.content);
        }).catch(error => {
            console.log('❌ OpenAI API Test Failed:', error.message);
        });
        
    } catch (error) {
        console.log('❌ ChatOpenAI creation failed:', error.message);
    }
} else {
    console.log('❌ OPENAI_API_KEY not found in environment variables');
}

console.log('\n🔧 Current Working Directory:', process.cwd());
console.log('📁 .env file exists:', fs.existsSync('.env'));
