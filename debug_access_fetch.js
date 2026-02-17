const API_URL = 'http://localhost:5000/api';

async function testEndpoints() {
    console.log('--- Testing API Access (Fetch) ---');

    try {
        const catRes = await fetch(`${API_URL}/categories`);
        console.log(`Categories Status: ${catRes.status}`);
        if (catRes.ok) {
            const data = await catRes.json();
            console.log(`Categories Count: ${Array.isArray(data) ? data.length : 'Not array'}`);
        } else {
            console.log('Categories Error:', await catRes.text());
        }
    } catch (e) {
        console.error('Categories Failed:', e.message);
    }

    try {
        const prodRes = await fetch(`${API_URL}/products`);
        console.log(`Products Status: ${prodRes.status}`);
        if (prodRes.ok) {
            const data = await prodRes.json();
            console.log(`Products Count: ${data.products ? data.products.length : 'No products field'}`);
        } else {
            console.log('Products Error:', await prodRes.text());
        }
    } catch (e) {
        console.error('Products Failed:', e.message);
    }
}

testEndpoints();
