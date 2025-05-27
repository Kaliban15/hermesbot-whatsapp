//pai.js

"use strict";
const express = require("express");
const bodyParser = require("body-parser");
const { exec } = require("child_process");
const path = require("path");
const pool = require("./ex_mysql"); // Importa o pool de conexões MySQL
const logger = require("./logger"); // Importa o módulo de logging

// Importa os routers do s_gpt.js, ep_onoff.js, add_allgpt.js, ep_erase_notifica_msg.js, add_notifications.js, add_subscriptions.js, ep_config.js, ep_reclama.js, ep_conversas_rec.js, ep_notifica.js, ep_upload.js e ep_anuncios.js
const sGptRouter = require("./s_gpt");
const epOnOffRouter = require("./ep_onoff");
const addAllGptRouter = require("./add_allgpt");
const epEraseNotificaMsgRouter = require("./ep_erase_notifica_msg");
const addNotificationsRouter = require("./add_notifications");
const addSubscriptionsRouter = require("./add_subscriptions");
const epConfigRouter = require("./ep_config");
const epReclamaRouter = require("./ep_reclama");
const epConversasRecRouter = require("./ep_conversas_rec");
const epNotificaRouter = require("./ep_notifica");
const epUploadRouter = require("./ep_upload");
const epAnunciosRouter = require("./ep_anuncios");
const epPerguntasRouter = require("./ep_perguntas");
const epRespondeRouter = require("./ep_responde");
const epBuyerRouter = require("./ep_buyer");
const ep242024Router = require("./ep_242024");
const epdadosenvioRouter = require("./ep_dados_envio");
const exmbrainRouter = require("./exm_brain.js");
const ependpointRouter = require("./ep_endpoints");
const epEraseMsgRouter = require("./ep_erase_msg");
const ep252025Router = require("./ep_252025");
const epetiquetasRouter = require("./ep_etiquetas");
const epAgenciaRouter = require("./ep_agencia");
const epreputationRouter = require("./ep_reputation");
const extagsRouter = require("./ex_tags");
const epcleanRouter = require("./ep_clean_docs");
const eptags3mRouter = require("./ep_tags_3m");
const epadmRouter = require("./adm/ep_adm");
const cors = require("cors");
const epWhatsappRouter = require("./ep_whatsapp");



const app = express();
app.use(cors()); // Permite CORS para todas as origens

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'adm')));
app.use('/uploads', express.static('uploads'));

// Registra os endpoints dos routers na raiz (ou ajuste o caminho se necessário)
app.use("/", sGptRouter);
app.use("/", epOnOffRouter);
app.use("/", addAllGptRouter);
app.use("/", epEraseNotificaMsgRouter);
app.use("/", addNotificationsRouter);
app.use("/", addSubscriptionsRouter);
app.use("/", epConfigRouter);
app.use("/", epReclamaRouter);
app.use("/", epConversasRecRouter);
app.use("/", epNotificaRouter);
app.use("/", epUploadRouter);
app.use("/", epAnunciosRouter);
app.use("/", epPerguntasRouter);
app.use("/", epRespondeRouter);
app.use("/", epBuyerRouter);
app.use("/", ep242024Router);
app.use("/", epdadosenvioRouter);
app.use("/", exmbrainRouter);
app.use("/", ependpointRouter);
app.use("/", epEraseMsgRouter);
app.use("/", ep252025Router);
app.use("/", epetiquetasRouter);
app.use("/", epAgenciaRouter);
app.use("/", epreputationRouter);
app.use("/", extagsRouter);
app.use("/", epcleanRouter);
app.use("/", eptags3mRouter);
app.use("/", epadmRouter);
app.use("/", epWhatsappRouter);


