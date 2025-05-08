import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions: any = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  // Lista de possíveis locais para arquivos estáticos
  const possiblePaths = [
    path.resolve(process.cwd(), "dist/public"),
    path.resolve(process.cwd(), "public"),
    path.resolve(process.cwd(), "dist/client"),
    path.resolve(import.meta.dirname, "public"),
    path.resolve(import.meta.dirname, "..", "public"),
    path.resolve(import.meta.dirname, "..", "dist/public"),
    path.resolve(import.meta.dirname, "..", "client/dist")
  ];
  
  // Flag para rastrear se encontramos um diretório válido
  let foundValidDir = false;
  let staticPath;
  
  // Loop através de todos os caminhos possíveis
  for (const tryPath of possiblePaths) {
    try {
      if (fs.existsSync(tryPath) && fs.existsSync(path.join(tryPath, "index.html"))) {
        log(`✅ Encontrado diretório de arquivos estáticos: ${tryPath}`, "static");
        staticPath = tryPath;
        foundValidDir = true;
        break;
      }
    } catch (err) {
      log(`⚠️ Erro ao verificar path ${tryPath}: ${err instanceof Error ? err.message : String(err)}`, "static");
    }
  }
  
  // Se não encontramos nenhum diretório válido
  if (!foundValidDir) {
    log(`❌ ALERTA: Nenhum diretório de arquivos estáticos válido encontrado`, "static");
    
    // Falha segura - criar um index.html temporário se estivermos em produção
    if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
      const emergencyPath = path.resolve(process.cwd(), "dist/public");
      try {
        if (!fs.existsSync(emergencyPath)) {
          fs.mkdirSync(emergencyPath, { recursive: true });
        }
        
        const emergencyHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>TerraFé Dashboard</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            h1 { color: #2563eb; }
            pre { background: #f1f5f9; padding: 10px; border-radius: 4px; overflow: auto; }
          </style>
        </head>
        <body>
          <h1>TerraFé Dashboard</h1>
          <p>O servidor está funcionando, mas o diretório de arquivos estáticos não foi encontrado.</p>
          <p>Se você está vendo esta página, contate o suporte com o ID: ${Date.now()}</p>
          <h2>Debug Info</h2>
          <pre>
          Current Directory: ${process.cwd()}
          NODE_ENV: ${process.env.NODE_ENV || 'undefined'}
          Vercel: ${process.env.VERCEL ? 'true' : 'false'}
          Paths Checked: ${possiblePaths.join(', ')}
          </pre>
        </body>
        </html>
        `;
        
        fs.writeFileSync(path.join(emergencyPath, "index.html"), emergencyHTML);
        log(`⚠️ Criado arquivo index.html de emergência`, "static");
        staticPath = emergencyPath;
      } catch (err) {
        log(`❌ Erro ao criar página de emergência: ${err instanceof Error ? err.message : String(err)}`, "static");
      }
    }
  }
  
  if (staticPath) {
    log(`🌐 Configurando servidor de arquivos estáticos: ${staticPath}`, "static");
    app.use(express.static(staticPath));
    
    // Rota fallback para o SPA
    app.use("*", (_req, res, next) => {
      try {
        res.sendFile(path.resolve(staticPath!, "index.html"));
      } catch (err) {
        next(err);
      }
    });
  } else {
    log(`❌ Falha ao configurar servidor de arquivos estáticos`, "static");
    
    // Rota de emergência caso nada mais funcione
    app.use("*", (_req, res) => {
      res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: #dc2626;">Erro de Configuração</h1>
            <p>Não foi possível localizar os arquivos estáticos do aplicativo.</p>
            <p>ID do erro: ${Date.now()}</p>
          </body>
        </html>
      `);
    });
  }
}
