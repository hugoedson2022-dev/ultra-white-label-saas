require('dotenv').config();
const { Pool } = require('pg');

// Validação de Segurança
if (!process.env.DATABASE_URL) {
  console.error("❌ ERRO CRÍTICO: .env não encontrado ou DATABASE_URL vazia.");
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const sql = `
  -- 1. LIMPEZA TOTAL (Apaga tabelas antigas para recriar do zero)
  DROP TABLE IF EXISTS bookings CASCADE;
  DROP TABLE IF EXISTS tenants CASCADE;

  -- 2. CRIAÇÃO DA TABELA DE CLIENTES (TENANTS)
  -- Inclui: Serviços (JSON), Pix, WhatsApp, Tema
  CREATE TABLE tenants (
    id SERIAL PRIMARY KEY,
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    theme JSONB NOT NULL,
    whatsapp VARCHAR(20),
    services JSONB DEFAULT '[]',
    pix_key VARCHAR(100)
  );

  -- 3. CRIAÇÃO DA TABELA DE AGENDAMENTOS (BOOKINGS)
  -- Inclui: Separação de Data/Hora (Fuso Horário) e Status
  CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    tenant_slug VARCHAR(50) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    booking_date DATE NOT NULL,          -- Data (YYYY-MM-DD)
    booking_time VARCHAR(10) NOT NULL,   -- Hora ("14:00")
    status VARCHAR(20) DEFAULT 'confirmed', -- confirmed, cancelled, completed
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- 4. TRAVA DE SEGURANÇA (Impedir Double-Booking)
  -- Não permite criar agendamento se já existir um CONFIRMADO na mesma loja/dia/hora
  CREATE UNIQUE INDEX idx_unique_booking 
  ON bookings (tenant_slug, booking_date, booking_time) 
  WHERE status != 'cancelled'; 

  -- 5. POPULAR DADOS INICIAIS (SEED)
  INSERT INTO tenants (slug, name, theme, whatsapp, services, pix_key)
  VALUES 
    (
      'barbearia', 
      'Barbearia do Zé', 
      '{"primary": "bg-slate-900", "accent": "text-amber-500", "background": "bg-slate-100"}', 
      '5511999999999',
      '[{"name": "Corte de Cabelo", "price": 50, "duration": 45}, {"name": "Barba Completa", "price": 40, "duration": 30}]',
      'email@barbeariadoze.com'
    ),
    (
      'eventos', 
      'Centro de Eventos Tech', 
      '{"primary": "bg-blue-700", "accent": "text-blue-500", "background": "bg-blue-50"}', 
      '5511888888888',
      '[{"name": "Auditório Principal", "price": 2000, "duration": 480}]',
      ''
    );
`;

async function runMigration() {
  try {
    console.log("⏳ Iniciando Migração Total (Reset de Fábrica)...");
    await pool.query(sql);
    console.log("✅ Tabelas recriadas com sucesso!");
    console.log("✅ Colunas 'services', 'pix_key' e 'status' configuradas.");
    console.log("✅ Dados iniciais da 'Barbearia' e 'Eventos' restaurados.");
    console.log("👉 PRÓXIMO PASSO: Reinicie o servidor backend (node index.js) para garantir a conexão.");
  } catch (err) {
    console.error("❌ Erro fatal na migração:", err);
  } finally {
    await pool.end();
  }
}

runMigration();