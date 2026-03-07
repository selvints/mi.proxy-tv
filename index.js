app.get('/proxy', async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send('URL faltante');

    // Forzamos al navegador a tratarlo como FLV
    res.setHeader('Content-Type', 'video/x-flv');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Transfer-Encoding', 'chunked'); // Indica que el tamaño es desconocido (infinito)

    try {
        const streamResponse = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream',
            timeout: 0,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
                'Connection': 'keep-alive',
                'Accept': '/'
            }
        });

        // Tubería directa de datos
        streamResponse.data.pipe(res);

        req.on('close', () => {
            streamResponse.data.destroy();
        });

    } catch (error) {
        if (!res.headersSent) res.status(500).end();
    }
});
