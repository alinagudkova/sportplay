const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

const { router: authRouter, authMiddleware } = require('./auth');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// ===== AUTH =====
app.use('/api/auth', authRouter);

// ===== SLOTS =====
app.get('/api/slots', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.id, s.date, s.time, h.name as hall_name,
      GROUP_CONCAT(b.client_name SEPARATOR ', ') as booked_clients
      FROM slots s
      JOIN halls h ON s.hall_id = h.id
      LEFT JOIN bookings b ON b.slot_id = s.id
      GROUP BY s.id
      ORDER BY s.date, s.time
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== BOOK (AUTH REQUIRED) =====
app.post('/api/book', authMiddleware, async (req, res) => {
  const { slot_id } = req.body;
  const client_name = req.user.name;

  if (!slot_id)
    return res.status(400).json({ error: 'slot_id обязателен' });

  try {
    await db.query(
      `INSERT INTO bookings (slot_id, client_name)
       VALUES (?, ?)`,
      [slot_id, client_name]
    );
    res.json({ message: 'Вы записаны' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
  
});
app.get('/api/sports', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sports')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
app.get('/api/sports/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sports WHERE id = ?', [req.params.id])
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/sports/:id/halls', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM halls WHERE sport_id = ?', [req.params.id])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));