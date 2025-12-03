require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'segredo_super_secreto_mude_em_producao';

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// --- MIDDLEWARE ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Acesso negado.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido.' });
    req.user = user;
    next();
  });
}

// --- ROTAS ---

app.get('/', (req, res) => res.json({ status: 'Online' }));

// 1. Listagem
app.get('/api/tenants', async (req, res) => {
  try {
    const result = await pool.query('SELECT slug, name FROM tenants ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Erro listar' }); }
});

// 2. Configuração (Inclui Horários agora)
app.get('/api/config/:slug', async (req, res) => {
  try {
    // Adicionado work_start e work_end
    const result = await pool.query(
      'SELECT name, theme, whatsapp, services, pix_key, work_start, work_end FROM tenants WHERE slug = $1', 
      [req.params.slug]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: '404' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: 'Erro interno' }); }
});

// 3. Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  
  let result = await pool.query('SELECT id, slug, name, password_hash FROM tenants WHERE email = $1', [email]);
  let user = result.rows[0];
  let role = 'owner';

  if (!user) {
    result = await pool.query('SELECT id, tenant_slug, name, password_hash, role FROM team_members WHERE email = $1', [email]);
    user = result.rows[0];
    if (user) { role = user.role; user.slug = user.tenant_slug; }
  }

  if (!user || !await bcrypt.compare(password, user.password_hash)) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = jwt.sign({ id: user.id, slug: user.slug, name: user.name, role }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, slug: user.slug, name: user.name, role });
});

// 4. Criar Loja (Inclui Horários)
app.post('/api/tenants', async (req, res) => {
  const { slug, name, theme, whatsapp, services, pix_key, email, password, work_start, work_end } = req.body;

  if (!email || !password) return res.status(400).json({ error: 'Dados incompletos' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const servicesJson = services || [];

    // Salva work_start e work_end (com defaults se não vierem)
    await pool.query(
      `INSERT INTO tenants (slug, name, theme, whatsapp, services, pix_key, email, password_hash, work_start, work_end) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [slug, name, theme, whatsapp, JSON.stringify(servicesJson), pix_key, email, hashedPassword, work_start || '09:00', work_end || '18:00']
    );
    
    res.status(204).send();
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Slug/Email em uso.' });
    res.status(500).json({ error: 'Erro ao salvar.' });
  }
});

// 5. Membros Equipe
app.post('/api/team-members', authenticateToken, async (req, res) => {
  const { email, name, password, role } = req.body;
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Sem permissão.' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO team_members (tenant_slug, email, name, password_hash, role) VALUES ($1, $2, $3, $4, $5)`,
      [req.user.slug, email, name, hashedPassword, role || 'member']
    );
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: 'Erro criar membro.' }); }
});

app.get('/api/team-members', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM team_members WHERE tenant_slug = $1', [req.user.slug]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: 'Erro listar.' }); }
});

app.delete('/api/team-members/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'owner') return res.status(403).json({ error: 'Sem permissão.' });
  try {
    await pool.query('DELETE FROM team_members WHERE id = $1 AND tenant_slug = $2', [req.params.id, req.user.slug]);
    res.status(204).send();
  } catch (err) { res.status(500).json({ error: 'Erro deletar.' }); }
});

// 6. Agendamento e Stats
app.post('/api/bookings', async (req, res) => {
  const { tenant_slug, service_name, customer_name, customer_phone, booking_date, booking_time } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO bookings (tenant_slug, service_name, customer_name, customer_phone, booking_date, booking_time, status) 
       VALUES ($1, $2, $3, $4, $5, $6, 'confirmed') RETURNING id`,
      [tenant_slug, service_name, customer_name, customer_phone, booking_date, booking_time]
    );
    res.status(201).json({ id: result.rows[0].id });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Horário ocupado.' });
    res.status(500).json({ error: 'Erro agendar.' });
  }
});

app.get('/api/availability', async (req, res) => {
  const { slug, date } = req.query;
  try {
    const result = await pool.query(
      `SELECT booking_time FROM bookings WHERE tenant_slug = $1 AND booking_date = $2 AND status != 'cancelled'`, 
      [slug, date]
    );
    res.json(result.rows.map(r => r.booking_time));
  } catch (err) { res.status(500).json({ error: 'Erro.' }); }
});

app.get('/api/stats/:slug', authenticateToken, async (req, res) => {
  if (req.user.slug !== req.params.slug) return res.status(403).json({ error: 'Negado' });
  try {
    const conf = await pool.query('SELECT services FROM tenants WHERE slug = $1', [req.params.slug]);
    const priceMap = {};
    if (conf.rows[0]?.services) conf.rows[0].services.forEach(s => priceMap[s.name] = s.price);

    const bookings = await pool.query("SELECT status, service_name FROM bookings WHERE tenant_slug = $1", [req.params.slug]);
    
    let total = 0;
    const counts = { confirmed: 0, cancelled: 0, completed: 0 };

    bookings.rows.forEach(b => {
      if (counts[b.status] !== undefined) counts[b.status]++;
      if ((b.status === 'confirmed' || b.status === 'completed') && priceMap[b.service_name]) {
        total += priceMap[b.service_name];
      }
    });

    res.json({ totalRevenue: total.toFixed(2), totalBookings: bookings.rowCount, stats: counts });
  } catch (err) { res.status(500).json({ error: 'Erro stats' }); }
});

app.get('/api/bookings/:slug', authenticateToken, async (req, res) => {
  if (req.user.slug !== req.params.slug) return res.status(403).json({ error: 'Negado' });
  try {
    const r = await pool.query('SELECT * FROM bookings WHERE tenant_slug = $1 ORDER BY booking_date DESC, booking_time ASC', [req.params.slug]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

app.patch('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', [req.body.status, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Erro' }); }
});

app.listen(port, () => console.log(`🚀 Rodando em http://localhost:${port}`));