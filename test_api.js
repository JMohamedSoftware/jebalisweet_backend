const http = require('http');

const testEndpoint = (path) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: 'GET',
        };

        const req = http.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log(`\n--- Testing ${path} ---`);
                console.log(`Status Code: ${res.statusCode}`);
                if (res.statusCode === 200) {
                    try {
                        const jsonData = JSON.parse(data);
                        console.log(`Items count: ${Array.isArray(jsonData) ? jsonData.length : 'Not an array'}`);
                        if (Array.isArray(jsonData) && jsonData.length > 0) {
                            console.log('Sample item:', JSON.stringify(jsonData[0], null, 2));
                        }
                    } catch (e) {
                        console.log('Response is not JSON:', data.substring(0, 100));
                    }
                } else {
                    console.log('Error Response:', data);
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request to ${path}: ${e.message}`);
            if (e.code === 'ECONNREFUSED') {
                console.error('Connection refused! Is the server running on localhost:5000?');
            }
            resolve(); // Resolve anyway to continue testing
        });

        req.end();
    });
};

const runTests = async () => {
    console.log('Starting API Tests...');
    // Add a small delay to ensure server is ready if just started
    await new Promise(r => setTimeout(r, 1000));

    await testEndpoint('/api/products?category=Chocolats&limit=5');
    await testEndpoint('/api/categories');
};

runTests();
