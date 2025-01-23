import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

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
        
        for (const dir of dirs) {
            const dirPath = path.join(floorDir, dir);
            const dirStat = await fs.stat(dirPath);
            
            if (dirStat.isDirectory()) {
                const dirNum = parseInt(dir);
                
                // If directory is outside the required range, delete it
                if (dirNum < config.startDir || dirNum > config.endDir) {
                    console.log(`Removing directory outside range: ${dirPath}`);
                    await fs.rm(dirPath, { recursive: true });
                    continue;
                }
                
                // Check files within valid directories
                const files = await fs.readdir(dirPath);
                for (const file of files) {
                    if (file.endsWith('.png')) {
                        const tileNum = parseInt(file.split('.')[0]);
                        if (tileNum < config.startTile || tileNum > config.endTile) {
                            const filePath = path.join(dirPath, file);
                            console.log(`Removing file outside range: ${filePath}`);
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

async function downloadFloorTiles(floorName) {
    // Read the required tiles configuration
    const configPath = path.join('src', 'floors', floorName, 'required_tiles.json');
    const configContent = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent).tiles;
    
    // Clean up files not in the required range
    await cleanupFiles(floorName, config);
    
    let downloaded = 0;
    const total = (config.endDir - config.startDir + 1) * (config.endTile - config.startTile + 1);
    
    // Create array of directory numbers
    const directories = Array.from(
        {length: config.endDir - config.startDir + 1}, 
        (_, i) => i + config.startDir
    );
    
    // Create array of file numbers
    const fileNumbers = Array.from(
        {length: config.endTile - config.startTile + 1}, 
        (_, i) => i + config.startTile
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
                    console.log(`Progress: ${downloaded}/${total} (${percent}%)`);
                }
                continue;
            } catch {
                // File doesn't exist, download it
                console.log(`Attempting to download: ${dir}/${fileNum}.png`);
                const url = `https://exploreoutlands.com/outlands_newCav/10/${dir}/${fileNum}.png`;
                const success = await downloadFile(url, filePath);
                if (success) {
                    downloaded++;
                    const percent = Math.round(downloaded/total*100);
                    if (percent % 5 === 0) {
                        console.log(`Progress: ${downloaded}/${total} (${percent}%)`);
                    }
                }
                // Add a small delay between downloads
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
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
