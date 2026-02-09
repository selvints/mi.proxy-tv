const express = require('express');
const axios = require('axios');
const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    next();
});

// 1. RUTA PARA EL MANIFIESTO (.m3u8)
app.get('/stream/:canalId', async (req, res) => {
    const { canalId } = req.params;
    const host = 'http://vipketseyket.top:8080';
    const user = 'VIP013911761680146102';
    const pass = '77b83cecc0c6';
    
    try {
        const response = await axios.get(`${host}/live/${user}/${pass}/${canalId}.m3u8`, {
            responseType: 'text',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });

        // REESCRITURA: En lugar de apuntar al IPTV, apuntamos a NUESTRO PROXY para los .ts
        // Convertimos /hlsr/... en https://tu-render.com/ts?url=http://iptv/hlsr/...
        const proxyUrl = `${req.protocol}://${req.get('host')}/ts?url=`;
        const fixedData = response.data.replace(/^(\/hlsr\/)/gm, `${proxyUrl}${host}$1`);

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.send(fixedData);
    } catch (e) { res.status(500).send(e.message); }
});

// 2. NUEVA RUTA PARA LOS SEGMENTOS (.ts)
// Esta ruta descarga el video del IPTV y lo pasa al navegador
app.get('/ts', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).send('No URL');

    try {
        const response = await axios({
            method: 'get',
            url: videoUrl,
            responseType: 'stream',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        res.setHeader('Content-Type', 'video/mp2t');
        response.data.pipe(res);
    } catch (e) { res.status(500).send(e.message); }
});

app.listen(process.env.PORT || 3000);
