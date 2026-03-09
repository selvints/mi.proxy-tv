const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL faltante');

    try {
        const streamResponse = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream',
            timeout: 20000, // 20 segundos para conectar
            headers: {
                // Engañamos al servidor para que crea que somos un deco o VLC
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 
                'Accept': '*/*',
                'Connection': 'keep-alive'
            }
        });

        // IMPORTANTE: MPEG-TS usa este tipo de contenido
        res.setHeader('Content-Type', 'video/mp2t');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        // Pipe directo de los datos
        streamResponse.data.pipe(res);

        // Si el cliente (navegador) cierra la pestaña, matamos la conexión al origen
        req.on('close', () => {
            streamResponse.data.destroy();
        });

    } catch (error) {
        console.error("Error en el stream:", error.message);
        // Si el origen da 404, tu proxy también responderá 404
        const statusCode = error.response ? error.response.status : 500;
        if (!res.headersSent) {
            res.status(statusCode).send("Error de origen: " + statusCode);
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
