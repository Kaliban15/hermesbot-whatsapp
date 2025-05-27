// ep_whatsapp.js
"use strict";
const express = require("express");
const router = express.Router();
const venom = require("venom-bot");

let client = null;

venom
  .create({
    session: "hermes_whatsapp",
    browserArgs: ['--no-sandbox', '--disable-setuid-sandbox', '--headless=new']
  })
  .then((venomClient) => {
    client = venomClient;
    console.log("✅ WhatsApp conectado.");
  })
  .catch((err) => {
    console.error("Erro ao iniciar Venom:", err);
  });

router.post("/send_whatsapp", async (req, res) => {
  const { numbers, message } = req.body;

  if (!numbers || !Array.isArray(numbers) || numbers.length === 0 || !message) {
    return res.status(400).json({ error: "Envie 'numbers' (array de números com DDD) e 'message'." });
  }

  if (!client) {
    return res.status(503).json({ error: "Cliente WhatsApp ainda não iniciado." });
  }

  const results = [];

  for (const num of numbers) {
    const phone = num.replace(/\D/g, "") + "@c.us";
    try {
      await client.sendText(phone, message);
      results.push({ number: num, status: "enviado" });
    } catch (err) {
      results.push({ number: num, status: "erro", error: err.message });
    }
  }

  res.json({ results });
});

module.exports = router;
