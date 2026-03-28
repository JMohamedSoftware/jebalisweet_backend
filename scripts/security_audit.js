const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = 'http://127.0.0.1:5000/api'; 

async function runAudit() {
    console.log('--- STARTING SECURITY AUDIT ---');

    // Test 1: User Enumeration via check-email
    try {
        console.log('\n[Test 1] User Enumeration via /auth/check-email...');
        const res = await fetch(`${API_URL}/auth/check-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@jebalisweet.tn' })
        });
        const data = await res.json();
        if (res.ok) {
            console.log('Result: Potential Leak! Returned data:', JSON.stringify(data.user));
        } else {
            console.log('Result: Secure (or not found). Message:', data.message);
        }
    } catch (error) {
        console.log('Result: Error during Test 1:', error.message);
    }

    // Test 2: Role Escalation during Registration
    try {
        console.log('\n[Test 2] Role Escalation in /auth/register...');
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: 'Hacker',
                lastName: 'One',
                email: 'hacker' + Date.now() + '@test.com',
                password: 'Password123!',
                role: 'admin'
            })
        });
        const data = await res.json();
        if (res.ok) {
             console.log('Result: Register success. Checking role:', data.user.role);
             if (data.user.role === 'admin') {
                 console.error('FAIL: User was registered as ADMIN!');
             } else {
                 console.log('PASS: Role escalation blocked. User role is:', data.user.role);
             }
        } else {
            console.log('Result: Register failed. Message:', data.message);
        }
    } catch (error) {
         console.log('Result: Error during Test 2:', error.message);
    }

    // Test 4: Brute Force on Admin Password Fix (Check if rate limiting is active)
    try {
        console.log('\n[Test 4] Rate Limiting on /users/verify-admin-password...');
        let lastRes;
        for(let i=0; i<3; i++) {
             lastRes = await fetch(`${API_URL}/users/verify-admin-password`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ password: 'wrong' })
             });
        }
        console.log('Info: Performed 3 attempts. Status of last attempt:', lastRes.status);
    } catch (error) {
        console.log('Error during Test 4:', error.message);
    }

    console.log('\n--- AUDIT COMPLETE ---');
}

runAudit();
