const nodemailer = require('nodemailer');
require('dotenv').config({ path: './.env' });

async function testSMTP() {
    console.log('--- SMTP Diagnostic Tool ---');
    console.log('Host:', process.env.EMAIL_HOST);
    console.log('Port:', process.env.EMAIL_PORT);
    console.log('User:', process.env.EMAIL_USER);
    console.log('From:', process.env.EMAIL_FROM);

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 465,
        secure: true,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
        debug: true, // Enable debug output
        logger: true, // Log to console
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 30000,
    });

    console.log('\nTesting connection...');
    try {
        await transporter.verify();
        console.log('✅ Connection verified successfully!');

        console.log('\nSending test email...');
        const info = await transporter.sendMail({
            from: `"Jebali Sweet Test" <${process.env.EMAIL_FROM}>`,
            to: process.env.EMAIL_USER,
            subject: 'SMTP Test - Jebali Sweet',
            text: 'Ceci est un test de connexion SMTP.',
            html: '<b>Ceci est un test de connexion SMTP.</b>'
        });
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
    } catch (error) {
        console.error('❌ SMTP Error encountered:');
        console.error(error);
    }
}

testSMTP().catch(err => {
    console.error('Unhandled Rejection:', err);
});
