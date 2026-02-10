const express = require('express');
const axios = require('axios');
const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// Esta ruta acepta CUALQUIER COSA que empiece con /live/ o /stream/
app.get(['/live/:user/:pass/:canal*', '/stream/:user/:pass/:canal*'], async (req, res) => {
    try {
        const { user, pass } = req.params;
        const subPath = req.params.canal + (req.params[0] || '');
        
        // El servidor real de tu IPTV
        const IPTV_HOST = 'http://192.142.5.76:8080';
        let targetUrl;

        if (subPath.includes('hlsr/')) {
            targetUrl = `${IPTV_HOST}/${subPath}`;
        } else {
            targetUrl = `${IPTV_HOST}/live/${user}/${pass}/${subPath}`;
        }

        console.log('Redirigiendo a IPTV:', targetUrl);

        const response = await axios({
            method: 'get',
            url: targetUrl,
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '/',
                'Connection': 'keep-alive'
            },
            // Si es m3u8 pedimos texto para editarlo, si no, flujo binario
            responseType: (subPath.endsWith('.m3u8')) ? 'text' : 'stream',
            timeout: 15000
        });

        if (subPath.endsWith('.m3u8')) {
            const host = req.get('host');
            const protocol = req.protocol;
            // Detectamos si la petición original entró por /live o /stream para mantener la coherencia
            const baseType = req.path.startsWith('/live') ? 'live' : 'stream';
            const proxyBase = `${protocol}://${host}/${baseType}/${user}/${pass}/hlsr/`;
            
            // Corregimos las rutas relativas del m3u8
            const modifiedM3U8 = response.data.replace(/\/hlsr\//g, proxyBase);
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            return res.send(modifiedM3U8);
        }

        // Para los fragmentos .ts
        res.setHeader('Content-Type', 'video/mp2t');
        response.data.pipe(res);

    } catch (error) {
        console.error('Error en Proxy:', error.message);
        if (!res.headersSent) {
            // Si el error es 401, lo enviamos tal cual para saber que las claves fallan
            const status = error.response ? error.response.status : 500;
            res.status(status).send('IPTV Error: ' + status);
        }
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Servidor Proxy Multiruta Listo'));
