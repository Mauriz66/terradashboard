import fs from "fs";
import path from "path";

export class FileStorage {
  dataDir;
  ordersFile;
  campaignsFile;
  
  constructor() {
    this.dataDir = path.resolve(process.cwd(), "data");
    this.ordersFile = path.join(this.dataDir, "orders.json");
    this.campaignsFile = path.join(this.dataDir, "campaigns.json");
    
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    if (!fs.existsSync(this.ordersFile)) {
      fs.writeFileSync(this.ordersFile, JSON.stringify([]));
    }
    
    if (!fs.existsSync(this.campaignsFile)) {
      fs.writeFileSync(this.campaignsFile, JSON.stringify([]));
    }
  }
  
  async getOrders() {
    try {
      const data = fs.readFileSync(this.ordersFile, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Erro ao ler pedidos do arquivo:", error);
      return [];
    }
  }
  
  async getCampaigns() {
    try {
      const data = fs.readFileSync(this.campaignsFile, "utf8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Erro ao ler campanhas do arquivo:", error);
      return [];
    }
  }
  
  async saveOrders(newOrders) {
    try {
      fs.writeFileSync(this.ordersFile, JSON.stringify(newOrders, null, 2));
    } catch (error) {
      console.error("Erro ao salvar pedidos no arquivo:", error);
      throw error;
    }
  }
  
  async saveCampaigns(newCampaigns) {
    try {
      fs.writeFileSync(this.campaignsFile, JSON.stringify(newCampaigns, null, 2));
    } catch (error) {
      console.error("Erro ao salvar campanhas no arquivo:", error);
      throw error;
    }
  }
}

// Criar uma instância padrão para uso interno
export const storage = new FileStorage(); 