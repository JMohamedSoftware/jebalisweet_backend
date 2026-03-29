const axios = require('axios');
const mongoose = require('mongoose');
const User = require('./models/User.js'); 
require('dotenv').config();

const API_URL = 'http://localhost:5000/api';
const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/jebalisweet';

async function runTests() {
  console.log('🛡️ Starting Security & Verification Tests...\n');

  try {
    await mongoose.connect(DB_URI);
    console.log('✅ Connected to DB for verification\n');

    const testEmail = `testuser_${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    // 1. Test Registration
    console.log('Step 1: Registering new user...');
    const regRes = await axios.post(`${API_URL}/auth/register`, {
      firstName: 'Test',
      lastName: 'Security',
      email: testEmail,
      password: testPassword,
      phone: '55555555'
    });

    if (regRes.data.status === 'pending_verification') {
      console.log('✅ Success: Status is pending_verification');
    } else {
      console.error('❌ Fail: Expected pending_verification status');
    }

    // 2. Test Login (Unverified)
    console.log('\nStep 2: Attempting login before verification...');
    try {
      await axios.post(`${API_URL}/auth/login`, {
        email: testEmail,
        password: testPassword
      });
      console.error('❌ Fail: Login should have been blocked');
    } catch (err) {
      if (err.response?.status === 403 && err.response.data.status === 'pending_verification') {
        console.log('✅ Success: Login blocked with pending_verification');
      } else {
        console.error('❌ Fail: Unexpected error during login block');
      }
    }

    // 3. Verify Email (Directly fetch OTP from DB for testing)
    console.log('\nStep 3: Verifying email...');
    const user = await User.findOne({ email: testEmail });
    if (!user || !user.emailVerificationOTP) {
        throw new Error('User or OTP not found in DB');
    }

    const verifyRes = await axios.post(`${API_URL}/auth/verify-email`, {
      userId: user._id,
      otp: user.emailVerificationOTP
    });

    console.log('✅ Verification Response:', verifyRes.data.message);

    // 4. Test Login (Verified)
    console.log('\nStep 4: Attempting login after verification...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
    });

    if (loginRes.data.token) {
      console.log('✅ Success: Login allowed, token received');
    } else {
      console.error('❌ Fail: Login still blocked or no token');
    }

    // 5. Cleanup
    await User.deleteOne({ email: testEmail });
    console.log('\n🗑️ Test User cleaned up.');

  } catch (error) {
    console.error('\n❌ Test Suite Failed:', error.message);
    if (error.response) console.error('Response:', error.response.data);
  } finally {
    await mongoose.connection.close();
    process.exit();
  }
}

runTests();
