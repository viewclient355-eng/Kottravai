
const Razorpay = require('razorpay');
require('dotenv').config({ path: './.env' });

const razorpay = new Razorpay({
    key_id: (process.env.RAZORPAY_KEY_ID || '').trim(),
    key_secret: (process.env.RAZORPAY_KEY_SECRET || '').trim()
});

async function test() {
    console.log("Testing Razorpay with Key ID:", process.env.RAZORPAY_KEY_ID);
    console.log("Secret Prefix:", process.env.RAZORPAY_KEY_SECRET?.substring(0, 4));

    try {
        const payments = await razorpay.payments.all({ count: 1 });
        console.log("✅ Success! Authentication verified. Found payments:", payments.count);
    } catch (err) {
        console.error("❌ Failed! Error:", JSON.stringify(err, null, 2));
    }
}

test();
