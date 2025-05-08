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
  // No Vercel, prioridade para o diretório raiz dist
  const vercelPriorityPaths = [
    // No Vercel, após nosso novo build script:
    path.resolve(process.cwd(), "dist"),     // Agora contém arquivos copiados do client
    
    // Backups e alternativas:
    path.resolve(process.cwd(), "dist/public"),
    path.resolve(process.cwd(), "public"),
    path.resolve(process.cwd(), "dist/client")
  ];
  
  // Em ambiente de desenvolvimento:
  const devPaths = [
    path.resolve(import.meta.dirname, "public"),
    path.resolve(import.meta.dirname, "..", "public"),
    path.resolve(import.meta.dirname, "..", "dist/public"),
    path.resolve(import.meta.dirname, "..", "client/dist")
  ];
  
  // Combinamos os caminhos prioritários primeiro
  const pathsToCheck = process.env.VERCEL 
    ? [...vercelPriorityPaths, ...devPaths]
    : [...devPaths, ...vercelPriorityPaths];
  
  log(`🔍 Verificando ${pathsToCheck.length} caminhos possíveis para arquivos estáticos`, "static");
  
  // Flag para rastrear se encontramos um diretório válido
  let foundValidDir = false;
  let staticPath;
  
  // Loop através de todos os caminhos possíveis
  for (const tryPath of pathsToCheck) {
    try {
      const hasDir = fs.existsSync(tryPath);
      const hasIndexHtml = hasDir && fs.existsSync(path.join(tryPath, "index.html"));
      
      if (hasDir) {
        log(`📁 Diretório existe: ${tryPath} ${hasIndexHtml ? '(com index.html)' : '(sem index.html)'}`, "static");
      }
      
      if (hasDir && hasIndexHtml) {
        log(`✅ Encontrado diretório válido com index.html: ${tryPath}`, "static");
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
    log(`❌ ALERTA: Nenhum diretório válido com index.html encontrado`, "static");
    
    // Tentar encontrar qualquer diretório existente como fallback
    for (const tryPath of pathsToCheck) {
      try {
        if (fs.existsSync(tryPath)) {
          log(`⚠️ Usando diretório existente sem index.html como fallback: ${tryPath}`, "static");
          staticPath = tryPath;
          break;
        }
      } catch (err) {
        // Ignorar erros nesta fase de fallback
      }
    }
    
    // Se mesmo assim não encontramos nenhum, criar um diretório emergencial
    if (!staticPath) {
      log(`⚠️ Nenhum diretório existente encontrado, criando solução emergencial`, "static");
      const emergencyPath = path.resolve(process.cwd(), "dist");
      
      try {
        // Criar diretório se não existir
        if (!fs.existsSync(emergencyPath)) {
          fs.mkdirSync(emergencyPath, { recursive: true });
          log(`📁 Criado diretório emergencial: ${emergencyPath}`, "static");
        }
        
        // Criar página HTML de emergência
        const emergencyFile = path.join(emergencyPath, "index.html");
        const emergencyHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TerraFé Dashboard - Emergência</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
    h1 { color: #2563eb; }
    pre { background: #f1f5f9; padding: 10px; border-radius: 4px; overflow: auto; font-size: 13px; }
    .error { color: #dc2626; }
    .success { color: #16a34a; }
  </style>
</head>
<body>
  <h1>TerraFé Dashboard</h1>
  <p>Esta é uma página de emergência criada pelo servidor porque não foi possível encontrar arquivos estáticos válidos.</p>
  <p class="error">Se você está vendo esta página, houve um problema na configuração ou no deploy.</p>
  <p>ID de diagnóstico: ${Date.now()}</p>
  
  <h2>Ambiente</h2>
  <pre>
  Current Directory: ${process.cwd()}
  NODE_ENV: ${process.env.NODE_ENV || 'undefined'}
  Vercel: ${process.env.VERCEL ? 'true' : 'false'}
  </pre>
  
  <h2>Diretórios verificados</h2>
  <pre>
  ${pathsToCheck.map(p => `- ${p}`).join('\n  ')}
  </pre>
  
  <p>Tente acessar <a href="/api/_diagnostics">/api/_diagnostics</a> para mais informações.</p>
</body>
</html>
`;
        
        fs.writeFileSync(emergencyFile, emergencyHTML);
        log(`📄 Criado arquivo index.html de emergência em: ${emergencyFile}`, "static");
        staticPath = emergencyPath;
      } catch (err) {
        log(`❌ Erro ao criar solução emergencial: ${err instanceof Error ? err.message : String(err)}`, "static");
      }
    }
  }
  
  if (staticPath) {
    log(`🌐 Configurando servidor de arquivos estáticos em: ${staticPath}`, "static");
    
    // Servir arquivos estáticos
    app.use(express.static(staticPath, { 
      extensions: ['html', 'htm'],
      index: ['index.html', 'index.htm']
    }));
    
    // Rota fallback para o SPA
    app.use("*", (_req, res, next) => {
      try {
        const indexPath = path.resolve(staticPath!, "index.html");
        if (fs.existsSync(indexPath)) {
          log(`🔄 Servindo index.html para rota SPA`, "static");
          res.sendFile(indexPath);
        } else {
          log(`⚠️ index.html não encontrado em ${staticPath}`, "static");
          next();
        }
      } catch (err) {
        log(`❌ Erro ao servir index.html: ${err instanceof Error ? err.message : String(err)}`, "static");
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
            <p>O servidor não conseguiu encontrar nenhum diretório válido para servir arquivos estáticos.</p>
            <p>ID do erro: ${Date.now()}</p>
            <p>Acesse <a href="/api/_diagnostics">/api/_diagnostics</a> para ver informações de diagnóstico.</p>
          </body>
        </html>
      `);
    });
  }
}
