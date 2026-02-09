const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.get('/stream/:canalId', async (req, res) => {
    const { canalId } = req.params;
    // Dominio base del proveedor
    const HOST_BASE = 'http://vipketseyket.top:8080';
    const IPTV_BASE = `${HOST_BASE}/live/VIP013911761680146102/77b83cecc0c6`;
    const targetUrl = `${IPTV_BASE}/${canalId}`;

    try {
        const response = await axios({
            method: 'get',
            url: targetUrl,
            // Quitamos stream para poder manipular el texto si es m3u8
            responseType: 'text', 
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            timeout: 15000 
        });

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');

        // LA MAGIA: Reemplazamos las rutas relativas por absolutas
        // Buscamos cualquier línea que empiece con /hlsr y le ponemos el dominio antes
        let m3u8Content = response.data;
        const correctedContent = m3u8Content.replace(/\n\/hlsr/g, `\n${HOST_BASE}/hlsr`);

        res.send(correctedContent);

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).setHeader('Access-Control-Allow-Origin', '*').send('Error en el stream');
    }
});

app.listen(port, () => console.log(`Proxy corregido corriendo en puerto ${port}`));
