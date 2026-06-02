const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db');
const crypto = require('crypto');

async function testInsert() {
    try {
        const application = {
            name: 'Muthulakshmi ',
            email: 'muthubakya92@gmail.com',
            phone: '8489088958',
            city: 'Rajapalayam ',
            instagram_link: 'link',
            facebook_link: null,
            twitter_link: null,
            youtube_link: 'link'
        };
        const userId = '3886b388-2bab-48be-ae41-078ad03cefb1';
        const referralCode = `${application.name.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '')}${Math.floor(1000 + Math.random() * 9000)}`;

        console.log(`📝 Upserting affiliate profile for ${application.email}`);
        await db.query(`
            INSERT INTO affiliates (
                user_id, name, email, phone, city, referral_code, status, 
                instagram_link, facebook_link, twitter_link, youtube_link
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (user_id) DO UPDATE SET
                status = 'Approved',
                name = EXCLUDED.name,
                phone = EXCLUDED.phone,
                city = EXCLUDED.city,
                instagram_link = EXCLUDED.instagram_link,
                facebook_link = EXCLUDED.facebook_link,
                twitter_link = EXCLUDED.twitter_link,
                youtube_link = EXCLUDED.youtube_link
            WHERE affiliates.user_id = EXCLUDED.user_id
        `, [
            userId, application.name, application.email, application.phone, application.city, 
            referralCode, 'Approved', 
            application.instagram_link, application.facebook_link, application.twitter_link, application.youtube_link
        ]);
        console.log("Upsert Success!");
    } catch (e) {
        console.error("Upsert Exception:", e);
    } finally {
        process.exit(0);
    }
}

testInsert();
