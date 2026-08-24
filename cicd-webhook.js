const http = require('http');
const { exec } = require('child_process');
const path = require('path');

const PORT = 3001;
// Ini adalah secret key agar tidak ada orang iseng yang menembak endpoint ini.
// Pasang secret yang sama persis di GitHub Secrets repositori Anda.
const SECRET_TOKEN = process.env.DEPLOY_SECRET || "dinar-cicd-secret-123";

const server = http.createServer((req, res) => {
    // Hanya menerima HTTP POST
    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        return res.end('Method Not Allowed');
    }

    // Cek Secret Token dari header 'x-deploy-token'
    const authHeader = req.headers['x-deploy-token'];
    if (authHeader !== SECRET_TOKEN) {
        console.warn(`[${new Date().toISOString()}] Unauthorized deploy attempt.`);
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        return res.end('Unauthorized');
    }

    // Routing berdasarkan URL yang dipanggil GitHub Actions
    if (req.url === '/deploy/frontend') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Deployment Frontend Triggered');
        
        console.log(`[${new Date().toISOString()}] Triggering Frontend Deploy...`);
        const scriptPath = path.join(__dirname, 'deploy-fe.sh');
        
        exec(`bash ${scriptPath}`, (error, stdout, stderr) => {
            console.log('[FRONTEND LOG]\n', stdout);
            if (error) console.error('[FRONTEND ERROR]\n', stderr);
        });

    } else if (req.url === '/deploy/backend') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Deployment Backend Triggered');
        
        console.log(`[${new Date().toISOString()}] Triggering Backend Deploy...`);
        const scriptPath = path.join(__dirname, 'deploy-be.sh');

        exec(`bash ${scriptPath}`, (error, stdout, stderr) => {
            console.log('[BACKEND LOG]\n', stdout);
            if (error) console.error('[BACKEND ERROR]\n', stderr);
        });

    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`CI/CD Webhook Listener running on port ${PORT}`);
    console.log(`Waiting for GitHub Actions triggers...`);
    console.log(`========================================`);
});
