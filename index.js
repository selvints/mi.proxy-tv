const express = require('express');
const axios = require('axios');
const app = express();

app.get('/stream/:canalId', async (req, res) => {
    const { canalId } = req.params;
    
    // Construimos la URL usando tus credenciales directamente
    const username = 'VIP013911761680146102';
    const password = '77b83cecc0c6';
    const host = 'http://vipketseyket.top:8080';
    
    // La URL para Xtream Codes suele ser: host/live/user/pass/id.m3u8
    const targetUrl = `${host}/live/${username}/${password}/${canalId}`;

    try {
        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'text',
            headers: {
                'User-Agent': 'IPTVSmarters/1.0', // Engañamos al servidor simulando una App de IPTV
                'Accept': '*/*'
            }
        });

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');

        // REESCRITURA CRÍTICA:
        // El servidor te da rutas como /hlsr/... 
        // Tenemos que convertirlas en http://vipketseyket.top:8080/hlsr/...
        const originalData = response.data;
        const fixedData = originalData.replace(/\n\/hlsr\//g, `\n${host}/hlsr/`);

        res.send(fixedData);

    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send('Error en el Proxy');
    }
});

app.listen(process.env.PORT || 3000);
