import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function optimizeImages(directoryPath) {
    try {
        const entries = await fs.readdir(directoryPath, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(directoryPath, entry.name);
            
            if (entry.isDirectory()) {
                // Recursively process subdirectories
                await optimizeImages(fullPath);
            } else if (entry.name.endsWith('.png')) {
                console.log(`Optimizing: ${fullPath}`);
                
                try {
                    // Read the image
                    const image = sharp(fullPath);
                    
                    // Optimize as PNG with reduced quality
                    await image
                        .png({
                            quality: 80,
                            compressionLevel: 9,
                            palette: true
                        })
                        .toFile(fullPath + '.optimized');
                        
                    // Replace original with optimized version
                    await fs.unlink(fullPath);
                    await fs.rename(fullPath + '.optimized', fullPath);
                    
                } catch (err) {
                    console.error(`Error processing ${fullPath}:`, err);
                }
            }
        }
    } catch (err) {
        // Skip if directory doesn't exist
        if (err.code !== 'ENOENT') {
            console.error(`Error processing ${directoryPath}:`, err);
        }
    }
}

async function optimizeTiles() {
    const floorsDir = path.join(__dirname, '../src/floors');
    const floors = await fs.readdir(floorsDir);

    for (const floor of floors) {
        // Process tiles directory
        const tilesDir = path.join(floorsDir, floor, 'tiles');
        await optimizeImages(tilesDir);
        
    }
}

optimizeTiles().catch(console.error);
