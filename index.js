const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    next();
});

app.get('/live/:canalId', async (req, res) => {
    const { canalId } = req.params;
    // URL base sin el archivo final
    const IPTV_URL = `http://vipketseyket.top:8080/live/VIP013911761680146102/77b83cecc0c6/${canalId}`;

    try {
        const response = await axios({
            method: 'get',
            url: IPTV_URL,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Connection': 'keep-alive'
            },
            timeout: 0
        });

        // Si es un archivo de lista (.m3u8)
        if (canalId.includes('.m3u8')) {
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
        } else {
            // Si es un fragmento (.ts)
            res.setHeader('Content-Type', 'video/mp2t');
        }

        res.setHeader('Cache-Control', 'no-cache');
        response.data.pipe(res);

        req.on('close', () => response.data.destroy());

    } catch (error) {
        console.error('Error:', error.message);
        if (!res.headersSent) res.status(500).send('Error');
    }
});

app.listen(port, () => console.log(`Proxy corriendo en puerto ${port}`));


