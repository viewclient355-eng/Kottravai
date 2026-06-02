const axios = require('axios');

/**
 * Interakt WhatsApp API Provider
 */
module.exports = {
  async sendOTP(phone, otp) {
    const apiKey = process.env.INTERAKT_API_KEY;
    if (!apiKey) {
      console.warn('[Interakt] No API key found. Simulating OTP send to:', phone, 'OTP:', otp);
      return true; // Simulate success for development
    }

    try {
      const response = await axios.post(
        'https://api.interakt.ai/v1/public/message/',
        {
          countryCode: phone.startsWith('+') ? '' : '+91', // Handle logic based on your phone formatting
          phoneNumber: phone.replace('+', ''), 
          type: 'Template',
          template: {
            name: 'otp_verification',
            languageCode: 'en',
            bodyValues: [otp],
          },
        },
        {
          headers: {
            'Authorization': `Basic ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.result === 'Message created successfully';
    } catch (error) {
      console.error('[Interakt] Error sending OTP:', error.response?.data || error.message);
      throw new Error('Failed to send OTP via Interakt');
    }
  },
};
