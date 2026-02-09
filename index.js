const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.get('/stream/:canalId', async (req, res) => {
    const { canalId } = req.params;
    
    // 1. Definimos la base del servidor original
    const HOST_BASE = 'http://vipketseyket.top:8080';
    const IPTV_BASE = `${HOST_BASE}/live/VIP013911761680146102/77b83cecc0c6`;
    const targetUrl = `${IPTV_BASE}/${canalId}`;

    try {
        console.log(`Procesando y corrigiendo canal: ${canalId}`);

        const response = await axios({
            method: 'get',
            url: targetUrl,
            // IMPORTANTE: Usamos 'text' para poder editar el contenido
            responseType: 'text', 
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            },
            timeout: 15000 
        });

        // 2. Configuramos cabeceras para el navegador
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');

        // 3. LA CORRECCIÓN:
        // Buscamos todas las rutas que empiezan con /hlsr/ y les pegamos el dominio real delante
        const contenidoOriginal = response.data;
        const contenidoCorregido = contenidoOriginal.replace(/\/hlsr\//g, `${HOST_BASE}/hlsr/`);

        // 4. Enviamos el archivo ya corregido al reproductor
        res.send(contenidoCorregido);

    } catch (error) {
        console.error('Error en el Proxy:', error.message);
        res.status(500).setHeader('Access-Control-Allow-Origin', '*').send('Error al obtener el manifiesto');
    }
});

app.listen(port, () => console.log(`Render Proxy activo en puerto ${port}`));
