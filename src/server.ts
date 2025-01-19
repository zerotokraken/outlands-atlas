import express from 'express';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize S3 client
const s3Client = new S3Client({
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.CLOUDCUBE_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.CLOUDCUBE_SECRET_ACCESS_KEY || ''
  }
});

// Extract bucket and path prefix from CLOUDCUBE_URL
const cloudcubeUrl = process.env.CLOUDCUBE_URL || '';
const match = cloudcubeUrl.match(/^https:\/\/([^.]+)\.s3\.amazonaws\.com\/(.+)$/);
const [bucket, prefix] = match ? [match[1], match[2]] : ['', ''];

console.log('Environment variables:', {
  CLOUDCUBE_URL: cloudcubeUrl || 'not set',
  NODE_ENV: process.env.NODE_ENV || 'not set',
  bucket,
  prefix
});

// API endpoint to get environment variables
app.get('/api/config', (req, res) => {
  console.log('Requested config, CLOUDCUBE_URL:', cloudcubeUrl || 'not set');
  res.json({
    cloudcubeUrl: cloudcubeUrl || ''
  });
});

// API endpoint to proxy S3 requests
app.get('/api/s3/*', async (req, res) => {
  try {
    const filePath = req.params[0];
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: `${prefix}/${filePath}`
    });

    const response = await s3Client.send(command);
    const stream = response.Body;
    
    if (!stream) {
      throw new Error('No data received from S3');
    }

    // Set appropriate headers
    if (response.ContentType) {
      res.setHeader('Content-Type', response.ContentType);
    }
    if (response.ContentLength) {
      res.setHeader('Content-Length', response.ContentLength);
    }

    // Convert stream to buffer and send
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    res.send(buffer);
  } catch (error) {
    console.error('S3 proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch file from S3' });
  }
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist')));

// Send index.html for all routes to support SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
