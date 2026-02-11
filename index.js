const express = require('express');
const http = require('http'); // Para el destino http://
const https = require('https'); // Para tu servidor https://
const cors = require('cors');
const { http: httpFollow, https: httpsFollow } = require('follow-redirects');

const app = express();
app.use(cors());

app.get('/proxy', (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL requerida');

    console.log("Siguiendo redirección de:", targetUrl);

    // Configuramos la petición para seguir redirecciones automáticamente
    const client = targetUrl.startsWith('https') ? httpsFollow : httpFollow;

    const proxyReq = client.get(targetUrl, {
        headers: {
            'User-Agent': 'VLC/3.0.18',
            'Connection': 'keep-alive'
        }
    }, (proxyRes) => {
        // Forzamos headers de streaming y seguridad
        res.writeHead(proxyRes.statusCode, {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'video/mp2t',
            'Connection': 'keep-alive',
            'Transfer-Encoding': 'chunked'
        });

        // Canalizamos el video directamente
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error("Error:", err.message);
        res.status(500).send(err.message);
    });

    req.on('close', () => proxyReq.destroy());
});

app.listen(process.env.PORT || 3000);
