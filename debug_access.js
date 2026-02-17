const axios = require('axios');

const API_URL = 'http://localhost:5000/api'; // Assuming running locally on 5000

async function testEndpoints() {
    console.log('--- Testing API Access ---');

    // 1. Test Categories
    try {
        console.log('Fetching Categories...');
        const catRes = await axios.get(`${API_URL}/categories`);
        console.log(`✅ Categories Status: ${catRes.status}`);
        console.log(`✅ Categories Count: ${Array.isArray(catRes.data) ? catRes.data.length : 'Not an array'}`);
    } catch (e) {
        console.error('❌ Categories Failed:', e.message);
        if (e.response) console.error('Response:', e.response.status, e.response.data);
    }

    // 2. Test Products
    try {
        console.log('\nFetching Products...');
        const prodRes = await axios.get(`${API_URL}/products`);
        console.log(`✅ Products Status: ${prodRes.status}`);
        if (prodRes.data && prodRes.data.products) {
            console.log(`✅ Products Count: ${prodRes.data.products.length}`);
        } else {
            console.log('⚠️ Unexpected Products Response format:', Object.keys(prodRes.data));
        }
    } catch (e) {
        console.error('❌ Products Failed:', e.message);
        if (e.response) console.error('Response:', e.response.status, e.response.data);
    }
}

testEndpoints();
