const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Email Service - Nodemailer configuration for Gmail SMTP
 */

const emailPort = parseInt(process.env.EMAIL_PORT) || 587;
const isSecure = emailPort === 465;

// Force fresh deployment to verify IPv4 fix on Render
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    // Production/Render specific tweaks
    debug: true,      // Show debug output in logs
    logger: true,     // Log information to console
    family: 4,        // Force IPv4 (Crucial for Render/Gmail timeouts)
    proxy: false,     // Disable any automatic proxy detection to fix ERR_INVALID_URL
    tls: {
        rejectUnauthorized: false
    },
    // Increased timeouts
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
});

/**
 * Send Generic Email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body
 */
const sendEmail = async (to, subject, text, html) => {
    const fromAddress = process.env.EMAIL_USER;
    const mailOptions = {
        from: `"Jebali Sweet" <${fromAddress}>`,
        to: to,
        subject: subject,
        text: text,
        html: html,
    };

    console.log(`📤 Sending email from: ${fromAddress} to: ${to}`);

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return false;
    }
};

/**
 * Send Password Reset OTP Email
 * @param {string} email - Recipient email address
 * @param {string} firstName - User's first name
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<boolean>} - Returns true if email sent successfully, false otherwise
 */
const sendResetEmail = async (email, firstName, otp) => {
    const fromAddress = process.env.EMAIL_USER;
    const mailOptions = {
        from: `"Jebali Sweet" <${fromAddress}>`,
        to: email,
        subject: 'Code de récupération de mot de passe - Jebali Sweet',
        html: `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Source+Sans+3:wght@400;600&display=swap" rel="stylesheet">
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: 'Source Sans 3', 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        background-color: #FDF6F0;
                        color: #2C1810;
                    }
                    .email-wrapper {
                        width: 100%;
                        table-layout: fixed;
                        background-color: #FDF6F0;
                        padding: 40px 0;
                    }
                    .email-container {
                        max-width: 600px;
                        margin: 0 auto;
                        background-color: #ffffff;
                        border-radius: 16px;
                        overflow: hidden;
                        box-shadow: 0 10px 30px rgba(157, 90, 36, 0.08);
                        border: 1px solid rgba(157, 90, 36, 0.1);
                    }
                    .header {
                        background-color: #ffffff;
                        padding: 40px 20px 20px;
                        text-align: center;
                        border-bottom: 1px solid #FDF6F0;
                    }
                    .header h1 {
                        margin: 0;
                        font-family: 'Playfair Display', Georgia, serif;
                        font-size: 32px;
                        color: #9D5A24;
                        letter-spacing: 1px;
                        text-transform: uppercase;
                    }
                    .content {
                        padding: 40px 50px;
                    }
                    .greeting {
                        font-family: 'Playfair Display', Georgia, serif;
                        font-size: 24px;
                        font-weight: 700;
                        margin-bottom: 20px;
                        color: #2C1810;
                    }
                    .message {
                        font-size: 16px;
                        line-height: 1.8;
                        margin-bottom: 30px;
                        color: #5C4033;
                    }
                    .otp-container {
                        background-color: #FDF6F0;
                        border: 1px solid #E6D5C7;
                        border-radius: 12px;
                        padding: 30px;
                        text-align: center;
                        margin: 40px 0;
                    }
                    .otp-label {
                        font-size: 13px;
                        color: #9D5A24;
                        margin-bottom: 15px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                        font-weight: 600;
                    }
                    .otp-code {
                        font-size: 42px;
                        font-weight: 700;
                        color: #9D5A24;
                        letter-spacing: 12px;
                        font-family: 'Courier New', monospace;
                        margin: 0 auto;
                    }
                    .expiry {
                        font-size: 13px;
                        color: #C5A059;
                        margin-top: 20px;
                        font-weight: 600;
                    }
                    .notice-box {
                        background-color: #F9F5F1;
                        border-left: 3px solid #C5A059;
                        padding: 20px;
                        margin: 30px 0;
                        font-size: 14px;
                        color: #5C4033;
                        line-height: 1.6;
                    }
                    .notice-box strong {
                        color: #9D5A24;
                    }
                    .cta-container {
                        text-align: center;
                        margin: 40px 0;
                    }
                    .cta-button {
                        background-color: #9D5A24;
                        color: #ffffff !important;
                        padding: 16px 32px;
                        text-decoration: none;
                        border-radius: 8px;
                        font-weight: 600;
                        display: inline-block;
                        transition: background-color 0.3s ease;
                    }
                    .footer {
                        background-color: #FDF6F0;
                        padding: 30px 50px;
                        text-align: center;
                        font-size: 13px;
                        color: #8C7365;
                        border-top: 1px solid #E6D5C7;
                    }
                    .footer p {
                        margin: 5px 0;
                    }
                    .footer a {
                        color: #9D5A24;
                        text-decoration: none;
                        font-weight: 600;
                    }
                    @media screen and (max-width: 600px) {
                        .content { padding: 30px 20px; }
                        .otp-code { font-size: 32px; letter-spacing: 8px; }
                    }
                </style>
            </head>
            <body>
                <div class="email-wrapper">
                    <div class="email-container">
                        <div class="header">
                            <h1>Jebali Sweet</h1>
                        </div>
                        <div class="content">
                            <p class="greeting">Bonjour ${firstName},</p>
                            <p class="message">
                                Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Jebali Sweet. 
                                Ce code de sécurité est nécessaire pour finaliser l'opération.
                            </p>
                            
                            <div class="otp-container">
                                <div class="otp-label">Votre code de vérification</div>
                                <div class="otp-code">${otp}</div>
                                <div class="expiry">⏱ Valide pendant 10 minutes</div>
                            </div>

                            <div class="cta-container">
                                <a href="https://jebalisweet.tn" class="cta-button">Accéder à la boutique</a>
                            </div>

                            <div class="notice-box">
                                <strong>Sécurité :</strong> Si vous n'êtes pas à l'origine de cette demande, 
                                vous pouvez ignorer cet e-mail en toute sécurité. Votre compte reste protégé.
                            </div>

                            <p class="message" style="margin-bottom: 0;">
                                Bien à vous,<br>
                                <strong>L'équipe Jebali Sweet</strong>
                            </p>
                        </div>
                        <div class="footer">
                            <p>&copy; ${new Date().getFullYear()} Jebali Sweet. Maison de Pâtisserie Fine.</p>
                            <p>🌐 <a href="https://jebalisweet.tn">jebalisweet.tn</a></p>
                            <p>📞 <a href="tel:+21628284411">+216 28 284 411</a></p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    try {
        if (!transporter) {
            throw new Error("Transporter node-mailer non initialisé");
        }
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email de récupération envoyé avec succès à ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de l\'email reset:', error.message);
        console.error('   Stack trace:', error.stack);
        if (error.response) {
            console.error('📧 Réponse SMTP complète:', JSON.stringify(error.response, null, 2));
        }
        return false;
    }
};

/**
 * Send Email Verification OTP
 */
const sendVerificationEmail = async (email, firstName, otp) => {
    console.log('DEBUG: sendVerificationEmail CALLED with:', { email, firstName, otp });
    const fromAddress = process.env.EMAIL_USER || process.env.EMAIL_FROM || 'jbelimohamed.software@gmail.com';
    console.log('DEBUG: fromAddress:', fromAddress);
    
    const mailOptions = {
        from: String(`"Jebali Sweet" <${fromAddress}>`),
        to: String(email),
        subject: 'Vérifiez votre compte - Jebali Sweet',
        text: String(`Votre code de vérification est : ${otp}`),
    };

    console.log('DEBUG: FINAL mailOptions:', JSON.stringify(mailOptions, null, 2));

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email de vérification envoyé à ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Erreur envoi email vérification:', error.message);
        return false;
    }
};

/**
 * Verify transporter configuration
 */
const verifyConnection = async () => {
    try {
        await transporter.verify();
        console.log('✅ Serveur SMTP prêt à envoyer des emails');
        return true;
    } catch (error) {
        console.error('❌ Erreur de configuration SMTP:', error.message);
        return false;
    }
};

module.exports = {
    transporter,
    sendEmail,
    sendResetEmail,
    sendVerificationEmail,
    verifyConnection
};
