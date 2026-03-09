const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL faltante');

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'video/mp2t');
    // Forzamos a que la conexión se mantenga abierta en el navegador
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
        const streamResponse = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream',
            timeout: 0, 
            headers: {
                'User-Agent': 'VLC/3.0.18',
                'Connection': 'keep-alive'
            }
        });

        streamResponse.data.pipe(res);

        req.on('close', () => {
            streamResponse.data.destroy();
        });

    } catch (error) {
        console.error("Error en el stream:", error.message);
        if (!res.headersSent) {
            res.status(500).send("Error de conexión");
        }
    }
});

// --- ESTA ES LA PARTE QUE DEBES CAMBIAR ---
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Servidor de streaming activo en puerto ${PORT}`);
});

// Configuraciones críticas para evitar el cierre a los 30s / 3min
server.keepAliveTimeout = 0; 
server.headersTimeout = 0;
server.requestTimeout = 0; // Añadimos esta para mayor seguridad en streams largos


