import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

// Set up multer for file uploads
const upload = multer({ 
  dest: "uploads/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limite de arquivo
  },
  fileFilter: (req, file, cb) => {
    // Verificar se é um arquivo CSV
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos CSV são permitidos'));
    }
  }
});

// Esquemas esperados para validação dos CSVs
const expectedOrderHeaders = [
  'pedido_id', 'pedido_data', 'pedido_hora', 'pedido_status', 
  'envio_estado', 'produto_nome', 'produto_valor_unitario', 
  'produto_quantidade', 'produto_valor_total'
];

const expectedCampaignHeaders = [
  'Início dos relatórios', 'Término dos relatórios', 'Nome da campanha',
  'Alcance', 'Impressões', 'CPM (custo por 1.000 impressões) (BRL)',
  'Cliques no link', 'CPC (custo por clique no link) (BRL)',
  'Visualizações da página de destino', 'Custo por visualização da página de destino (BRL)',
  'Adições ao carrinho', 'Custo por adição ao carrinho (BRL)',
  'Valor de conversão de adições ao carrinho', 'Valor usado (BRL)'
];

// Função para validar as colunas do CSV
function validateCSVHeaders(headers: string[], expectedHeaders: string[]): boolean {
  return expectedHeaders.every(header => headers.includes(header));
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadDir = path.resolve(process.cwd(), "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // API routes
  app.get("/api/orders", async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      res.status(500).json({ error: "Falha ao buscar pedidos" });
    }
  });

  app.get("/api/campaigns", async (req, res) => {
    try {
      const campaigns = await storage.getCampaigns();
      res.json(campaigns);
    } catch (error) {
      console.error("Erro ao buscar campanhas:", error);
      res.status(500).json({ error: "Falha ao buscar campanhas" });
    }
  });

  app.post("/api/upload", upload.single("file"), async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const fileType = req.body.type;
    const month = req.body.month;
    const year = req.body.year;

    if (!fileType || !month || !year) {
      return res.status(400).json({ 
        error: "Parâmetros obrigatórios ausentes (type, month, year)" 
      });
    }

    const filePath = req.file.path;
    const results: any[] = [];
    let headers: string[] = [];
    let hasValidationError = false;
    let validationErrorMessage = '';

    try {
      // Process the CSV file
      await new Promise<void>((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv({ separator: ';' }))
          .on('headers', (csvHeaders) => {
            headers = csvHeaders;
            // Validar os cabeçalhos conforme o tipo de arquivo
            if (fileType === 'orders' && !validateCSVHeaders(csvHeaders, expectedOrderHeaders)) {
              hasValidationError = true;
              validationErrorMessage = 'O arquivo CSV de pedidos não contém todas as colunas necessárias';
              reject(new Error(validationErrorMessage));
            } else if (fileType === 'ads' && !validateCSVHeaders(csvHeaders, expectedCampaignHeaders)) {
              hasValidationError = true;
              validationErrorMessage = 'O arquivo CSV de campanhas não contém todas as colunas necessárias';
              reject(new Error(validationErrorMessage));
            }
          })
          .on('data', (data) => {
            // Validação básica de dados
            if (fileType === 'orders') {
              // Certifique-se de que os campos numéricos são parsable
              try {
                const valorUnitario = parseFloat(data.produto_valor_unitario.replace(',', '.'));
                const quantidade = parseInt(data.produto_quantidade);
                const valorTotal = parseFloat(data.produto_valor_total.replace(',', '.'));
                
                // Verificar cálculos (valor total = valor unitário * quantidade)
                const calculatedTotal = valorUnitario * quantidade;
                // Permitir uma pequena margem de erro para arredondamentos
                if (Math.abs(calculatedTotal - valorTotal) > 0.1) {
                  console.warn(`Aviso: O valor total ${valorTotal} não corresponde ao cálculo ${valorUnitario} * ${quantidade} = ${calculatedTotal} para o pedido ${data.pedido_id}`);
                }
              } catch (e) {
                console.warn('Aviso: Erro ao validar campos numéricos', e);
              }
            }
            
            results.push(data);
          })
          .on('end', () => {
            if (!hasValidationError) {
              resolve();
            }
          })
          .on('error', (error) => {
            reject(error);
          });
      });

      // Save results to storage
      if (fileType === 'orders') {
        await storage.saveOrders(results);
      } else if (fileType === 'ads') {
        await storage.saveCampaigns(results);
      } else {
        return res.status(400).json({ error: "Tipo de arquivo inválido" });
      }

      // Clean up the temporary file
      fs.unlinkSync(filePath);

      // Return success response
      res.status(200).json({
        success: true,
        message: "Arquivo processado com sucesso",
        file: {
          id: Date.now(),
          filename: req.file.originalname,
          type: fileType,
          date: new Date().toISOString(),
          period: { month, year },
          status: "processed"
        }
      });
    } catch (error) {
      // Clean up the temporary file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      const errorMessage = hasValidationError ? validationErrorMessage : "Falha ao processar o arquivo";
      console.error("Erro no upload:", error);
      res.status(400).json({ error: errorMessage });
    }
  });

  // Load initial data if storage is empty
  try {
    const orders = await storage.getOrders();
    if (orders.length === 0) {
      // Load orders from the sample data file
      const ordersPath = path.resolve(process.cwd(), "attached_assets", "pedidosabril.csv");
      if (fs.existsSync(ordersPath)) {
        const orders: any[] = [];
        await new Promise<void>((resolve) => {
          fs.createReadStream(ordersPath)
            .pipe(csv({ separator: ';' }))
            .on('data', (data) => orders.push(data))
            .on('end', () => {
              storage.saveOrders(orders).then(() => resolve());
            });
        });
        console.log(`Carregados ${orders.length} pedidos dos dados de exemplo`);
      }
    }

    const campaigns = await storage.getCampaigns();
    if (campaigns.length === 0) {
      // Load campaigns from the sample data file
      const campaignsPath = path.resolve(process.cwd(), "attached_assets", "adsabril.csv");
      if (fs.existsSync(campaignsPath)) {
        const campaigns: any[] = [];
        await new Promise<void>((resolve) => {
          fs.createReadStream(campaignsPath)
            .pipe(csv({ separator: ';' }))
            .on('data', (data) => campaigns.push(data))
            .on('end', () => {
              storage.saveCampaigns(campaigns).then(() => resolve());
            });
        });
        console.log(`Carregadas ${campaigns.length} campanhas dos dados de exemplo`);
      }
    }
  } catch (error) {
    console.error("Erro ao carregar dados iniciais:", error);
  }

  const httpServer = createServer(app);
  return httpServer;
}
