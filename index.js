const https = require('https');
const http = require('http');

app.get('/proxy', (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL faltante');

    const client = targetUrl.startsWith('https') ? https : http;

    // Configuración de cabeceras para flujo continuo
    res.setHeader('Content-Type', 'video/mp2t');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Connection', 'keep-alive');

    const request = client.get(targetUrl, {
        headers: { 'User-Agent': 'VLC/3.0.18' }
    }, (stream) => {
        // Pasamos el flujo directamente al navegador
        stream.pipe(res);
    });

    request.on('error', (e) => {
        console.error(e);
        if (!res.headersSent) res.status(500).end();
    });

    req.on('close', () => {
        request.destroy();
    });
});
