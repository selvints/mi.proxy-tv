// 1. Importación de librerías
const express = require('express');
const axios = require('axios');
const cors = require('cors');

// 2. Inicialización de la aplicación (ESTO ES LO QUE FALTABA)
const app = express();

// 3. Configuración de Middlewares
app.use(cors());

// 4. Lista de User-Agents para evitar bloqueos
const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
    'vlc/3.0.18 LibVLC/3.0.18',
    'Mozilla/5.0 (SmartHub; SMART-TV; U; Linux/SmartTV) AppleWebKit/538.1 Safari/538.1'
];

// 5. Definición de la ruta del Proxy
app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL faltante');

    const randomAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    // Cabeceras para flujo FLV continuo
    res.setHeader('Content-Type', 'video/x-flv');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Transfer-Encoding', 'chunked');

    try {
        const streamResponse = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream',
            timeout: 0, 
            headers: {
                'User-Agent': randomAgent,
                'Connection': 'keep-alive',
                'Accept': '/'
            }
        });

        streamResponse.data.pipe(res);

        req.on('close', () => {
            streamResponse.data.destroy();
        });

    } catch (error) {
        console.error("Error en el stream:", error.message);
        if (!res.headersSent) {
            res.status(500).end();
        }
    }
});

// 6. Inicio del servidor y configuraciones de red
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Servidor de streaming activo en puerto ${PORT}`);
});

// Evitar cierres prematuros por inactividad
server.keepAliveTimeout = 0;
server.headersTimeout = 0;
server.requestTimeout = 0;

