import express from 'express';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Log environment variables on startup
console.log('Environment variables:', {
  CLOUDCUBE_URL: process.env.CLOUDCUBE_URL || 'not set',
  NODE_ENV: process.env.NODE_ENV || 'not set'
});

// API endpoint to get environment variables
app.get('/api/config', (req, res) => {
  const cloudcubeUrl = process.env.CLOUDCUBE_URL;
  console.log('Requested config, CLOUDCUBE_URL:', cloudcubeUrl || 'not set');
  res.json({
    cloudcubeUrl: cloudcubeUrl || ''
  });
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
