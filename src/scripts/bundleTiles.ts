import { promises as fs } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function bundleTilesForFloor(floorNumber: string) {
    const floorPath = join(process.cwd(), 'src', 'floors', `floor-${floorNumber}`);
    const configPath = join(floorPath, 'required_tiles.json');
    const config = JSON.parse(await fs.readFile(configPath, 'utf-8'));
    
    const { startDir, endDir, startTile, endTile } = config.tiles;
    const tilesPerRow = endTile - startTile + 1;
    
    // Create bundles directory if it doesn't exist
    const bundlesDir = join(floorPath, 'bundles');
    try {
        await fs.access(bundlesDir);
    } catch {
        await fs.mkdir(bundlesDir);
    }

    // Process each directory
    for (let dir = startDir; dir <= endDir; dir++) {
        const tileImages: Buffer[] = [];
        const dirPath = join(floorPath, 'tiles', dir.toString());
        
        // Read all tiles in the directory
        for (let tile = startTile; tile <= endTile; tile++) {
            const tilePath = join(dirPath, `${tile}.png`);
            const tileBuffer = await sharp(tilePath).toBuffer();
            tileImages.push(tileBuffer);
        }

        // Create sprite sheet
        const firstTile = await sharp(join(dirPath, `${startTile}.png`)).metadata();
        const tileWidth = firstTile.width || 256;
        const tileHeight = firstTile.height || 256;
        
        // Create a vertical bundle (tiles stacked vertically)
        await sharp({
            create: {
                width: tileWidth,
                height: tileHeight * tilesPerRow,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
        .composite(tileImages.map((buffer, index) => ({
            input: buffer,
            // Stack tiles from top to bottom
            top: index * tileHeight,
            left: 0
        })))
        .toFile(join(bundlesDir, `${dir}.png`));
        
        console.log(`Created bundle for directory ${dir}`);
    }
}

// Process all floors
const floors = ['1', '2', '3', '4', '5', '6', '6.5', '7', '8'];
Promise.all(floors.map(floor => bundleTilesForFloor(floor)))
    .then(() => console.log('All floors processed'))
    .catch(console.error);
