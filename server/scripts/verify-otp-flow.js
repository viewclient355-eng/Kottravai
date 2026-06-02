const axios = require('axios');
const assert = require('assert');

const API_BASE = 'http://localhost:5000/api';
const TEST_PHONE = '9999999999';

async function runTests(iterations = 50) {
    console.log(`Starting ${iterations} consecutive OTP flow tests...\n`);
    
    let successes = 0;
    const axiosInstance = axios.create({
        withCredentials: true,
        validateStatus: () => true // Don't throw on 4xx/5xx
    });

    for (let i = 1; i <= iterations; i++) {
        console.log(`--- Iteration ${i}/${iterations} ---`);
        try {
            // 1. Send OTP
            const sendRes = await axiosInstance.post(`${API_BASE}/auth/send-whatsapp-otp`, { phone: TEST_PHONE });
            assert.strictEqual(sendRes.status, 200, `Send OTP returned ${sendRes.status}`);
            assert.strictEqual(sendRes.data.success, true, "Send OTP success flag false");
            const testOtp = sendRes.data.test_otp;
            assert.ok(testOtp, "Test OTP not returned by backend");

            // 2. Verify OTP
            const verifyRes = await axiosInstance.post(`${API_BASE}/auth/verify-whatsapp-otp`, { phone: TEST_PHONE, otp: testOtp });
            assert.strictEqual(verifyRes.status, 200, `Verify OTP returned ${verifyRes.status}`);
            assert.strictEqual(verifyRes.data.success, true, "Verify OTP success flag false");
            assert.ok(verifyRes.data.customer_id, "Customer ID missing from verify response");

            // 3. Cookie Verification
            const setCookieHeader = verifyRes.headers['set-cookie'];
            assert.ok(setCookieHeader, "Set-Cookie header missing");
            const cookieString = setCookieHeader[0];
            assert.ok(cookieString.includes('guest_session='), "guest_session cookie not set");
            assert.ok(cookieString.includes('HttpOnly'), "Cookie missing HttpOnly flag");

            // Extract the cookie value for subsequent requests
            const cookieVal = cookieString.split(';')[0];
            
            // 4. Guest Profile Retrieval (Requires Cookie)
            const profileRes = await axiosInstance.get(`${API_BASE}/auth/guest-profile`, {
                headers: { Cookie: cookieVal }
            });
            assert.strictEqual(profileRes.status, 200, `Profile returned ${profileRes.status}`);
            assert.strictEqual(profileRes.data.isAuthenticated, true, "Not authenticated via cookie");
            assert.strictEqual(profileRes.data.user.id, verifyRes.data.customer_id, "Customer ID mismatch");

            console.log(`✅ Iteration ${i} passed successfully.\n`);
            successes++;
        } catch (err) {
            console.error(`❌ Iteration ${i} failed:`, err.message);
            process.exit(1);
        }
    }

    console.log(`\n🎉 SUCCESS: ${successes}/${iterations} OTP flows completed without a single error!`);
}

runTests(50);
