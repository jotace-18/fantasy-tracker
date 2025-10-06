# ---------- BACKEND ----------
    FROM node:20-slim

    WORKDIR /app
    
    COPY package*.json ./
    RUN npm install
    
    COPY . .
    
    EXPOSE 4000
    
    # Instalar nodemon globalmente (opcional, útil en contenedor)
    RUN npm install -g nodemon
    
    CMD ["npm", "run", "dev"]
    