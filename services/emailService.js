const axios = require('axios');
require('dotenv').config();

const EMAILJS_API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

/**
 * Send an email using EmailJS
 * @param {string} toEmail - Recipient email
 * @param {string} toName - Recipient name
 * @param {string} subject - Email subject
 * @param {string} message - Email body content
 */
async function sendEmail(toEmail, toName, subject, message) {
    if (!process.env.EMAILJS_SERVICE_ID || !process.env.EMAILJS_TEMPLATE_ID) {
        console.warn("Skipping email: EMAILJS_SERVICE_ID or EMAILJS_TEMPLATE_ID not set.");
        return;
    }

    const data = {
        service_id: process.env.EMAILJS_SERVICE_ID,
        template_id: process.env.EMAILJS_TEMPLATE_ID,
        user_id: process.env.EMAILJS_PUBLIC_KEY,
        accessToken: process.env.EMAILJS_PRIVATE_KEY,
        template_params: {
            to_email: toEmail,
            to_name: toName,
            subject: subject,
            message: message,
            reply_to: 'support@likelembe.com'
        }
    };

    try {
        await axios.post(EMAILJS_API_URL, data);
        console.log(`📧 Email sent to ${toEmail}: ${subject}`);
    } catch (error) {
        console.error('EmailJS Error:', error.response ? error.response.data : error.message);
    }
}

async function sendAdminAlert(subject, message) {
    const adminEmail = process.env.ADMIN_EMAIL || 'elvickongolo@gmail.com';
    await sendEmail(adminEmail, 'Admin', `[Admin Alert] ${subject}`, message);
}

async function sendOTP(toEmail, otpCode) {
    await sendEmail(toEmail, 'User', 'Verification Code', `Your Verification Code for Likelembe is: ${otpCode}`);
}

module.exports = { sendEmail, sendAdminAlert, sendOTP };
