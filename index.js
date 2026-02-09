const express = require('express');
const axios = require('axios');
const app = express();

// Middleware para CORS (Esto evita el error de 'No Access-Control-Allow-Origin')
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.get('/stream/:canalId', async (req, res) => {
    const { canalId } = req.params;
    const host = 'http://vipketseyket.top:8080';
    const username = 'VIP013911761680146102';
    const password = '77b83cecc0c6';
    
    // IMPORTANTE: Algunos servidores requieren .m3u8 al final, otros no. 
    // Vamos a probar construyendo la URL exacta de Xtream Codes
    const targetUrl = `${host}/live/${username}/${password}/${canalId}.m3u8`;

    try {
        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'text',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*'
            },
            timeout: 10000 
        });

        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');

        // REEMPLAZO MEJORADO: 
        // Buscamos líneas que empiecen con /hlsr y les ponemos el HOST_BASE
        const fixedData = response.data.replace(/^(\/hlsr\/)/gm, `${host}$1`);
        
        console.log(`Canal ${canalId} procesado con éxito`);
        res.send(fixedData);

    } catch (error) {
        console.error('Error en el proxy:', error.message);
        // Enviamos un 200 con un mensaje de error m3u para que el reproductor no se rompa
        res.status(500).send('#EXTM3U\n#ERROR: ' + error.message);
    }
});

app.listen(process.env.PORT || 3000);
