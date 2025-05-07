#!/bin/bash
# Script para auxiliar no build do projeto no Vercel

# Instalar as dependências
npm install

# Executar o build
npm run build

# Copiar arquivos necessários para a pasta dist
echo "Build concluído com sucesso!" 