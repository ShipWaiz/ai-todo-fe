import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, 'dist');
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];

  // Health check routes for container platforms
  if (['/health', '/healthz', '/api/health', '/ping'].includes(urlPath)) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', service: 'ai-todo-fe', port: PORT }));
  }

  // Resolve file path in dist/
  let filePath = path.join(DIST_DIR, urlPath === '/' ? 'index.html' : urlPath);

  // If file doesn't exist, fallback to index.html (SPA routing)
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // If dist folder hasn't been built yet, show placeholder
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h1>AI To-Do Frontend is Running</h1><p>Run npm run build to populate static assets.</p>');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Frontend production server running on http://0.0.0.0:${PORT}`);
});
