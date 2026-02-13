const { sendEmail, verifyConnection } = require('./services/emailService');
require('dotenv').config();

const testGmail = async () => {
    console.log('Testing Gmail SMTP connection...');
    const connected = await verifyConnection();
    if (!connected) {
        console.error('Failed to connect to SMTP server. Check your credentials in .env');
        process.exit(1);
    }

    console.log('Connection successful. Sending test email...');
    const to = process.env.EMAIL_USER; // Send to self
    const subject = 'Test Email from Jebali Sweet Backend';
    const text = 'This is a test email sent via Gmail SMTP using Node.js/Nodemailer.';
    const html = '<h1>Success!</h1><p>Your backend can now send emails via Gmail SMTP.</p>';

    const sent = await sendEmail(to, subject, text, html);
    if (sent) {
        console.log('Test email sent successfully! Check your inbox.');
    } else {
        console.error('Failed to send test email.');
    }
    process.exit(0);
};

testGmail();
