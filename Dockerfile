FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

COPY . .

# Variável para pular o Chromium download
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN echo "▶️ INICIANDO INSTALAÇÃO" \
  && npm install --omit=optional --no-fund --no-audit --loglevel verbose \
  && echo "✅ INSTALAÇÃO CONCLUÍDA"

CMD ["node", "pai.js"]
