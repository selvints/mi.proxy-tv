const express = require('express');
const axios = require('axios');
const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    next();
});

// 1. MANIFIESTO (.m3u8)
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

        // Forzamos que el proxy use HTTPS para evitar el error de Mixed Content
        const protocol = req.headers['x-forwarded-proto'] || 'https';
        const proxyUrl = `${protocol}://${req.get('host')}/ts?url=`;
        
        // Reemplazo exacto: buscamos líneas que NO empiecen con # y contengan /hlsr/
        const lines = response.data.split('\n');
        const fixedLines = lines.map(line => {
            if (line.startsWith('/hlsr/')) {
                return `${proxyUrl}${encodeURIComponent(host + line)}`;
            }
            return line;
        });

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        res.send(fixedLines.join('\n'));
    } catch (e) {
        console.error(e.message);
        res.status(500).send("Error de conexión con el IPTV");
    }
});

// 2. TÚNEL DE SEGMENTOS (.ts)
app.get('/ts', async (req, res) => {
    const videoUrl = req.query.url;
    if (!videoUrl) return res.status(400).send('No URL');

    try {
        const response = await axios({
            method: 'get',
            url: decodeURIComponent(videoUrl),
            responseType: 'stream',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        res.setHeader('Content-Type', 'video/mp2t');
        response.data.pipe(res);
    } catch (e) {
        res.status(500).send(e.message);
    }
});

app.listen(process.env.PORT || 3000);
