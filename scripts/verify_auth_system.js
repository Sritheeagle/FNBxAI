const http = require('http');

function request(path, method, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data ? data.length : 0
            }
        };

        const req = http.request(options, (res) => {
            let buffer = '';
            res.on('data', chunk => buffer += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(buffer) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: buffer });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
}

async function main() {
    console.log("--- Verifying Authentication System ---");

    // 1. Test Admin Login
    console.log("\n1. Testing Admin Login...");
    const adminRes = await request('/api/admin/login', 'POST', {
        adminId: 'bobbymartin',
        password: 'martin@FNB1'
    });
    console.log(`Status: ${adminRes.status}`);
    if (adminRes.status === 200 && adminRes.body.token) {
        console.log("PASS: Admin Login successful.");
    } else {
        console.log("FAIL: Admin Login failed.");
        console.log(adminRes.body);
    }

    // 2. Test Student Register
    const testSid = "TEST_" + Date.now();
    console.log(`\n2. Testing Student Registration (SID: ${testSid})...`);
    const regRes = await request('/api/students/register', 'POST', {
        sid: testSid,
        name: "Test Student",
        email: `${testSid}@example.com`,
        password: "password123",
        year: 1,
        branch: "CSE",
        section: "A"
    });
    console.log(`Status: ${regRes.status}`);
    if (regRes.status === 201) {
        console.log("PASS: Student Registration successful.");
        // Check if folder exists might require fs check, but 201 implies success in controller
    } else {
        console.log("FAIL: Student Registration failed.");
        console.log(regRes.body);
    }

    // 3. Test Student Login
    console.log("\n3. Testing Student Login...");
    const loginRes = await request('/api/students/login', 'POST', {
        sid: testSid,
        password: "password123"
    });
    console.log(`Status: ${loginRes.status}`);
    if (loginRes.status === 200 && loginRes.body.token) {
        console.log("PASS: Student Login successful.");
    } else {
        console.log("FAIL: Student Login failed.");
        console.log(loginRes.body);
    }
}

main().catch(console.error);
