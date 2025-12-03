require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) process.exit(1);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log("⏳ Adicionando colunas de horário de funcionamento...");
    
    // Adiciona colunas com valores padrão (09:00 as 18:00) para não quebrar lojas existentes
    await pool.query(`
      ALTER TABLE tenants 
      ADD COLUMN IF NOT EXISTS work_start VARCHAR(5) DEFAULT '09:00',
      ADD COLUMN IF NOT EXISTS work_end VARCHAR(5) DEFAULT '18:00';
    `);

    console.log("✅ Colunas 'work_start' e 'work_end' adicionadas!");
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await pool.end();
  }
}

migrate();