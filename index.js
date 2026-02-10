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
        const subPath = req.params.canal + (req.params[0] || '');
        
        // Usamos el dominio que aparece en tu cuenta
        const IPTV_DOMAIN = 'http://vipketseyket.top:8080';
        let targetUrl;

        if (subPath.includes('hlsr/')) {
            // Si es un fragmento, usamos la IP que descubrimos antes si el dominio falla
            targetUrl = `http://192.142.5.76:8080/${subPath}`;
        } else {
            targetUrl = `${IPTV_DOMAIN}/live/${user}/${pass}/${subPath}`;
        }

        console.log('Solicitando canal a:', targetUrl);

        const response = await axios({
            method: 'get',
            url: targetUrl,
            headers: { 
                // Engañamos al servidor haciéndole creer que somos un deco MAG250
                'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3 (KHTML, like Gecko) MAG250/2.1.0 Safari/533.3',
                'Accept': '/',
                'Host': 'vipketseyket.top:8080',
                'Connection': 'Keep-Alive'
            },
            responseType: (subPath.endsWith('.m3u8')) ? 'text' : 'stream',
            timeout: 15000
        });

        if (subPath.endsWith('.m3u8')) {
            const host = req.get('host');
            const protocol = req.protocol;
            const baseType = req.path.startsWith('/live') ? 'live' : 'stream';
            
            // Esta parte es vital: reescribimos para que el siguiente paso también pase por el proxy
            const proxyBase = `${protocol}://${host}/${baseType}/${user}/${pass}/hlsr/`;
            const modifiedM3U8 = response.data.replace(/\/hlsr\//g, proxyBase);
            
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            return res.send(modifiedM3U8);
        }

        res.setHeader('Content-Type', 'video/mp2t');
        response.data.pipe(res);

    } catch (error) {
        // Si hay error, mostramos en el log de Render qué respondió el IPTV exactamente
        if (error.response) {
            console.error('IPTV respondió con error:', error.response.status);
            console.error('Cabeceras de respuesta:', error.response.headers);
        }
        if (!res.headersSent) {
            const status = error.response ? error.response.status : 500;
            res.status(status).send('Status: ' + status);
        }
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Proxy Mag250 camuflado listo'));
