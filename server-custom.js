const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = parseInt(process.env.PORT, 10) || 3000;

// In standalone mode, we need to handle static files manually
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    createServer(async (req, res) => {
        try {
            const parsedUrl = parse(req.url, true);
            const { pathname } = parsedUrl;

            // Handle static files from public directory
            if (pathname.startsWith('/static/')) {
                const filePath = path.join(__dirname, 'public', pathname);
                
                console.log(`Attempting to serve static file: ${pathname} from ${filePath}`);
                
                if (fs.existsSync(filePath)) {
                    const stat = fs.statSync(filePath);
                    
                    if (stat.isFile()) {
                        // Set appropriate content type
                        const ext = path.extname(filePath).toLowerCase();
                        const contentTypes = {
                            '.json': 'application/json',
                            '.png': 'image/png',
                            '.jpg': 'image/jpeg',
                            '.jpeg': 'image/jpeg',
                            '.gif': 'image/gif',
                            '.svg': 'image/svg+xml',
                            '.ico': 'image/x-icon',
                            '.css': 'text/css',
                            '.js': 'application/javascript',
                            '.html': 'text/html',
                        };
                        
                        const contentType = contentTypes[ext] || 'application/octet-stream';
                        res.setHeader('Content-Type', contentType);
                        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
                        
                        const fileStream = fs.createReadStream(filePath);
                        fileStream.pipe(res);
                        console.log(`✓ Served static file: ${pathname}`);
                        return;
                    }
                } else {
                    console.log(`✗ Static file not found: ${filePath}`);
                }
            }

            // Handle all other requests with Next.js
            await handle(req, res, parsedUrl);
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    })
    .once('error', (err) => {
        console.error(err);
        process.exit(1);
    })
    .listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
        console.log(`> Static files directory: ${path.join(__dirname, 'public', 'static')}`);
        
        // Log static files for debugging
        const staticDir = path.join(__dirname, 'public', 'static');
        if (fs.existsSync(staticDir)) {
            console.log('> Available static files:');
            const files = fs.readdirSync(staticDir, { recursive: true });
            files.forEach(file => {
                console.log(`  - /static/${file}`);
            });
        } else {
            console.log('> No static directory found');
        }
    });
});
