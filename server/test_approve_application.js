const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./db');
const supabase = require('./supabase');
const crypto = require('crypto');
const { sendEmail } = require('./utils/mailer');
const { getAffiliateWelcomeTemplate } = require('./utils/emailTemplates');
const { sendAllianceApprovalWhatsApp } = require('./utils/whatsapp');

async function testApproval() {
    try {
        const id = 'a64cf85c-8a27-4c8b-ba75-e5236eebc279';
        const appRes = await db.query('SELECT * FROM affiliate_applications WHERE id = $1', [id]);
        if (appRes.rows.length === 0) {
            console.log("Application not found");
            return;
        }
        const application = appRes.rows[0];

        const tempPassword = crypto.randomBytes(6).toString('hex');
        const referralCode = `${application.name.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '')}${Math.floor(1000 + Math.random() * 9000)}`;

        let userId = application.user_id;
        let userIdWasFoundInSupabase = false;

        console.log(`🚀 Starting onboarding for ${application.email}`);

        if (!userId) {
            console.log("Creating user...");
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: application.email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: { full_name: application.name, role: 'affiliate' }
            });

            if (authError) {
                console.log("Auth error:", authError.message);
                if (authError.message.includes('already registered') || authError.status === 422 || authError.code === 'email_exists' || authError.message.includes('User already registered')) {
                    let page = 1;
                    while (!userId) {
                        console.log(`Listing users page ${page}...`);
                        const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
                            page,
                            perPage: 1000
                        });

                        const usersList = listData?.users || [];
                        if (listError || usersList.length === 0) {
                            console.log(`⏹️ Search ended at page ${page}. User not found.`);
                            break;
                        }

                        const matchedUser = usersList.find(u => u.email?.toLowerCase() === application.email.toLowerCase());
                        if (matchedUser) {
                            userId = matchedUser.id;
                            userIdWasFoundInSupabase = true;
                            console.log(`✅ Existing user found: ${userId}`);
                            break;
                        }
                        page++;
                        if (page > 50) break;
                    }

                    if (!userId) {
                        throw new Error(`User with email ${application.email} already exists but could not be located in auth system.`);
                    }
                } else {
                    throw authError;
                }
            } else {
                userId = authData.user.id;
                console.log(`✅ Created new user ID in Supabase: ${userId}`);
            }
        }

        console.log(`✅ Updating metadata for user ${userId}`);
        await supabase.auth.admin.updateUserById(userId, {
            user_metadata: { role: 'affiliate' }
        });

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

        console.log(`📧 Sending welcome email to ${application.email}`);
        await sendEmail({
            to: application.email,
            subject: 'Welcome to Kottravai Affiliate Program!',
            html: getAffiliateWelcomeTemplate({
                name: application.name,
                email: application.email,
                password: (application.user_id || userIdWasFoundInSupabase) ? 'Use your existing Kottravai password' : tempPassword,
                referral_code: referralCode
            })
        });

        console.log(`📱 Sending WhatsApp...`);
        const waResult = await sendAllianceApprovalWhatsApp(
            application.phone,
            application.name,
            (application.user_id || userIdWasFoundInSupabase) ? 'Use your existing password' : tempPassword,
            referralCode
        );
        console.log("WhatsApp Result:", waResult);

        console.log("All done!");
    } catch (e) {
        console.error("ONBOARD ERROR:", e);
    } finally {
        process.exit(0);
    }
}
testApproval();
