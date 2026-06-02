const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const supabase = require('./supabase');
const crypto = require('crypto');

async function testOnboard() {
    try {
        const application = {
            name: 'Muthulakshmi ',
            email: 'muthubakya92@gmail.com'
        };
        const tempPassword = crypto.randomBytes(6).toString('hex');

        console.log("Trying createUser...");
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: application.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { full_name: application.name, role: 'affiliate' }
        });

        if (authError) {
            console.log("Auth Error:", authError.message);
            if (authError.message.includes('already registered') || authError.status === 422 || authError.code === 'email_exists' || authError.message.includes('User already registered')) {
                console.log("Searching existing users...");
                let userId = null;
                let page = 1;
                while (!userId) {
                    const { data: listData, error: listError } = await supabase.auth.admin.listUsers({
                        page,
                        perPage: 1000
                    });

                    if (listError) {
                        console.error("List Error:", listError);
                        break;
                    }

                    const usersList = listData?.users || [];
                    if (usersList.length === 0) {
                        console.log("End of list.");
                        break;
                    }

                    const matchedUser = usersList.find(u => u.email?.toLowerCase() === application.email.toLowerCase());
                    if (matchedUser) {
                        userId = matchedUser.id;
                        console.log("Matched User ID:", userId);
                        break;
                    }
                    page++;
                    if (page > 50) break;
                }
                if (!userId) {
                    console.log("User not found after search.");
                }
            } else {
                console.log("Other auth error:", authError);
            }
        } else {
            console.log("Created successfully. User ID:", authData.user.id);
        }
    } catch (e) {
        console.error("Exception:", e);
    }
}

testOnboard();
