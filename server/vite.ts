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
  // No Vercel, os arquivos estáticos são servidos a partir do diretório dist/public
  const distPath = path.resolve(process.cwd(), "dist/public");

  if (!fs.existsSync(distPath)) {
    log(`⚠️ Aviso: O diretório de build ${distPath} não foi encontrado.`, "static");
    
    // Verificar se estamos no Vercel
    if (process.env.VERCEL) {
      log(`🔍 Ambiente Vercel detectado, tentando alternativas...`, "static");
      
      // Tentar encontrar o diretório correto
      const possiblePaths = [
        path.resolve(process.cwd(), "public"),
        path.resolve(import.meta.dirname, "public"),
        path.resolve(import.meta.dirname, "..", "public")
      ];
      
      for (const tryPath of possiblePaths) {
        if (fs.existsSync(tryPath)) {
          log(`✅ Encontrado diretório alternativo: ${tryPath}`, "static");
          app.use(express.static(tryPath));
          
          // Rota fallback para o SPA
          app.use("*", (_req, res) => {
            res.sendFile(path.resolve(tryPath, "index.html"));
          });
          
          return;
        }
      }
      
      log(`❌ Nenhum diretório alternativo encontrado`, "static");
    }
  } else {
    log(`✅ Servindo arquivos estáticos de: ${distPath}`, "static");
  }

  app.use(express.static(distPath));

  // Rota fallback para o SPA
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
