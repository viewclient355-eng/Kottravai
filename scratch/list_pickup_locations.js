const axios = require('axios');
require('dotenv').config({ path: './server/.env' });

async function checkPickupLocations() {
    try {
        console.log(`Logging in to Shiprocket with email: ${process.env.SHIPROCKET_EMAIL}...`);
        const loginResponse = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', {
            email: process.env.SHIPROCKET_EMAIL,
            password: process.env.SHIPROCKET_PASSWORD
        });

        const token = loginResponse.data.token;
        console.log('Login successful. Fetching pickup locations...');

        const locationsResponse = await axios.get('https://apiv2.shiprocket.in/v1/external/settings/company/pickup', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log('--- VALID PICKUP LOCATIONS ---');
        const locations = locationsResponse.data.data.shipping_address;
        locations.forEach(loc => {
            console.log(`Nickname: "${loc.pickup_location}"`);
            console.log(`ID: ${loc.id}`);
            console.log(`Primary: ${loc.is_primary_location === 1}`);
            console.log(`Status: ${loc.status === 1 ? 'ACTIVE' : 'INACTIVE'}`);
            console.log('---------------------------');
        });

    } catch (error) {
        console.error('Error:', error.response ? error.response.data : error.message);
    }
}

checkPickupLocations();
