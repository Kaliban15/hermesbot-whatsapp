FROM ghcr.io/puppeteer/puppeteer:latest

WORKDIR /app

COPY . .

# ⬅️ ESSA LINHA É ESSENCIAL AGORA
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN npm install --omit=optional

CMD ["node", "pai.js"]
