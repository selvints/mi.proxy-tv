const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();

app.use(cors()); // Esto permite que bsite.net pueda pedir datos aquí

app.get("/proxy", async (req, res) => {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).send("Falta la URL");

    try {
        const response = await axios({
            method: 'get',
            url: targetUrl,
            responseType: 'stream',
            headers: {
                // Esto engaña al servidor del canal para que crea que eres un usuario real
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36'
            }
        });

        res.setHeader("Content-Type", response.headers["content-type"] || "application/vnd.apple.mpegurl");
        response.data.pipe(res);
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(Servidor listo en puerto ${PORT}));