const nodemailer = require('nodemailer');
require('dotenv').config();

// Zoho SMTP Configuration
// CRITICAL: All emails MUST authenticate via admin@kottravai.in
// Aliases are used in reply-to field only
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || process.env.SMTP_HOST,
    port: Number(process.env.EMAIL_PORT || process.env.SMTP_PORT),
    secure: true, // Use SSL/TLS
    auth: {
        user: process.env.EMAIL_USER || process.env.SMTP_USER, // admin@kottravai.in
        pass: process.env.EMAIL_PASS || process.env.SMTP_PASSWORD, // App password
    },
    tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false,
    },
});

// Email type to reply-to mapping
const EMAIL_ALIASES = {
    order: 'sales@kottravai.in',
    b2b: 'b2b@kottravai.in',
    contact: 'support@kottravai.in',
    subscribe: 'info@kottravai.in',
    custom: 'sales@kottravai.in',
};

/**
 * Send email via Zoho SMTP
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.type - Email type (order, b2b, contact, subscribe, custom)
 * @returns {Promise<Object>} - Send result
 */
const sendEmail = async ({ to, subject, html, type = 'contact', attachments = [] }) => {
    const replyTo = EMAIL_ALIASES[type] || EMAIL_ALIASES.contact;

    console.log('📧 Sending email via Zoho SMTP...');
    console.log('From:', (process.env.EMAIL_USER || process.env.SMTP_USER));
    console.log('Reply-To:', replyTo);
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Type:', type);
    if (attachments.length > 0) {
        console.log('📎 Attachments:', attachments.length);
    }

    try {
        const info = await transporter.sendMail({
            from: `"Kottravai" <${process.env.EMAIL_USER || process.env.SMTP_USER}>`,
            to: to,
            replyTo: replyTo,
            subject: subject,
            html: html,
            attachments: attachments
        });

        console.log('✅ Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ SMTP ERROR:', error);
        throw error;
    }
};

/**
 * Verify SMTP connection
 * @returns {Promise<boolean>}
 */
const verifyConnection = async () => {
    try {
        console.log('🔍 Verifying Zoho SMTP connection...');
        await transporter.verify();
        console.log('✅ SMTP connection verified successfully');
        return true;
    } catch (error) {
        console.error('❌ SMTP connection failed:', error);
        return false;
    }
};

module.exports = {
    sendEmail,
    verifyConnection,
    transporter,
};
