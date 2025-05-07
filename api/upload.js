import { FileStorage } from '../server/storage.js';
import multer from 'multer';
import { createRouter, expressWrapper } from 'next-connect';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import os from 'os';

const storage = new FileStorage();

// Configuração do multer para upload de arquivos
const upload = multer({
  dest: path.join(os.tmpdir(), 'uploads'),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limite de arquivo
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Apenas arquivos CSV são permitidos"));
    }
  }
});

const expectedOrderHeaders = [
  "pedido_id",
  "pedido_data",
  "pedido_hora",
  "pedido_status",
  "envio_estado",
  "produto_nome",
  "produto_valor_unitario",
  "produto_quantidade",
  "produto_valor_total"
];

const expectedCampaignHeaders = [
  "Início dos relatórios",
  "Término dos relatórios",
  "Nome da campanha",
  "Alcance",
  "Impressões",
  "CPM (custo por 1.000 impressões) (BRL)",
  "Cliques no link",
  "CPC (custo por clique no link) (BRL)",
  "Visualizações da página de destino",
  "Custo por visualização da página de destino (BRL)",
  "Adições ao carrinho",
  "Custo por adição ao carrinho (BRL)",
  "Valor de conversão de adições ao carrinho",
  "Valor usado (BRL)"
];

function validateCSVHeaders(headers, expectedHeaders) {
  return expectedHeaders.every(header => headers.includes(header));
}

// Configurar o router
const router = createRouter();

// Configurar CORS
router.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
});

// Rota para upload de arquivo
router.post(expressWrapper(upload.single('file')), async (req, res) => {
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
  const results = [];
  let headers = [];
  let hasValidationError = false;
  let validationErrorMessage = "";

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv({ separator: ";" }))
        .on("headers", (csvHeaders) => {
          headers = csvHeaders;
          if (fileType === "orders" && !validateCSVHeaders(csvHeaders, expectedOrderHeaders)) {
            hasValidationError = true;
            validationErrorMessage = "O arquivo CSV de pedidos não contém todas as colunas necessárias";
            reject(new Error(validationErrorMessage));
          } else if (fileType === "ads" && !validateCSVHeaders(csvHeaders, expectedCampaignHeaders)) {
            hasValidationError = true;
            validationErrorMessage = "O arquivo CSV de campanhas não contém todas as colunas necessárias";
            reject(new Error(validationErrorMessage));
          }
        })
        .on("data", (data) => {
          if (fileType === "orders") {
            try {
              const valorUnitario = parseFloat(data.produto_valor_unitario.replace(",", "."));
              const quantidade = parseInt(data.produto_quantidade);
              const valorTotal = parseFloat(data.produto_valor_total.replace(",", "."));
              const calculatedTotal = valorUnitario * quantidade;
              
              if (Math.abs(calculatedTotal - valorTotal) > 0.1) {
                console.warn(`Aviso: O valor total ${valorTotal} não corresponde ao cálculo ${valorUnitario} * ${quantidade} = ${calculatedTotal} para o pedido ${data.pedido_id}`);
              }
            } catch (e) {
              console.warn("Aviso: Erro ao validar campos numéricos", e);
            }
          }
          results.push(data);
        })
        .on("end", () => {
          if (!hasValidationError) {
            resolve();
          }
        })
        .on("error", (error) => {
          reject(error);
        });
    });

    if (fileType === "orders") {
      await storage.saveOrders(results);
    } else if (fileType === "ads") {
      await storage.saveCampaigns(results);
    } else {
      return res.status(400).json({ error: "Tipo de arquivo inválido" });
    }

    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      message: "Arquivo processado com sucesso",
      file: {
        id: Date.now(),
        filename: req.file.originalname,
        type: fileType,
        date: (new Date()).toISOString(),
        period: { month, year },
        status: "processed"
      }
    });
  } catch (error) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    const errorMessage = hasValidationError ? validationErrorMessage : "Falha ao processar o arquivo";
    console.error("Erro no upload:", error);
    res.status(400).json({ error: errorMessage });
  }
});

export default router.handler(); 