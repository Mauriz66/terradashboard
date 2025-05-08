import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { orders, campaigns } from './schema';

// Configurar a conexão Neon
neonConfig.fetchConnectionCache = true;

// Usar a variável de ambiente ou fallback para o desenvolvimento local
const connectionString = process.env.DATABASE_URL || 
  process.env.POSTGRES_URL || 
  'postgresql://neondb_owner:npg_CGtrbS7jidx2@ep-small-block-a4opqbw0.us-east-1.aws.neon.tech/neondb?sslmode=require';

// Log da conexão (removido em produção)
if (process.env.NODE_ENV !== 'production') {
  console.log('🔌 Conectando ao banco de dados Neon...');
}

// Criar o cliente SQL
const sql = neon(connectionString);

// Criar a instância Drizzle
export const db = drizzle(sql, { schema: { orders, campaigns } });

// Helper para diagnóstico do banco de dados
export async function testDbConnection() {
  try {
    // Tentar fazer uma consulta simples
    const result = await sql`SELECT 1 as test`;
    return { 
      connected: true, 
      result: result[0]?.test === 1 ? 'success' : 'invalid-result',
      message: 'Conexão com o banco de dados estabelecida com sucesso'
    };
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error);
    return { 
      connected: false, 
      result: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      error: error
    };
  }
} 