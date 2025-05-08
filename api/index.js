// Serverless API Handler para o Vercel
import express from 'express';
import path from 'path';
import fs from 'fs';

// Criar uma nova instância do Express
const app = express();

// Configuração básica
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS para permitir requisições de qualquer origem
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
  
  // Interromper processamento para requisições OPTIONS
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Middleware de diagnóstico
app.use((req, res, next) => {
  res.setHeader('X-Request-Path', req.path);
  res.setHeader('X-Server-Timestamp', new Date().toISOString());
  res.setHeader('X-Powered-By', 'TerraFe-Vercel');
  next();
});

// Rota de diagnóstico
app.get("/api/_diagnostics", (req, res) => {
  const currentDir = process.cwd();
  const dirs = ["dist", "dist/public", "dist/client", "public", "dist/api", "api", "dist/assets", "assets"];
  
  const diagnosticInfo = {
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL ? true : false,
      port: process.env.PORT || "not set",
      platform: process.platform,
      arch: process.arch,
      version: process.version
    },
    paths: {
      currentDir,
      directories: {}
    },
    headers: req.headers,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };
  
  dirs.forEach(dir => {
    try {
      const fullPath = path.join(currentDir, dir);
      const exists = fs.existsSync(fullPath);
      diagnosticInfo.paths.directories[dir] = {
        exists,
        files: exists ? fs.readdirSync(fullPath).slice(0, 5) : []
      };
    } catch (error) {
      diagnosticInfo.paths.directories[dir] = { 
        exists: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  });
  
  res.json(diagnosticInfo);
});

// Rota de verificação de saúde
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    vercel: process.env.VERCEL === "1",
    serverless: true,
    version: "0.1.0",
    environment: process.env.NODE_ENV || "production"
  });
});

// Rota root da API - para informações básicas
app.get("/api", (req, res) => {
  res.json({
    name: "TerraFé API",
    version: "0.1.0",
    status: "online",
    endpoints: [
      { path: "/api/health", description: "Verificação de saúde da API" },
      { path: "/api/_diagnostics", description: "Informações de diagnóstico do sistema" }
    ],
    timestamp: new Date().toISOString()
  });
});

// Rota de fallback para a API
app.all('/api/*', (req, res) => {
  res.status(501).json({
    error: 'API em manutenção',
    message: 'Esta rota API ainda não está disponível na versão serverless',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Rota de captura para qualquer outra solicitação
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// Handler para o Vercel Serverless
export default app; 