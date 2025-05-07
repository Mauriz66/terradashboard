import { orders, campaigns } from "@shared/schema";
import fs from 'fs';
import path from 'path';

// Interface for storage operations
export interface IStorage {
  getOrders(): Promise<any[]>;
  getCampaigns(): Promise<any[]>;
  saveOrders(orders: any[]): Promise<void>;
  saveCampaigns(campaigns: any[]): Promise<void>;
}

// Memory storage implementation
export class MemStorage implements IStorage {
  private ordersData: any[] = [];
  private campaignsData: any[] = [];

  async getOrders(): Promise<any[]> {
    return this.ordersData;
  }

  async getCampaigns(): Promise<any[]> {
    return this.campaignsData;
  }

  async saveOrders(newOrders: any[]): Promise<void> {
    this.ordersData = newOrders;
  }

  async saveCampaigns(newCampaigns: any[]): Promise<void> {
    this.campaignsData = newCampaigns;
  }
}

// File storage implementation for persistence
export class FileStorage implements IStorage {
  private dataDir: string;
  private ordersFile: string;
  private campaignsFile: string;
  
  constructor() {
    this.dataDir = path.resolve(process.cwd(), 'data');
    this.ordersFile = path.join(this.dataDir, 'orders.json');
    this.campaignsFile = path.join(this.dataDir, 'campaigns.json');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    // Create files if they don't exist
    if (!fs.existsSync(this.ordersFile)) {
      fs.writeFileSync(this.ordersFile, JSON.stringify([]));
    }
    
    if (!fs.existsSync(this.campaignsFile)) {
      fs.writeFileSync(this.campaignsFile, JSON.stringify([]));
    }
  }

  async getOrders(): Promise<any[]> {
    try {
      const data = fs.readFileSync(this.ordersFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erro ao ler pedidos do arquivo:', error);
      return [];
    }
  }

  async getCampaigns(): Promise<any[]> {
    try {
      const data = fs.readFileSync(this.campaignsFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erro ao ler campanhas do arquivo:', error);
      return [];
    }
  }

  async saveOrders(newOrders: any[]): Promise<void> {
    try {
      fs.writeFileSync(this.ordersFile, JSON.stringify(newOrders, null, 2));
    } catch (error) {
      console.error('Erro ao salvar pedidos no arquivo:', error);
      throw error;
    }
  }

  async saveCampaigns(newCampaigns: any[]): Promise<void> {
    try {
      fs.writeFileSync(this.campaignsFile, JSON.stringify(newCampaigns, null, 2));
    } catch (error) {
      console.error('Erro ao salvar campanhas no arquivo:', error);
      throw error;
    }
  }
}

// Export a singleton storage instance
// Optar pela implementação FileStorage para persistência dos dados
export const storage: IStorage = new FileStorage();
