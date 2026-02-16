const net = require('net');

const HOSTS = ['smtp.gmail.com', 'smtp.googlemail.com'];
const PORTS = [465, 587, 25, 2525];

async function checkPort(host, port) {
    return new Promise((resolve) => {
        const start = Date.now();
        const socket = new net.Socket();

        socket.setTimeout(5000);

        socket.on('connect', () => {
            const duration = Date.now() - start;
            socket.destroy();
            resolve({ status: 'OPEN', duration });
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve({ status: 'TIMEOUT', error: 'Connection timed out after 5s' });
        });

        socket.on('error', (err) => {
            socket.destroy();
            resolve({ status: 'CLOSED', error: err.message });
        });

        socket.connect(port, host);
    });
}

async function runDiagnostics() {
    console.log('🔍 Starting SMTP Connectivity Diagnostics...\n');

    for (const host of HOSTS) {
        console.log(`--- Testing Host: ${host} ---`);
        for (const port of PORTS) {
            process.stdout.write(`  Probing port ${port}... `);
            const result = await checkPort(host, port);
            if (result.status === 'OPEN') {
                console.log(`✅ OPEN (${result.duration}ms)`);
            } else {
                console.log(`❌ ${result.status} (${result.error})`);
            }
        }
        console.log('');
    }

    console.log('💡 Tip: If all ports show TIMEOUT, Render is likely blocking outbound SMTP traffic.');
}

runDiagnostics();
