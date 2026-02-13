const fs = require('fs');
const path = require('path');

const CLOUDINARY_CLOUD_NAME = 'dgiwx2p7n';
const CLOUDINARY_UPLOAD_PRESET = 'JSweet';

async function testSpecific() {
    try {
        const filePath = path.join(__dirname, 'uploads', '1767090998896-282992123.jpeg');
        const fileName = path.basename(filePath);

        if (!fs.existsSync(filePath)) {
            console.error('File does NOT exist:', filePath);
            return;
        }

        const fileBuffer = fs.readFileSync(filePath);
        const blob = new Blob([fileBuffer]);

        const formData = new FormData();
        formData.append('file', blob, fileName);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        console.log(`Testing upload for ${fileName}...`);

        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        const data = await response.json();
        if (!response.ok) {
            console.error('Upload Failed:', JSON.stringify(data, null, 2));
        } else {
            console.log('Upload Success:', data.secure_url);
        }
    } catch (error) {
        console.error('Test Error:', error);
    }
}

testSpecific();
