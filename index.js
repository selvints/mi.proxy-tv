const express = require('express');
const { http: httpFollow, https: httpsFollow } = require('follow-redirects');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/proxy', (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL faltante');

    // 1. ELIMINAR TIMEOUTS: Evita que Render corte a los 60-90 segundos
    req.setTimeout(0);
    res.setTimeout(0);

    const client = targetUrl.startsWith('https') ? httpsFollow : httpFollow;

    const proxyReq = client.get(targetUrl, {
        headers: {
            'User-Agent': 'VLC/3.0.18', // Identidad de reproductor de video profesional
            'Accept': '*/*',
            'Connection': 'keep-alive'
        }
    }, (proxyRes) => {
        // 2. HEADERS DE FLUJO CONTINUO
        res.writeHead(proxyRes.statusCode, {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'video/mp2t',
            'Connection': 'keep-alive',
            'Transfer-Encoding': 'chunked',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        // 3. PASO DE DATOS SIN BUFFER: Esto evita que el proxy se sature y corte
        proxyRes.on('data', (chunk) => {
            res.write(chunk);
        });

        proxyRes.on('end', () => {
            res.end();
        });
    });

    proxyReq.on('error', (err) => {
        console.error("Error en el stream:", err.message);
        res.status(500).end();
    });

    // Si el usuario cierra la pestaña, cerramos la conexión para no gastar recursos
    req.on('close', () => {
        proxyReq.destroy();
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Streaming infinito en puerto ${PORT}`));
