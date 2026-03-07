const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL faltante');

    // Headers para engañar al servidor y evitar el Mixed Content
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'video/mp2t');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Transfer-Encoding', 'chunked');
    try {
        const streamResponse = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream',
            timeout: 0, 
            headers: {
                'User-Agent': 'VLC/3.0.18', // Se identifica como reproductor, no como web
                'Connection': 'keep-alive',
                'Accept': '*/*'
            }
        });

        // Pasamos los datos bit a bit (Streaming puro)
        streamResponse.data.pipe(res);

        // Si cierras la pestaña, el proxy corta la conexión al servidor de TV
        req.on('close', () => {
            streamResponse.data.destroy();
        });

    } catch (error) {
        console.error("Error en el stream:", error.message);
        if (!res.headersSent) {
            res.status(500).send("Error de conexión con DiabloTV");
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
server.keepAliveTimeout = 0;
server.headersTimeout = 0;
server.resquestTimeout = 0;


