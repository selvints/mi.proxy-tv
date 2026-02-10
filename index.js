const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Ruta para procesar el M3U8 y los fragmentos TS
app.get('/stream/:user/:pass/:canal*', async (req, res) => {
    const { user, pass } = req.params;
    // Captura el canal y cualquier sub-ruta (como /hlsr/...)
    const fullPath = req.params.canal + req.params[0];
    
    const IPTV_HOST = 'http://192.142.5.76:8080';
    
    // Construimos la URL de destino
    let targetUrl;
    if (fullPath.startsWith('hlsr/')) {
        targetUrl = `${IPTV_HOST}/${fullPath}`;
    } else {
        targetUrl = `${IPTV_HOST}/live/${user}/${pass}/${fullPath}`;
    }

    try {
        const isM3U8 = fullPath.endsWith('.m3u8');

        const response = await axios({
            method: 'get',
            url: targetUrl,
            headers: { 'User-Agent': 'Mozilla/5.0' },
            responseType: isM3U8 ? 'text' : 'stream',
            timeout: 10000
        });

        if (isM3U8) {
            // REESCRITURA: Convertimos las rutas relativas /hlsr/ en rutas que pasen por tu proxy
            // Esto evita el error de Mixed Content y permite que el video cargue uno tras otro
            const proxyBase = ${req.protocol}://${req.get('host')}/stream/${user}/${pass}/hlsr/;
            const correctedContent = response.data.replace(/\/hlsr\//g, proxyBase);
            
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            return res.send(correctedContent);
        }

        // Si es un .ts (binario), lo enviamos como flujo
        res.setHeader('Content-Type', 'video/mp2t');
        response.data.pipe(res);

    } catch (error) {
        console.error('Error:', error.message);
        if (!res.headersSent) res.status(500).send('Error de conexión');
    }
});

app.listen(port, () => console.log('Proxy dinámico corriendo'));

