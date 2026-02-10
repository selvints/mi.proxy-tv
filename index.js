const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.get('/stream/:canalId', async (req, res) => {
    const { canalId } = req.params;
    const IPTV_BASE = 'http://vipketseyket.top:8080/live/VIP013911761680146102/77b83cecc0c6';
    const targetUrl = ${IPTV_BASE}/${canalId};

    try {
        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '/',
                'Connection': 'keep-alive'
            },
            // IMPORTANTE: Sin timeout para streams en vivo
            timeout: 0 
        });

        // CABECERAS PARA STREAMING VIVO
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'video/mp2t');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Connection', 'keep-alive');
        // Esto le dice al navegador que no sabe qué tan grande es el archivo (porque es infinito)
        res.setHeader('Transfer-Encoding', 'chunked'); 

        // Pipe con manejo de errores
        response.data.pipe(res);

        response.data.on('error', (err) => {
            console.error('Error en el stream de origen:', err.message);
            res.end();
        });

        req.on('close', () => {
            console.log('Cliente desconectado, cerrando stream.');
            response.data.destroy();
        });

    } catch (error) {
        console.error('Error de conexión:', error.message);
        if (!res.headersSent) {
            res.status(500).setHeader('Access-Control-Allow-Origin', '*').send('Error en el stream');
        }
    }
});

app.listen(port, () => console.log(Proxy IPTV en puerto ${port}));
