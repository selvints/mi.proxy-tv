const express = require('express');
const request = require('request'); // Necesitarás hacer: npm install request
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/proxy', (req, res) => {
    const targetUrl = req.query.url;
    
    // Configuramos headers de un receptor satelital real
    const options = {
        url: targetUrl,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) VLC/3.0.18',
            'Connection': 'keep-alive',
            'Accept-Encoding': 'identity', // Evita que se comprima, fluye crudo
            'Icy-MetaData': '1'
        },
        timeout: 0 // Sin límite de tiempo
    };

    // La librería 'request' maneja el streaming mejor para evitar el corte de los 28 seg
    request(options)
        .on('error', (err) => res.status(500).end())
        .on('response', (response) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'video/mp2t');
        })
        .pipe(res); // Túnel directo sin procesar bits
});

app.listen(process.env.PORT || 3000);
