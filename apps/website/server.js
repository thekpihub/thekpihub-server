/**
 * Local preview server — serves the site exactly as Hostinger does.
 *
 * The document root is the repo root, not landing/. All 33 pages live at the top
 * level; landing/ holds only the compiled JS and CSS the pages pull in.
 *
 *   npm run build:site && node server.js   ->   http://localhost:3000
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  // Strip the query/hash, then resolve INSIDE the root. Joining an unsanitised
  // req.url lets "/../../etc/passwd" walk out of the served directory, so the
  // containment check below is the security boundary, not decoration.
  const urlPath = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
  let filePath = path.resolve(ROOT, '.' + urlPath);

  if (filePath !== ROOT && !filePath.startsWith(ROOT + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      // Mirror the server's ErrorDocument 404 so local 404s look like production.
      fs.readFile(path.join(ROOT, '404.html'), (e404, page) => {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(e404 ? 'Not found' : page);
      });
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(content);
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`The KPI Hub — serving ${ROOT}\n  http://localhost:${port}`);
});
