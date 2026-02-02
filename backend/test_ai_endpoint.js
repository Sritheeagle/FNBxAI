const fetch = require('node-fetch');

async function testChat() {
    console.log('Testing /api/chat endpoint...');

    try {
        const response = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                user_id: 'test-user',
                role: 'student',
                message: 'Hello, are you there?',
                user_name: 'Test Tester'
            })
        });

        console.log(`Status Code: ${response.status}`);

        if (response.ok) {
            const data = await response.json();
            console.log('Response Body:', data);
        } else {
            console.log('Error Response:', await response.text());
        }

    } catch (error) {
        console.error('Fetch Error:', error);
    }
}

testChat();
