const express = require('express');
const { http: httpFollow, https: httpsFollow } = require('follow-redirects');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/proxy', (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('Falta URL');

    // Desactivar límites de tiempo
    req.setTimeout(0);
    res.setTimeout(0);

    const client = targetUrl.startsWith('https') ? httpsFollow : httpFollow;

    const proxyReq = client.get(targetUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VLC/3.0.18',
            'Accept': '*/*',
            'Range': 'bytes=0-', // Le dice al servidor que queremos todo el flujo
            'Icy-MetaData': '1',
            'Connection': 'keep-alive'
        }
    }, (proxyRes) => {
        // Configuramos la respuesta para el navegador
        res.writeHead(proxyRes.statusCode, {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'video/mp2t',
            'Transfer-Encoding': 'chunked',
            'Connection': 'keep-alive',
            'Cache-Control': 'no-cache'
        });

        // Forzamos el flujo constante
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (e) => {
        console.error("Error:", e.message);
        res.end();
    });

    req.on('close', () => {
        proxyReq.destroy();
    });
});

app.listen(process.env.PORT || 3000);
