FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

COPY . .

RUN echo "▶️ INICIANDO INSTALAÇÃO" \
  && npm install --omit=optional --loglevel verbose \
  && echo "✅ INSTALAÇÃO CONCLUÍDA"

CMD ["node", "pai.js"]
