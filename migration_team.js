require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) process.exit(1);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  try {
    console.log("⏳ Criando tabela de membros da equipe...");
    
    // Tabela para Usuários Secundários (Gerentes, Barbeiros, Secretários)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        tenant_slug VARCHAR(50) REFERENCES tenants(slug), -- Vinculado à loja
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(50) DEFAULT 'member', -- owner, manager, member
        
        -- Garante que um e-mail só possa ser usado uma vez no sistema todo
        CONSTRAINT uc_member_email UNIQUE (email) 
      );
    `);

    console.log("✅ Tabela 'team_members' criada! O sistema agora suporta equipes.");
  } catch (err) {
    console.error("Erro:", err.message);
  } finally {
    await pool.end();
  }
}

migrate();