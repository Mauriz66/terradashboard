import { orders, campaigns } from "@shared/schema";

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

// Export a singleton storage instance
export const storage: IStorage = new MemStorage();