// Endpoint para receber notificações do Mercado Livre
app.post("/notification", async (req, res) => {
  const notification = req.body;
  logger.log("Notificação recebida: " + JSON.stringify(notification));

  // Caso a notificação seja do tipo "questions"
  if (notification.topic && notification.topic.toLowerCase() === "questions") {
    // Para notificações do tipo questions, o seller_id é notification.user_id
    // e o id da pergunta é extraído da propriedade "resource" (ex: "/questions/13315694872")
    const sellerId = notification.user_id;
    const resource = notification.resource;
    const questionId = resource.split("/").pop(); // extrai o último segmento, que é o id da pergunta

    // Chama o script exm_perguntas.js passando o seller_id e questionId
    const { exec } = require("child_process");
    exec(`node exm_perguntas.js ${sellerId} ${questionId}`, (error, stdout, stderr) => {
      if (error) {
        logger.log(`Erro ao executar exm_perguntas.js: ${error.message}`);
      } else if (stderr) {
        logger.log(`stderr do exm_perguntas.js: ${stderr}`);
      } else {
        logger.log(`exm_perguntas.js output: ${stdout}`);
      }
    });
    return res.status(200).send("OK");
  }

  // Caso a notificação seja do tipo "messages"
  if (notification.topic && notification.topic.toLowerCase() === "messages") {
    // O user_id da notificação representa o seller_id
    const sellerId = notification.user_id;
    const notificationId = notification._id;
    const resource = notification.resource;
    
    try {
      // Consulta a tabela env para obter o access_token do seller_id correspondente
      const [rows] = await pool.query("SELECT access_token FROM env WHERE seller_id = ?", [sellerId]);
      let accessToken = "";
      if (rows && rows.length > 0) {
        accessToken = rows[0].access_token;
      } else {
        console.error(`Nenhum access_token encontrado para seller_id: ${sellerId}`);
      }
      
      const { processMessage } = require("./exm_conversa_pos");

      processMessage(sellerId, notificationId, resource, accessToken)
        .then(() => {
          console.log("Processamento da mensagem concluído com sucesso.");
        })
        .catch((error) => {
          console.error("Erro ao processar mensagem:", error.message);
        });

    } catch (error) {
      console.error("Erro ao consultar o access_token no MySQL:", error.message);
    }
  }
  
  res.status(200).send("OK");
});

// Novo endpoint para reprocessar manualmente uma mensagem de venda
app.post("/reprocess_message", async (req, res) => {
  const { seller_id, notification_id, resource } = req.body;
  if (!seller_id || !notification_id || !resource) {
    return res
      .status(400)
      .json({ error: "seller_id, notification_id e resource são obrigatórios." });
  }

  try {
    // 1) Busca o access_token na tabela env
    const [rows] = await pool.query(
      "SELECT access_token FROM env WHERE seller_id = ?",
      [seller_id]
    );
    if (!rows.length) {
      return res
        .status(404)
        .json({ error: `Nenhum access_token encontrado para seller_id ${seller_id}` });
    }
    const accessToken = rows[0].access_token;

    // 2) Dispara o mesmo processMessage do fluxo automático
    const { processMessage } = require("./exm_conversa_pos");
    processMessage(seller_id, notification_id, resource, accessToken)
      .then(() => {
        res.json({ status: "Processamento iniciado para seller_id=" + seller_id });
      })
      .catch((err) => {
        console.error("Erro no reprocessamento:", err);
        res.status(500).json({ error: err.message });
      });
  } catch (err) {
    console.error("Erro ao consultar env:", err);
    res.status(500).json({ error: err.message });
  }
});


// Importa e registra o router do db_provider.js
const dbProviderRouter = require("./db_provider");
app.use("/", dbProviderRouter);

const fs = require("fs");

// Rota para servir o arquivo log.txt
app.get("/log.txt", (req, res) => {
  const logFilePath = path.join(__dirname, "log.txt");
  fs.readFile(logFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Erro ao ler o arquivo de log.");
    }
    res.type("text/plain").send(data);
  });
});

// Rota para servir o arquivo all_notifications.txt
app.get("/all_notifications.txt", (req, res) => {
  const notificationsFilePath = path.join(__dirname, "all_notifications.txt");
  fs.readFile(notificationsFilePath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Erro ao ler o arquivo all_notifications.txt.");
    }
    res.type("text/plain").send(data);
  });
});

// Rota para servir o arquivo log_242024.txt
app.get("/log_242024.txt", (req, res) => {
  const logFile242 = path.join(__dirname, "log_242024.txt");
  fs.readFile(logFile242, "utf8", (err, data) => {
    if (err) {
      return res.status(500).send("Erro ao ler o arquivo log_242024.txt.");
    }
    res.type("text/plain").send(data);
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.log(`Servidor rodando na porta ${port}.`);
});




// Agendamento: a cada 3 horas, executa o arquivo refresh_token.js
const cron = require("node-cron");

cron.schedule('0 */3 * * *', () => {
  logger.log("Executando refresh_token.js a cada 3 horas.");
  exec('node refresh_token.js', (error, stdout, stderr) => {
    if (error) {
      logger.log(`Erro ao executar refresh_token.js: ${error.message}`);
      return;
    }
    if (stderr) {
      logger.log(`stderr de refresh_token.js: ${stderr}`);
    }
    logger.log(`stdout de refresh_token.js: ${stdout}`);
  });
});



// Chamada automática ao endpoint /release_loop ao iniciar o sistema
(async () => {
  const axios = require("axios");
  const seller_id = "681274853";
  const url = "https://projetohermes-dda7e0c8d836.herokuapp.com/release_loop";

  try {
    console.log("\n[INIT] Chamando automaticamente /release_loop...");
    const { data } = await axios.post(url, { seller_id });
    console.log("[INIT] Resposta de /release_loop:", data);
  } catch (err) {
    console.error("[INIT] Erro ao chamar /release_loop:", err.response?.data || err.message);
  }
})();
