import express from 'express';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Log all requests to help debug
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, '../dist'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.json')) {
      res.set('Content-Type', 'application/json');
    }
  }
}));

// Handle directory listing for routes
app.get('/json/routes/', async (req, res) => {
  const routesPath = path.join(__dirname, '../dist/json/routes');
  try {
    const files = await fs.promises.readdir(routesPath);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    res.json(jsonFiles);
  } catch (error) {
    console.error('Error reading routes directory:', error);
    res.json([]);
  }
});

// Explicitly handle .json files before the catch-all route
app.get('*.json', (req, res) => {
  const jsonPath = path.join(__dirname, '../dist', req.path);
  res.sendFile(jsonPath);
});

// Send index.html for all other routes to support SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
