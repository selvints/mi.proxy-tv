const express = require('express');
const axios = require('axios');
const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

app.get(['/live/:user/:pass/:canal*', '/stream/:user/:pass/:canal*'], async (req, res) => {
    try {
        const { user, pass } = req.params;
        // Capturamos todo lo que viene después del canal
        const extraPath = req.params[0] || '';
        const canalFull = req.params.canal + extraPath;
        
        const IPTV_HOST = 'http://192.142.5.76:8080';
        let targetUrl;

        // LÓGICA DE ENRUTAMIENTO CORREGIDA
        if (canalFull.includes('hlsr/')) {
            // Si la ruta ya incluye hlsr/, le pedimos directamente al host
            // Ejemplo: http://192.142.5.76:8080/hlsr/ABC...
            targetUrl = `${IPTV_HOST}/${canalFull}`;
        } else {
            // Si es la petición inicial del m3u8
            targetUrl = `${IPTV_HOST}/live/${user}/${pass}/${canalFull}`;
        }

        console.log('Realizando petición a IPTV:', targetUrl);

        const response = await axios({
            method: 'get',
            url: targetUrl,
            headers: { 
                'User-Agent': 'IPTVSmartersPlayer', // Camuflaje de App
                'Host': 'vipketseyket.top:8080'
            },
            responseType: (canalFull.endsWith('.m3u8')) ? 'text' : 'stream',
            timeout: 15000
        });

        if (canalFull.endsWith('.m3u8')) {
            const host = req.get('host');
            const protocol = req.protocol; // Detecta si es http o https
            const baseType = req.path.startsWith('/live') ? 'live' : 'stream';
            
            // Construimos la base del proxy para los segmentos .ts
            // Resultado: https://sp-smd7.onrender.com/stream/USER/PASS/
            const proxyBase = `${protocol}://${host}/${baseType}/${user}/${pass}/`;
            
            // REESCRITURA: Reemplazamos "/hlsr/" por "URL_PROXY/hlsr/"
            const modifiedM3U8 = response.data.replace(/\/hlsr\//g, proxyBase + 'hlsr/');
            
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            return res.send(modifiedM3U8);
        }

        // Si es un .ts, lo enviamos como flujo de video
        res.setHeader('Content-Type', 'video/mp2t');
        response.data.pipe(res);

    } catch (error) {
        const status = error.response ? error.response.status : 500;
        console.error('Error en Proxy:', status, error.message);
        if (!res.headersSent) {
            res.status(status).send('Error: ' + status);
        }
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Proxy Final con Reescritura Activo'));
