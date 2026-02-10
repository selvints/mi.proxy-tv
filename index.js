const express = require('express');
const axios = require('axios');
const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Usamos una ruta más flexible
app.get('/stream/:user/:pass/:canal*', async (req, res) => {
    try {
        const { user, pass } = req.params;
        // Reconstruimos el canal completo (incluyendo sub-rutas si las hay)
        const subPath = req.params.canal + (req.params[0] || '');
        
        const IPTV_HOST = 'http://192.142.5.76:8080';
        let targetUrl;

        // Si la petición es un fragmento de video relativo que ya capturamos
        if (subPath.includes('hlsr/')) {
            targetUrl = `${IPTV_HOST}/${subPath}`;
        } else {
            targetUrl = `${IPTV_HOST}/live/${user}/${pass}/${subPath}`;
        }

        console.log('Proxying a:', targetUrl);

        const response = await axios({
            method: 'get',
            url: targetUrl,
            headers: { 'User-Agent': 'Mozilla/5.0' },
            responseType: (subPath.endsWith('.m3u8')) ? 'text' : 'stream',
            timeout: 10000
        });

        if (subPath.endsWith('.m3u8')) {
            // Reemplazamos las rutas para que pasen de nuevo por Render
            const host = req.get('host');
            const protocol = req.protocol;
            const proxyBase = `${protocol}://${host}/stream/${user}/${pass}/hlsr/`;
            
            const modifiedM3U8 = response.data.replace(/\/hlsr\//g, proxyBase);
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            return res.send(modifiedM3U8);
        }

        res.setHeader('Content-Type', 'video/mp2t');
        response.data.pipe(res);

    } catch (error) {
        console.error('Error detallado:', error.message);
        if (!res.headersSent) {
            res.status(500).send('Error en el Proxy: ' + error.message);
        }
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Proxy Online'));
