require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) process.exit(1);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log("🔒 Atualizando tabela para suportar Login...");
    
    // Adiciona email e senha na tabela tenants
    await pool.query(`
      ALTER TABLE tenants 
      ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE,
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
    `);

    // Cria um índice para buscar por email rapidamente
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_tenant_email ON tenants(email);
    `);

    console.log("✅ Sucesso! Agora as lojas têm email e senha.");
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await pool.end();
  }
}

migrate();