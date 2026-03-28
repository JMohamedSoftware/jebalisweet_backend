const http = require('http');

const SERVER_URL = 'http://localhost:5000';

async function testPayloadLimit() {
    console.log('\n--- Testing Payload Limit (Max 10KB) ---');
    const largeData = JSON.stringify({ data: 'a'.repeat(15000) }); // ~15KB
    
    return new Promise((resolve) => {
        const req = http.request(SERVER_URL + '/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(largeData)
            }
        }, (res) => {
            console.log(`Status: ${res.statusCode} (Expected: 413)`);
            resolve();
        });
        req.on('error', (e) => {
            console.log(`Error: ${e.message}`);
            resolve();
        });
        req.write(largeData);
        req.end();
    });
}

async function testRateLimit() {
    console.log('\n--- Testing Rate Limit (60 req/min) ---');
    console.log('Sending 70 requests quickly...');
    
    let blockedCount = 0;
    for (let i = 0; i < 70; i++) {
        await new Promise((resolve) => {
            http.get(SERVER_URL + '/', (res) => {
                if (res.statusCode === 429) blockedCount++;
                resolve();
            }).on('error', resolve);
        });
    }
    console.log(`Blocked requests: ${blockedCount} (Expected: ~10)`);
}

async function testTimeout() {
    console.log('\n--- Testing Timeout (Simulation) ---');
    console.log('Note: This requires an endpoint that hangs. We will skip direct hanging test but verify middleware is active in logs.');
}

async function runAll() {
    console.log('Starting Security Verification...');
    try {
        await testPayloadLimit();
        await testRateLimit();
    } catch (e) {
        console.error('Test Failed:', e.message);
    }
}

runAll();
