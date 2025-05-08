// Serverless API Handler para o Vercel
import express from 'express';
import path from 'path';
import fs from 'fs';

// Criar uma nova instância do Express
const app = express();

// Configuração básica
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  const dirs = ["dist", "dist/public", "dist/client", "public", "dist/api", "api"];
  
  const diagnosticInfo = {
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL ? true : false,
      port: process.env.PORT || "not set"
    },
    paths: {
      currentDir,
      directories: {}
    },
    headers: req.headers
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
    serverless: true
  });
});

// Rota de fallback para a API
app.all('/api/*', (req, res) => {
  res.status(501).json({
    error: 'API em manutenção',
    message: 'Esta rota API ainda não está disponível na versão serverless',
    path: req.path,
    method: req.method
  });
});

// Handler para o Vercel Serverless
export default app; 