const axios = require('axios');

/**
 * Meta WhatsApp Cloud API Provider
 */
module.exports = {
  async sendOTP(phone, otp) {
    const token = process.env.META_WHATSAPP_TOKEN;
    const phoneId = process.env.META_PHONE_NUMBER_ID;

    if (!token || !phoneId) {
      console.warn('[MetaCloud] No credentials found. Simulating OTP send to:', phone, 'OTP:', otp);
      return true;
    }

    try {
      const response = await axios.post(
        `https://graph.facebook.com/v17.0/${phoneId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
          template: {
            name: 'guest_otp',
            language: { code: 'en_US' },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: otp }],
              },
              {
                type: 'button',
                sub_type: 'url',
                index: '0',
                parameters: [{ type: 'text', text: otp }], // For autofill if configured
              }
            ],
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return !!response.data.messages;
    } catch (error) {
      console.error('[MetaCloud] Error sending OTP:', error.response?.data || error.message);
      throw new Error('Failed to send OTP via Meta Cloud API');
    }
  },
};
