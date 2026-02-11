const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());

app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('No URL provided');

    try {
        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (QtEmbedded; Linux; arm) AppleWebKit/538.1 (KHTML, like Gecko) Mag244/3.0.0 Safari/538.1',
                'Referer': 'http://tv.diablotv.net:8080/',
                'Accept': '*/*',
                'Connection': 'keep-alive'
            },
            timeout: 10000
        });

        // Copiamos los headers del stream original al navegador
        res.set(response.headers);
        res.set('Access-Control-Allow-Origin', '*');
        
        response.data.pipe(res);
    } catch (error) {
        console.error('Error en el proxy:', error.message);
        res.status(error.response ? error.response.status : 500).send(error.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy activo en puerto ${PORT}`));
