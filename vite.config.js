import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

function queueSyncApiPlugin() {
  const dbDir = path.resolve(process.cwd(), 'data');
  const dbFile = path.join(dbDir, 'queue_db.json');

  // Ensure data dir and file exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({ queues: [], entries: [] }, null, 2), 'utf-8');
  }

  return {
    name: 'queue-sync-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';

        if (url.startsWith('/api/queue-data')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            res.end();
            return;
          }

          if (req.method === 'GET') {
            try {
              const data = fs.readFileSync(dbFile, 'utf-8');
              res.statusCode = 200;
              res.end(data);
            } catch (err) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: err.message }));
            }
            return;
          }

          if (req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                fs.writeFileSync(dbFile, JSON.stringify(parsed, null, 2), 'utf-8');
                res.statusCode = 200;
                res.end(JSON.stringify({ success: true, timestamp: Date.now() }));
              } catch (err) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: err.message }));
              }
            });
            return;
          }
        }

        if (url.startsWith('/api/clear-all')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          fs.writeFileSync(dbFile, JSON.stringify({ queues: [], entries: [] }, null, 2), 'utf-8');
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, cleared: true }));
          return;
        }

        // Return LAN IP info helper
        if (url.startsWith('/api/network-info')) {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.statusCode = 200;
          res.end(JSON.stringify({ lanIp: '192.168.0.5', port: 3000 }));
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), queueSyncApiPlugin()],
  server: {
    port: 3000,
    host: true
  }
});
