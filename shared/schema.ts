import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Orders table schema
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  pedido_id: text("pedido_id").notNull(),
  pedido_data: text("pedido_data").notNull(),
  pedido_hora: text("pedido_hora").notNull(),
  pedido_status: text("pedido_status").notNull(),
  envio_estado: text("envio_estado").notNull(),
  produto_nome: text("produto_nome").notNull(),
  produto_valor_unitario: text("produto_valor_unitario").notNull(),
  produto_quantidade: text("produto_quantidade").notNull(),
  produto_valor_total: text("produto_valor_total").notNull(),
  created_at: timestamp("created_at").defaultNow()
});

// Campaign table schema
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  inicio_relatorios: text("inicio_relatorios").notNull(),
  termino_relatorios: text("termino_relatorios").notNull(),
  nome_campanha: text("nome_campanha").notNull(),
  alcance: integer("alcance").notNull(),
  impressoes: integer("impressoes").notNull(),
  cpm_brl: text("cpm_brl").notNull(),
  cliques_link: integer("cliques_link").notNull(),
  cpc_brl: text("cpc_brl").notNull(),
  visualizacoes_pagina: integer("visualizacoes_pagina").notNull(),
  custo_visualizacao_brl: text("custo_visualizacao_brl").notNull(),
  adicoes_carrinho: integer("adicoes_carrinho").notNull(),
  custo_adicao_carrinho_brl: text("custo_adicao_carrinho_brl").notNull(),
  valor_conversao_adicoes: text("valor_conversao_adicoes").notNull(),
  valor_usado_brl: text("valor_usado_brl").notNull(),
  created_at: timestamp("created_at").defaultNow()
});

// Order insert schema
export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  created_at: true
});

// Campaign insert schema
export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  created_at: true
});

// Types
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Campaign = typeof campaigns.$inferSelect;
