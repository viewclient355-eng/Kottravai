const axios = require('axios');

/**
 * Gupshup WhatsApp Provider
 */
module.exports = {
  async sendOTP(phone, otp) {
    const apiKey = process.env.GUPSHUP_API_KEY;
    const source = process.env.GUPSHUP_SOURCE_NUMBER; // Your Gupshup sender number

    if (!apiKey || !source) {
      console.warn('[Gupshup] No credentials found. Simulating OTP send to:', phone, 'OTP:', otp);
      return true;
    }

    try {
      const params = new URLSearchParams();
      params.append('channel', 'whatsapp');
      params.append('source', source);
      params.append('destination', phone);
      params.append('src.name', 'Kottravai');
      params.append('template', JSON.stringify({
        id: 'YOUR_TEMPLATE_ID', // Replaced with actual template id
        params: [otp]
      }));

      const response = await axios.post(
        'https://api.gupshup.io/sm/api/v1/template/msg',
        params.toString(),
        {
          headers: {
            'Cache-Control': 'no-cache',
            'Content-Type': 'application/x-www-form-urlencoded',
            'apikey': apiKey,
          },
        }
      );

      return response.data.status === 'submitted';
    } catch (error) {
      console.error('[Gupshup] Error sending OTP:', error.response?.data || error.message);
      throw new Error('Failed to send OTP via Gupshup');
    }
  },
};
