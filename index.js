require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path'); // <--- IMPORTANTE

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_secreto_mude_em_producao';

// Em produção (mesmo domínio), CORS não é estritamente necessário, mas mantemos por segurança
app.use(cors());
app.use(express.json());

// --- CONEXÃO COM BANCO DE DADOS ---
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ... [MANTENHA AQUI TODAS AS SUAS ROTAS DE API EXISTENTES: authenticateToken, login, tenants, bookings, etc.] ...
// (Vou omitir as rotas que já fizemos para economizar espaço, mas ELAS DEVEM FICAR AQUI)

// ============================================================
// 1. ROTAS DA API (Cole aqui as rotas que você já tem: /api/login, /api/tenants, etc.)
// ============================================================

// ... (Cole suas rotas aqui se for substituir o arquivo todo, ou apenas adicione o bloco abaixo no final do seu arquivo atual)

// ============================================================
// 2. SERVIR O FRONTEND (A Mágica da Unificação)
// ============================================================

// Diz ao Node para usar os arquivos criados pelo 'npm run build' do React
app.use(express.static(path.join(__dirname, 'client/dist')));

// Qualquer requisição que não seja API, manda para o React (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist', 'index.html'));
});

app.listen(port, () => console.log(`🚀 Servidor Unificado rodando na porta ${port}`));