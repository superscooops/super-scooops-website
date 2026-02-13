/**
 * Local dev server for Netlify Functions.
 * Runs on port 9999, processes /.netlify/functions/* calls.
 * Environment variables are loaded from .env.local
 */
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local
try {
    const envFile = readFileSync(resolve(__dirname, '.env.local'), 'utf8');
    for (const line of envFile.split('\n')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length) {
            process.env[key.trim()] = valueParts.join('=').trim();
        }
    }
} catch (e) { /* no .env.local */ }

const PORT = 9999;

const server = createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Extract function name from URL
    const match = req.url?.match(/\/.netlify\/functions\/(.+)/);
    if (!match) {
        res.writeHead(404);
        res.end('Not a function call');
        return;
    }

    const funcName = match[1].split('?')[0];

    try {
        // Dynamically import the function
        const funcPath = resolve(__dirname, `netlify/functions/${funcName}.ts`);

        // Read body
        let body = '';
        for await (const chunk of req) body += chunk;

        // Build event object similar to Netlify
        const event = {
            httpMethod: req.method,
            headers: req.headers,
            body: body || null,
            queryStringParameters: {},
            path: req.url
        };

        // Use tsx to run TypeScript
        const { handler } = await import(funcPath);
        const result = await handler(event, {});

        res.writeHead(result.statusCode || 200, {
            'Content-Type': 'application/json',
            ...result.headers
        });
        res.end(result.body || '');
    } catch (err) {
        console.error(`Function ${funcName} error:`, err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: err.message }));
    }
});

server.listen(PORT, () => {
    console.log(`⚡ Functions server running on http://localhost:${PORT}`);
});
