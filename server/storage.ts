import { orders, campaigns } from "@shared/schema";
import { db, testDbConnection } from "@shared/db";
import { eq } from "drizzle-orm";
import { log } from "./vite";

// Interface for storage operations
export interface IStorage {
  getOrders(): Promise<any[]>;
  getCampaigns(): Promise<any[]>;
  saveOrders(ordersData: any[]): Promise<void>;
  saveCampaigns(campaignsData: any[]): Promise<void>;
  testConnection(): Promise<any>;
}

// Database storage implementation
export class DbStorage implements IStorage {
  constructor() {
    // Tentar conectar ao banco de dados no início
    this.testConnection()
      .then(result => {
        if (result.connected) {
          log(`✅ Banco de dados conectado com sucesso`, "db");
        } else {
          log(`❌ Falha na conexão com o banco de dados: ${result.message}`, "db");
        }
      })
      .catch(err => {
        log(`❌ Erro ao testar conexão com o banco de dados: ${err.message}`, "db");
      });
  }

  async getOrders(): Promise<any[]> {
    try {
      return await db.select().from(orders);
    } catch (error) {
      log(`❌ Erro ao buscar pedidos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, "db");
      return [];
    }
  }

  async getCampaigns(): Promise<any[]> {
    try {
      return await db.select().from(campaigns);
    } catch (error) {
      log(`❌ Erro ao buscar campanhas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, "db");
      return [];
    }
  }

  async saveOrders(ordersData: any[]): Promise<void> {
    try {
      // Preparar os dados para inserção
      const ordersToInsert = ordersData.map(order => ({
        pedido_id: order.pedido_id || order.Pedido || '',
        pedido_data: order.pedido_data || order['Data do pedido'] || '',
        pedido_hora: order.pedido_hora || order['Hora do pedido'] || '',
        pedido_status: order.pedido_status || order['Status do pedido'] || '',
        envio_estado: order.envio_estado || order['Estado de Envio'] || '',
        produto_nome: order.produto_nome || order['Nome do Produto'] || '',
        produto_valor_unitario: order.produto_valor_unitario || order['Valor unitário'] || '0',
        produto_quantidade: order.produto_quantidade || order.Quantidade || '0',
        produto_valor_total: order.produto_valor_total || order['Valor total'] || '0'
      }));

      // Inserir os dados no banco
      if (ordersToInsert.length > 0) {
        await db.insert(orders).values(ordersToInsert);
        log(`✅ ${ordersToInsert.length} pedidos salvos no banco de dados`, "db");
      }
    } catch (error) {
      log(`❌ Erro ao salvar pedidos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, "db");
      throw error;
    }
  }

  async saveCampaigns(campaignsData: any[]): Promise<void> {
    try {
      // Preparar os dados para inserção
      const campaignsToInsert = campaignsData.map(campaign => ({
        inicio_relatorios: campaign.inicio_relatorios || campaign['Início dos relatórios'] || '',
        termino_relatorios: campaign.termino_relatorios || campaign['Término dos relatórios'] || '',
        nome_campanha: campaign.nome_campanha || campaign['Nome da campanha'] || '',
        alcance: parseInt(campaign.alcance || campaign.Alcance || '0'),
        impressoes: parseInt(campaign.impressoes || campaign.Impressões || '0'),
        cpm_brl: campaign.cpm_brl || campaign['CPM (R$)'] || '0',
        cliques_link: parseInt(campaign.cliques_link || campaign['Cliques em links'] || '0'),
        cpc_brl: campaign.cpc_brl || campaign['CPC (R$)'] || '0',
        visualizacoes_pagina: parseInt(campaign.visualizacoes_pagina || campaign['Visualizações de página'] || '0'),
        custo_visualizacao_brl: campaign.custo_visualizacao_brl || campaign['Custo por visualização de página (R$)'] || '0',
        adicoes_carrinho: parseInt(campaign.adicoes_carrinho || campaign['Adições ao carrinho'] || '0'),
        custo_adicao_carrinho_brl: campaign.custo_adicao_carrinho_brl || campaign['Custo por adição ao carrinho (R$)'] || '0',
        valor_conversao_adicoes: campaign.valor_conversao_adicoes || campaign['Valor de conversão (adições ao carrinho)'] || '0',
        valor_usado_brl: campaign.valor_usado_brl || campaign['Valor usado (R$)'] || '0'
      }));

      // Inserir os dados no banco
      if (campaignsToInsert.length > 0) {
        await db.insert(campaigns).values(campaignsToInsert);
        log(`✅ ${campaignsToInsert.length} campanhas salvas no banco de dados`, "db");
      }
    } catch (error) {
      log(`❌ Erro ao salvar campanhas: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, "db");
      throw error;
    }
  }

  async testConnection(): Promise<any> {
    return await testDbConnection();
  }
}

// Fallback para armazenamento em memória caso a conexão com o banco falhe
class MemStorage implements IStorage {
  private ordersData: any[] = [];
  private campaignsData: any[] = [];

  async getOrders(): Promise<any[]> {
    return this.ordersData;
  }

  async getCampaigns(): Promise<any[]> {
    return this.campaignsData;
  }

  async saveOrders(newOrders: any[]): Promise<void> {
    this.ordersData = [...this.ordersData, ...newOrders];
    log(`📝 ${newOrders.length} pedidos salvos em memória`, "storage");
  }

  async saveCampaigns(newCampaigns: any[]): Promise<void> {
    this.campaignsData = [...this.campaignsData, ...newCampaigns];
    log(`📝 ${newCampaigns.length} campanhas salvas em memória`, "storage");
  }

  async testConnection(): Promise<any> {
    return { connected: true, result: 'memory', message: 'Usando armazenamento em memória' };
  }
}

// Criação do storage apropriado
const createStorage = (): IStorage => {
  try {
    // Verificamos se a variável de ambiente existe
    if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
      log('🔄 Usando armazenamento de banco de dados', 'storage');
      return new DbStorage();
    } else {
      log('⚠️ Variável DATABASE_URL não encontrada, usando armazenamento em memória', 'storage');
      return new MemStorage();
    }
  } catch (error) {
    log(`❌ Erro ao inicializar o armazenamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'storage');
    log('⚠️ Fallback para armazenamento em memória', 'storage');
    return new MemStorage();
  }
};

// Export a singleton storage instance
export const storage: IStorage = createStorage();
