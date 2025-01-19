import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import { Readable } from 'stream';
import { finished } from 'stream/promises';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

const s3Client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const CLOUDCUBE_URL = process.env.CLOUDCUBE_URL;
const bucketName = CLOUDCUBE_URL.match(/https:\/\/(.*?)\.s3\.amazonaws\.com/)[1];
const cubeName = CLOUDCUBE_URL.split('/').pop();

async function downloadFromS3(s3Key, localPath) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: `${cubeName}/${s3Key}`
    });
    
    const response = await s3Client.send(command);
    await fs.mkdir(path.dirname(localPath), { recursive: true });
    
    const writeStream = fs.createWriteStream(localPath);
    await finished(Readable.fromWeb(response.Body).pipe(writeStream));
  } catch (error) {
    console.error(`Error downloading ${s3Key}:`, error);
    throw error;
  }
}

async function downloadAllTiles() {
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: `${cubeName}/floors`
  });

  try {
    const response = await s3Client.send(command);
    const tempDir = path.join(__dirname, '../temp');
    await fs.mkdir(tempDir, { recursive: true });

    for (const object of response.Contents || []) {
      const localPath = path.join(tempDir, object.Key.replace(`${cubeName}/`, ''));
      await downloadFromS3(object.Key.replace(`${cubeName}/`, ''), localPath);
      console.log(`Downloaded ${object.Key}`);
    }

    return tempDir;
  } catch (error) {
    console.error('Error listing objects:', error);
    throw error;
  }
}

async function uploadToHeroku(localPath, remotePath) {
  try {
    console.log(`Uploading ${localPath} to ${remotePath}`);
    await execAsync(`heroku static:upload ${localPath} ${remotePath}`);
  } catch (error) {
    console.error(`Error uploading ${localPath}:`, error);
    throw error;
  }
}

async function uploadDirectory(localPath, remotePath) {
  try {
    const files = await fs.readdir(localPath, { withFileTypes: true });
    
    for (const file of files) {
      const localFilePath = path.join(localPath, file.name);
      const remoteFilePath = path.join(remotePath, file.name).replace(/\\/g, '/');
      
      if (file.isDirectory()) {
        await uploadDirectory(localFilePath, remoteFilePath);
      } else {
        await uploadToHeroku(localFilePath, remoteFilePath);
      }
    }
  } catch (error) {
    console.error(`Error processing ${localPath}:`, error);
    throw error;
  }
}

async function cleanup(tempDir) {
  try {
    await fs.rm(tempDir, { recursive: true, force: true });
    console.log('Cleaned up temporary files');
  } catch (error) {
    console.error('Error cleaning up:', error);
  }
}

async function main() {
  let tempDir = null;
  try {
    console.log('Starting tile download from CloudCube...');
    tempDir = await downloadAllTiles();
    
    console.log('Starting tile upload to Heroku...');
    await uploadDirectory(path.join(tempDir, 'floors'), 'src/floors');
    
    console.log('Tile upload complete!');
  } catch (error) {
    console.error('Process failed:', error);
    process.exit(1);
  } finally {
    if (tempDir) {
      await cleanup(tempDir);
    }
  }
}

main();
