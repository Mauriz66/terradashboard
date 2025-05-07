#!/bin/bash

# Instalar dependências do projeto principal
echo "Instalando dependências do projeto raiz..."
npm install

# Construir o frontend
echo "Construindo o frontend..."
cd client
npm install
npm run build
cd ..

# Construir o backend
echo "Construindo o backend..."
npm run build:server 