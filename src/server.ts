import * as express from 'express';
import * as path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express.default();
const PORT = process.env.PORT || 3000;

// API endpoint to get environment variables
app.get('/api/config', (req, res) => {
  res.json({
    cloudcubeUrl: process.env.CLOUDCUBE_URL || ''
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
