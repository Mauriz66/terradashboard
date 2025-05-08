import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";

// Criar a aplicação Express
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Expor o app para o Vercel
export { app };

app.use((req, res, next) => {
  res.setHeader('X-Request-Path', req.path);
  res.setHeader('X-Server-Timestamp', new Date().toISOString());
  
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Rota de diagnóstico para depuração
app.get("/api/_diagnostics", (req, res) => {
  const currentDir = process.cwd();
  const dirs = ["dist", "dist/public", "dist/client", "public", "dist/api", "api"];
  
  interface DirectoryInfo {
    exists: boolean;
    files?: string[];
    error?: string;
  }
  
  interface DiagnosticInfo {
    environment: {
      nodeEnv: string | undefined;
      vercel: boolean;
      port: string;
    };
    paths: {
      currentDir: string;
      directories: Record<string, DirectoryInfo>;
    };
    headers: typeof req.headers;
  }
  
  const diagnosticInfo: DiagnosticInfo = {
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
    } catch (error: unknown) {
      diagnosticInfo.paths.directories[dir] = { 
        exists: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  });
  
  res.json(diagnosticInfo);
});

// Verificação de saúde para o Vercel
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Servidor funcionando corretamente" });
});

// Função para iniciar o servidor
const startServer = async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  const isDevelopment = process.env.NODE_ENV === "development";
  if (isDevelopment) {
    log("🛠️ Ambiente de desenvolvimento - Configurando Vite HMR");
    await setupVite(app, server);
  } else {
    log("🚀 Ambiente de produção - Servindo arquivos estáticos");
    serveStatic(app);
  }

  // Não iniciar o servidor se estivermos no Vercel (serverless)
  if (!process.env.VERCEL) {
    const port = process.env.PORT || 5000;
    
    server.listen({
      port: Number(port),
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`🌐 Servidor rodando na porta ${port}`);
      log(`📁 Diretório atual: ${process.cwd()}`);
      log(`🔧 Ambiente: ${process.env.NODE_ENV || 'não definido'}`);
    });
  } else {
    log('🔄 Executando no ambiente Vercel - modo serverless');
  }
};

// Iniciar o servidor (exceto no ambiente Vercel, onde o arquivo api/index.js assume o controle)
if (!process.env.VERCEL) {
  startServer();
} else {
  // No Vercel, apenas configurar rotas e middleware sem iniciar o servidor HTTP
  registerRoutes(app).then(() => {
    log('✅ Rotas Express registradas para o Vercel');
    serveStatic(app);
  }).catch(err => {
    log(`❌ Erro ao registrar rotas: ${err instanceof Error ? err.message : String(err)}`);
  });
}
