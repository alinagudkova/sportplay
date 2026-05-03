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

  if (!slot_id)
    return res.status(400).json({ error: 'slot_id обязателен' });

  try {
    await db.query(
      `INSERT INTO bookings (slot_id, user_id, client_name)
       VALUES (?, ?, ?)`,
      [slot_id, req.user.id, req.user.name]
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
app.get('/api/halls/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT h.*, s.name as sport_name 
      FROM halls h
      JOIN sports s ON h.sport_id = s.id
      WHERE h.id = ?
    `, [req.params.id])
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/halls/:id/slots', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.*, 
        COUNT(b.id) as booked_count,
        s.max_participants
      FROM slots s
      LEFT JOIN bookings b ON b.slot_id = s.id AND b.status = 'active'
      WHERE s.hall_id = ?
      GROUP BY s.id
      ORDER BY s.date, s.time
    `, [req.params.id])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/slots/:id/participants', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.name, u.avatar_url
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.slot_id = ? AND b.status = 'active'
    `, [req.params.id])
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const [bookings] = await db.query(`
      SELECT b.id, b.status, b.created_at,
        s.date, s.time,
        h.name as hall_name, h.address,
        sp.name as sport_name, sp.image_url as sport_image
      FROM bookings b
      JOIN slots s ON b.slot_id = s.id
      JOIN halls h ON s.hall_id = h.id
      JOIN sports sp ON h.sport_id = sp.id
      WHERE b.user_id = ?
      ORDER BY s.date DESC, s.time DESC
    `, [req.user.id])
    res.json(bookings)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
app.post('/api/auth/vk', async (req, res) => {
  const { code, device_id } = req.body

  try {
    const response = await require('axios').post(
      'https://id.vk.com/oauth2/auth',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        device_id,
        client_id: '54575533',
        redirect_uri: 'https://sportplay.458000.ru/auth/vk/callback'
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    const { access_token } = response.data

    const userInfo = await require('axios').get(
  'https://api.vk.com/method/users.get',
  { 
    params: {
      access_token,
      fields: 'first_name,last_name',
      v: '5.131'
    }
  }
)

console.log('VK userInfo:', JSON.stringify(userInfo.data))

const vkData = userInfo.data.response?.[0] || userInfo.data
const vkId = String(vkData.id)
const name = `${vkData.first_name} ${vkData.last_name}`

    let [users] = await db.query('SELECT * FROM users WHERE vk_id = ?', [vkId])
    let user = users[0]

    if (!user) {
      await db.query(
        'INSERT INTO users (name, vk_id) VALUES (?, ?)',
        [name, vkId]
      )
      const [newUsers] = await db.query('SELECT * FROM users WHERE vk_id = ?', [vkId])
      user = newUsers[0]
    }

    const token = require('jsonwebtoken').sign(
      { id: user.id, name: user.name },
      'sportplay_secret',
      { expiresIn: '7d' }
    )

    res.json({ token, user: { id: user.id, name: user.name, email: user.email } })
  } catch (err) {
    console.error(err.response?.data || err.message)
    res.status(500).json({ error: 'Ошибка VK авторизации' })
  }
})
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));