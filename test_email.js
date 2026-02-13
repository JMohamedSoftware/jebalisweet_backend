const nodemailer = require('nodemailer');
require('dotenv').config();

async function testConnection() {
    console.log('--- Testing SMTP Connection ---');
    console.log('User:', process.env.EMAIL_USER);
    console.log('Host:', process.env.EMAIL_HOST);
    console.log('Port:', process.env.EMAIL_PORT);

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_PORT == 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        debug: true, // Show debug output
        logger: true // Log information to console
    });

    try {
        await transporter.verify();
        console.log('✅ Connection success! Your credentials are correct.');
    } catch (error) {
        console.error('❌ Connection failed:');
        console.error(error);
        if (error.responseCode === 535) {
            console.log('\nTip: This is an Authentication error (Username/Password rejected).');
            console.log('If you are using Gmail, you MUST use an "App Password", not your normal password.');
        }
    }
}

testConnection();
