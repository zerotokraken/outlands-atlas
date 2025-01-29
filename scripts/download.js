import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Get the map URL from environment variables
const MAP_URL = process.env.map_url;
if (!MAP_URL) {
    console.error('map_url is not defined in .env.local');
    process.exit(1);
}

async function ensureDirectoryExists(dir) {
    try {
        await fs.access(dir);
    } catch {
        await fs.mkdir(dir, { recursive: true });
    }
}

async function downloadFile(url, filePath) {
    try {
        const response = await fetch(url, {
            headers: {
                'Accept': 'image/png',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const buffer = await response.arrayBuffer();
        await fs.writeFile(filePath, Buffer.from(buffer));
        return true;
    } catch (error) {
        console.error(`Error downloading ${url}:`, error.message);
        return false;
    }
}

async function cleanupFiles(floorName, config) {
    const floorDir = path.join('src', 'floors', floorName, 'tiles');
    
    try {
        // Get all directories in the floor's tiles directory
        const dirs = await fs.readdir(floorDir);
        
        // Create ranges for both primary and secondary tiles
        const dirRanges = [];
        const tileRanges = [];

        // Add primary ranges
        dirRanges.push([config.primary.startDir, config.primary.endDir]);
        tileRanges.push([config.primary.startTile, config.primary.endTile]);

        // Add secondary ranges if they exist
        if (config.secondaries) {
            for (const secondary of config.secondaries) {
                dirRanges.push([secondary.startDir, secondary.endDir]);
                tileRanges.push([secondary.startTile, secondary.endTile]);
            }
        } else if (config.secondary && config.secondary.endDir > 0) {
            // Handle old format for backward compatibility
            dirRanges.push([config.secondary.startDir, config.secondary.endDir]);
            tileRanges.push([config.secondary.startTile, config.secondary.endTile]);
        }

        for (const dir of dirs) {
            const dirPath = path.join(floorDir, dir);
            const dirStat = await fs.stat(dirPath);
            
            if (dirStat.isDirectory()) {
                const dirNum = parseInt(dir);
                
                // Check if directory is in any of the ranges
                const inRange = dirRanges.some(([start, end]) => dirNum >= start && dirNum <= end);
                if (!inRange) {
                    console.log(`Removing directory outside all ranges: ${dirPath}`);
                    await fs.rm(dirPath, { recursive: true });
                    continue;
                }
                
                // Check files within valid directories
                const files = await fs.readdir(dirPath);
                for (const file of files) {
                    if (file.endsWith('.png')) {
                        const tileNum = parseInt(file.split('.')[0]);
                        // Check if tile is in any of the ranges
                        const inRange = tileRanges.some(([start, end]) => tileNum >= start && tileNum <= end);
                        if (!inRange) {
                            const filePath = path.join(dirPath, file);
                            console.log(`Removing file outside all ranges: ${filePath}`);
                            await fs.unlink(filePath);
                        }
                    }
                }
            }
        }
    } catch (error) {
        if (error.code !== 'ENOENT') { // Ignore if directory doesn't exist
            console.error('Error during cleanup:', error);
        }
    }
}

async function downloadTileSet(floorName, tileSet, label) {
    let downloaded = 0;
    const total = (tileSet.endDir - tileSet.startDir + 1) * (tileSet.endTile - tileSet.startTile + 1);
    
    // Create array of directory numbers
    const directories = Array.from(
        {length: tileSet.endDir - tileSet.startDir + 1}, 
        (_, i) => i + tileSet.startDir
    );
    
    // Create array of file numbers
    const fileNumbers = Array.from(
        {length: tileSet.endTile - tileSet.startTile + 1}, 
        (_, i) => i + tileSet.startTile
    );
    
    // Ensure floor directory exists
    const floorDir = path.join('src', 'floors', floorName, 'tiles');
    await ensureDirectoryExists(floorDir);
    
    for (const dir of directories) {
        const dirPath = path.join(floorDir, dir.toString());
        await ensureDirectoryExists(dirPath);
        
        for (const fileNum of fileNumbers) {
            const filePath = path.join(dirPath, `${fileNum}.png`);
            
            // Check if file exists
            try {
                await fs.access(filePath);
                downloaded++;
                const percent = Math.round(downloaded/total*100);
                if (percent % 5 === 0) {
                    console.log(`[${label}] Progress: ${downloaded}/${total} (${percent}%)`);
                }
                continue;
            } catch {
                // File doesn't exist, download it
                console.log(`[${label}] Attempting to download: ${dir}/${fileNum}.png`);
                const url = `${MAP_URL}${dir}/${fileNum}.png`;
                const success = await downloadFile(url, filePath);
                if (success) {
                    downloaded++;
                    const percent = Math.round(downloaded/total*100);
                    if (percent % 5 === 0) {
                        console.log(`[${label}] Progress: ${downloaded}/${total} (${percent}%)`);
                    }
                }
                // Add a small delay between downloads
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
    }
}

async function downloadFloorTiles(floorName) {
    // Read the required tiles configuration
    const configPath = path.join('src', 'floors', floorName, 'required_tiles.json');
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent).tiles;
    
    // Handle both old and new format
    if ('primary' in config) {
        // New format with primary/secondary tiles
        // Clean up files considering both primary and secondary ranges
        await cleanupFiles(floorName, config);
        
        // Download primary tiles
        console.log('Downloading primary tiles...');
        await downloadTileSet(floorName, config.primary, 'Primary');
        
        // Download secondary tiles if they exist
        if (config.secondaries) {
            for (let i = 0; i < config.secondaries.length; i++) {
                console.log(`Downloading secondary tiles set ${i + 1}...`);
                await downloadTileSet(floorName, config.secondaries[i], `Secondary ${i + 1}`);
            }
        } else if (config.secondary && config.secondary.endDir > 0) {
            // Handle old format for backward compatibility
            console.log('Downloading secondary tiles...');
            await downloadTileSet(floorName, config.secondary, 'Secondary');
        }
    } else {
        // Old format
        console.log('Downloading tiles...');
        await cleanupFiles(floorName, { primary: config });
        await downloadTileSet(floorName, config, 'Main');
    }
}

// Get floor name from command line argument
const floorName = process.argv[2];
if (!floorName) {
    console.error('Please provide a floor name as an argument (e.g., node download.js sewers)');
    process.exit(1);
}

console.log(`Downloading tiles for ${floorName}...`);
downloadFloorTiles(floorName).catch(console.error);
