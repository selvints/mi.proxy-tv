const express = require('express');
const http = require('http');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/proxy', (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('No URL provided');

    console.log("Streaming iniciado para:", targetUrl);

    const options = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VLC/3.0.18',
            'Connection': 'keep-alive',
            'Icy-MetaData': '1' // Importante para servidores IPTV
        }
    };

    // Usamos el módulo http nativo para un streaming más puro
    http.get(targetUrl, options, (proxyRes) => {
        // Pasamos los headers originales pero forzamos el Content-Type
        res.writeHead(proxyRes.statusCode, {
            ...proxyRes.headers,
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'video/mp2t', // Forzamos formato de transporte de video
            'Connection': 'keep-alive',
            'Transfer-Encoding': 'chunked' // Le decimos al navegador que no tiene fin
        });

        // Canalizamos el flujo de datos directamente al navegador
        proxyRes.pipe(res);

        proxyRes.on('error', (err) => {
            console.error('Error en el stream de origen:', err);
            res.end();
        });

    }).on('error', (err) => {
        console.error('Error en el proxy:', err);
        res.status(500).send(err.message);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy de streaming activo en puerto ${PORT}`));
