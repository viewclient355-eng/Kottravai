const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('--- Env Verification ---');
console.log('RAZORPAY_KEY_ID length:', process.env.RAZORPAY_KEY_ID?.length);
console.log('RAZORPAY_KEY_ID starts with:', process.env.RAZORPAY_KEY_ID?.substring(0, 9));
console.log('RAZORPAY_KEY_ID ends with:', process.env.RAZORPAY_KEY_ID?.substring(process.env.RAZORPAY_KEY_ID.length - 4));
console.log('RAZORPAY_KEY_SECRET length:', process.env.RAZORPAY_KEY_SECRET?.length);
console.log('------------------------');
