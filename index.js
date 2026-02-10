const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', '*');
    next();
});

// Usamos '*' para capturar TODA la ruta después de /live/
app.get('/live/*', async (req, res) => {
    // Esto captura todo lo que venga después de /live/, ej: "VIP01/77b/5201.ts"
    const path = req.params[0]; 
    const IPTV_BASE = 'http://vipketseyket.top:8080/live/VIP013911761680146102/77b83cecc0c6/';
    const targetUrl = IPTV_BASE + path;

    try {
        console.log(Proxying: ${targetUrl});

        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Connection': 'keep-alive'
            },
            timeout: 0
        });

        // Detectar tipo de contenido
        if (path.endsWith('.m3u8')) {
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        } else {
            res.setHeader('Content-Type', 'video/mp2t');
        }

        res.setHeader('Cache-Control', 'no-cache');
        response.data.pipe(res);

        req.on('close', () => {
            if (response.data) response.data.destroy();
        });

    } catch (error) {
        console.error('Error en Proxy:', error.message);
        if (!res.headersSent) {
            res.status(500).send('Error cargando el segmento');
        }
    }
});

app.listen(port, () => console.log(`Proxy corriendo en puerto ${port}`));
