const express = require('express');
const http = require('http');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/proxy', (req, res) => {
    // Usamos req.query.url para capturar la URL completa de DiabloTV
    const targetUrl = req.query.url;
    
    if (!targetUrl) return res.status(400).send('URL faltante');

    console.log("Conectando a stream...");

    const options = {
        method: 'GET',
        headers: {
            // Engañamos al servidor para que piense que somos un decodificador IPTV
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VLC/3.0.18',
            'Accept': '*/*',
            'Connection': 'keep-alive',
        }
    };

    const proxyRequest = http.get(targetUrl, options, (proxyResponse) => {
        // Copiamos los headers de DiabloTV pero inyectamos CORS
        const headers = { ...proxyResponse.headers };
        headers['Access-Control-Allow-Origin'] = '*';
        headers['Cache-Control'] = 'no-cache';
        headers['Connection'] = 'keep-alive';

        res.writeHead(proxyResponse.statusCode, headers);

        // Canalizamos los datos sin procesarlos (Streaming puro)
        proxyResponse.pipe(res);
    });

    proxyRequest.on('error', (e) => {
        console.error("Error en Proxy:", e.message);
        res.status(500).end();
    });

    // Si el usuario cierra el reproductor, cerramos la conexión al servidor de TV
    req.on('close', () => {
        proxyRequest.destroy();
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor en puerto ${PORT}`));
