const axios = require('axios');

/**
 * WATI WhatsApp Provider
 */
module.exports = {
  async sendOTP(phone, otp) {
    const endpoint = process.env.WATI_API_ENDPOINT; // e.g., https://live-server-xxxx.wati.io
    const token = process.env.WATI_ACCESS_TOKEN;

    if (!endpoint || !token) {
      console.warn('[WATI] No credentials found. Simulating OTP send to:', phone, 'OTP:', otp);
      return true;
    }

    try {
      const response = await axios.post(
        `${endpoint}/api/v1/sendTemplateMessage?whatsappNumber=${phone}`,
        {
          template_name: 'otp_verification',
          broadcast_name: 'otp_broadcast',
          parameters: [
            {
              name: 'otp',
              value: otp
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data.result === 'success';
    } catch (error) {
      console.error('[WATI] Error sending OTP:', error.response?.data || error.message);
      throw new Error('Failed to send OTP via WATI');
    }
  },
};
