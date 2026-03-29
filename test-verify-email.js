const { sendVerificationEmail } = require('./services/emailService');
require('dotenv').config();

async function testEmail() {
    console.log('Testing Email Service...');
    try {
        const result = await sendVerificationEmail('test@example.com', 'TestUser', '123456');
        console.log('Result:', result);
    } catch (err) {
        console.error('Email Test Failed:', err);
    }
    process.exit();
}

testEmail();
