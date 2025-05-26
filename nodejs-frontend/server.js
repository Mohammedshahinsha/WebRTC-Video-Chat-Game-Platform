const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.json': 'application/json',
};

const staticDir = path.join(__dirname, 'static');
const templatesDir = path.join(__dirname, 'templates');

const BASE_PATH = process.env.BASE_PATH || '/chatforyou';

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  let filePath = parsedUrl.pathname;
  if (filePath.startsWith(BASE_PATH)) {
    filePath = filePath.replace(new RegExp('^' + BASE_PATH), '') || '/';
  }
  if (filePath === '/' || filePath === '/index.html') {
    filePath = '/templates/roomlist.html';
  }
  if (filePath.startsWith('/css') || filePath.startsWith('/js') || filePath.startsWith('/images') || filePath.startsWith('/fonts') || filePath.startsWith('/vendor')) {
    filePath = '/static' + filePath;
  } else if (filePath.startsWith('/templates')) {
    // 그대로 사용
  } else if (filePath.endsWith('.html')) {
    filePath = '/templates' + filePath;
  }
  const absPath = path.join(__dirname, filePath);
  fs.readFile(absPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }
    const ext = path.extname(absPath);
    let mimeType = mimeTypes[ext] || 'application/octet-stream';
    if (mimeType.startsWith('text/') || mimeType === 'application/javascript') {
      mimeType += '; charset=utf-8';
    }
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Static server running at http://localhost:${PORT}`);
});
