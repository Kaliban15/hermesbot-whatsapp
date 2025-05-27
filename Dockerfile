FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

COPY . .

# Corrige permissões e executa a instalação como o usuário correto
USER root
RUN chown -R pptruser:pptruser /app

USER pptruser
RUN echo "▶️ INICIANDO INSTALAÇÃO" \
  && npm install --omit=optional --no-fund --no-audit --loglevel verbose \
  && echo "✅ INSTALAÇÃO CONCLUÍDA"

CMD ["node", "pai.js"]
