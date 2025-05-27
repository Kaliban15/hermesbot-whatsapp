// pai.js
"use strict";

const express = require("express");
const cors = require("cors");
const epWhatsappRouter = require("./ep_whatsapp");

const app = express();

app.use(cors());
app.use(express.json());

// Rota do WhatsApp
app.use("/", epWhatsappRouter);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});