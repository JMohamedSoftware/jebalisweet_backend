const nodemailer = require('nodemailer');
require('dotenv').config();

/**
 * Email Service - Nodemailer configuration for Gmail SMTP
 */

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send Generic Email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body
 */
const sendEmail = async (to, subject, text, html) => {
    const mailOptions = {
        from: `"Jebali Sweet" <${process.env.EMAIL_FROM}>`,
        to: to,
        subject: subject,
        text: text,
        html: html,
    };

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
    const mailOptions = {
        from: `"Jebali Sweet" <${process.env.EMAIL_FROM || 'noreply@jebalisweet.com'}>`,
        to: email,
        subject: 'Code de récupération de mot de passe - Jebali Sweet',
        html: `
            <!DOCTYPE html>
            <html lang="fr">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: Arial, sans-serif;
                        background-color: #f4f4f4;
                    }
                    .email-container {
                        max-width: 600px;
                        margin: 20px auto;
                        background-color: #ffffff;
                        border-radius: 8px;
                        overflow: hidden;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                    }
                    .header {
                        background: linear-gradient(135deg, #d946ef 0%, #a855f7 100%);
                        padding: 30px 20px;
                        text-align: center;
                        color: white;
                    }
                    .header h1 {
                        margin: 0;
                        font-size: 28px;
                        font-weight: bold;
                    }
                    .content {
                        padding: 40px 30px;
                        color: #333333;
                    }
                    .greeting {
                        font-size: 18px;
                        margin-bottom: 20px;
                        color: #222;
                    }
                    .message {
                        line-height: 1.6;
                        margin-bottom: 30px;
                        color: #555;
                    }
                    .otp-box {
                        background: linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%);
                        border: 2px solid #d946ef;
                        border-radius: 8px;
                        padding: 20px;
                        text-align: center;
                        margin: 30px 0;
                    }
                    .otp-label {
                        font-size: 14px;
                        color: #666;
                        margin-bottom: 10px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    .otp-code {
                        font-size: 36px;
                        font-weight: bold;
                        color: #d946ef;
                        letter-spacing: 8px;
                        font-family: 'Courier New', monospace;
                    }
                    .expiry {
                        font-size: 14px;
                        color: #e11d48;
                        margin-top: 15px;
                        font-weight: 600;
                    }
                    .warning {
                        background-color: #fef3c7;
                        border-left: 4px solid #f59e0b;
                        padding: 15px;
                        margin: 20px 0;
                        font-size: 14px;
                        color: #92400e;
                    }
                    .footer {
                        background-color: #f9fafb;
                        padding: 20px 30px;
                        text-align: center;
                        font-size: 12px;
                        color: #777;
                        border-top: 1px solid #e5e7eb;
                    }
                    .footer a {
                        color: #d946ef;
                        text-decoration: none;
                    }
                </style>
            </head>
            <body>
                <div class="email-container">
                    <div class="header">
                        <h1>🍬 Jebali Sweet</h1>
                    </div>
                    <div class="content">
                        <p class="greeting">Bonjour ${firstName},</p>
                        <p class="message">
                            Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Jebali Sweet.
                            Utilisez le code de vérification ci-dessous pour continuer :
                        </p>
                        
                        <div class="otp-box">
                            <div class="otp-label">Votre code de vérification</div>
                            <div class="otp-code">${otp}</div>
                            <div class="expiry">⏱️ Ce code expire dans 10 minutes</div>
                        </div>

                        <div class="warning">
                            ⚠️ <strong>Important :</strong> Si vous n'êtes pas à l'origine de cette demande, veuillez ignorer cet e-mail. 
                            Votre mot de passe restera inchangé.
                        </div>

                        <p class="message">
                            Pour toute question, n'hésitez pas à nous contacter.
                        </p>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Jebali Sweet. Tous droits réservés.</p>
                        <p>📞 +216 28 284 411</p>
                    </div>
                </div>
            </body>
            </html>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email de récupération envoyé avec succès à ${email}`);
        return true;
    } catch (error) {
        console.error('❌ Erreur lors de l\'envoi de l\'email:', error.message);
        if (error.response) {
            console.error('📧 Réponse SMTP:', error.response);
        }
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
    verifyConnection
};
