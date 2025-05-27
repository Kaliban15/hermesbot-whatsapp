# Usa Node com Chromium já instalado
FROM ghcr.io/puppeteer/puppeteer:latest

# Define diretório do app
WORKDIR /app

# Copia tudo do projeto
COPY . .

# Instala dependências (sem Chromium porque já está incluso na imagem base)
RUN npm install --omit=optional

# Expõe a porta usada no pai.js
EXPOSE 3000

# Comando para iniciar o bot
CMD ["node", "pai.js"]
