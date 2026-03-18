const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

const testCors = async (origin, expectedSuccess) => {
    try {
        const response = await axios.get(BASE_URL, {
            headers: { 'Origin': origin }
        });

        const allowOrigin = response.headers['access-control-allow-origin'];

        if (expectedSuccess) {
            if (allowOrigin === origin) {
                console.log(`✅ [PASS] Origin ${origin} allowed.`);
            } else {
                console.log(`❌ [FAIL] Origin ${origin} allowed but header mismatch: ${allowOrigin}`);
            }
        } else {
            console.log(`❌ [FAIL] Origin ${origin} should be blocked but returned 200 OK.`);
        }
    } catch (error) {
        if (!expectedSuccess && error.response) {
            // If we expect failure, a CORS error usually results in a browser blocking it, 
            // but in axios/server-side, the server might return 200 but WITHOUT the header, 
            // OR return an error if the cors middleware blocks it explicitly.
            // My cors config does `callback(new Error('Not allowed by CORS'))` so it should return 500 or similar.
            if (error.response.status === 500 && error.response.data && error.response.data.message === 'Not allowed by CORS') {
                console.log(`✅ [PASS] Origin ${origin} blocked correctly (500 Not allowed by CORS).`);
            } else {
                console.log(`⚠️ [WARN] Origin ${origin} blocked with status ${error.response.status}: ${error.message}`);
            }
        } else if (!expectedSuccess) {
            console.log(`✅ [PASS] Origin ${origin} blocked (Network Error/CORS).`);
        } else {
            console.log(`❌ [FAIL] Origin ${origin} failed: ${error.message}`);
        }
    }
};

(async () => {
    console.log('Starting CORS Tests...');
    await testCors('http://localhost:3000', true);
    await testCors('https://jebalisweet.tn', true);
    await testCors('https://malicious-site.com', false);
    await testCors('https://jebalisweet.vercel.app', false); // Should be blocked now
})();
