import sharp from 'sharp';
import path from 'path';

const sizes = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 192, name: 'android-chrome-192x192.png' },
    { size: 512, name: 'android-chrome-512x512.png' }
];

async function generateFavicons() {
    const inputImage = 'src/images/outlands_logo.png';
    
    // Process each size
    for (const { size, name } of sizes) {
        await sharp(inputImage)
            .resize(size, size, {
                fit: 'contain',
                background: { r: 26, g: 26, b: 26, alpha: 1 } // #1a1a1a background
            })
            .toFile(path.join('favicon', name));
        
        console.log(`Generated ${name}`);
    }

    // Generate ICO file (contains both 16x16 and 32x32)
    const ico16 = await sharp(inputImage)
        .resize(16, 16, { fit: 'contain', background: { r: 26, g: 26, b: 26, alpha: 1 } })
        .toBuffer();
    
    const ico32 = await sharp(inputImage)
        .resize(32, 32, { fit: 'contain', background: { r: 26, g: 26, b: 26, alpha: 1 } })
        .toBuffer();

    // Write both buffers to favicon.ico
    await sharp(ico32)
        .toFile(path.join('favicon', 'favicon.ico'));
    
    console.log('Generated favicon.ico');
}

generateFavicons().catch(console.error);
