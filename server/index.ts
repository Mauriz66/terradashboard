import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
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

(async () => {
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

  const port = process.env.PORT || process.env.VERCEL ? 3000 : 5000;
  
  server.listen({
    port: Number(port),
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`🌐 Servidor rodando na porta ${port}`);
    log(`📁 Diretório atual: ${process.cwd()}`);
    log(`🔧 Ambiente: ${process.env.NODE_ENV || 'não definido'}`);
    
    if (process.env.VERCEL) {
      log('🔄 Executando no ambiente Vercel');
    }
  });
})();
