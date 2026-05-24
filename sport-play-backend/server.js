const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { router: authRouter, authMiddleware } = require('./auth');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/api/auth', authRouter);

// ===== ВИДЫ СПОРТА =====
app.get('/api/sports', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sports')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/sports/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sports WHERE id = ?', [req.params.id])
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/sports/:id/halls', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM halls WHERE sport_id = ?', [req.params.id])
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ===== ЗАЛЫ =====
app.get('/api/halls/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT h.*, s.name as sport_name FROM halls h JOIN sports s ON h.sport_id = s.id WHERE h.id = ?', [req.params.id])
    res.json(rows[0])
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/halls/:id/slots', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT s.*, COUNT(b.id) as booked_count, s.max_participants, s.price FROM slots s LEFT JOIN bookings b ON b.slot_id = s.id AND b.status = "active" WHERE s.hall_id = ? GROUP BY s.id ORDER BY s.date, s.time', [req.params.id])
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ===== СЛОТЫ =====
app.get('/api/slots', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT s.id, s.date, s.time, h.name as hall_name FROM slots s JOIN halls h ON s.hall_id = h.id GROUP BY s.id ORDER BY s.date, s.time')
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/slots/:id/participants', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT u.name, u.avatar_url FROM bookings b JOIN users u ON b.user_id = u.id WHERE b.slot_id = ? AND b.status = "active"', [req.params.id])
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ===== ЗАПИСЬ НА ТРЕНИРОВКУ =====
app.post('/api/book', authMiddleware, async (req, res) => {
  const { slot_id } = req.body
  if (!slot_id) return res.status(400).json({ error: 'slot_id обязателен' })
  try {
    const [slots] = await db.query('SELECT * FROM slots WHERE id = ?', [slot_id])
    const slot = slots[0]
    if (!slot) return res.status(404).json({ error: 'Слот не найден' })
    const [existing] = await db.query('SELECT id FROM bookings WHERE slot_id = ? AND user_id = ? AND status = "active"', [slot_id, req.user.id])
    if (existing.length > 0) return res.status(400).json({ error: 'Вы уже записаны' })
    const [countRes] = await db.query('SELECT COUNT(*) as cnt FROM bookings WHERE slot_id = ? AND status = "active"', [slot_id])
    if (countRes[0].cnt >= slot.max_participants) return res.status(400).json({ error: 'Нет свободных мест' })
    if (slot.price > 0) {
      const [users] = await db.query('SELECT balance FROM users WHERE id = ?', [req.user.id])
      if (users[0].balance < slot.price) return res.status(400).json({ error: 'Недостаточно средств на балансе' })
      await db.query('UPDATE users SET balance = balance - ? WHERE id = ?', [slot.price, req.user.id])
    }
    await db.query('INSERT INTO bookings (slot_id, user_id, client_name) VALUES (?, ?, ?)', [slot_id, req.user.id, req.user.name])
    res.json({ message: 'Вы записаны' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ===== ОТМЕНА ЗАПИСИ =====
app.post('/api/cancel/:booking_id', authMiddleware, async (req, res) => {
  try {
    const [bookings] = await db.query('SELECT b.*, s.price FROM bookings b JOIN slots s ON b.slot_id = s.id WHERE b.id = ? AND b.user_id = ?', [req.params.booking_id, req.user.id])
    const booking = bookings[0]
    if (!booking) return res.status(404).json({ error: 'Запись не найдена' })
    if (booking.status !== 'active') return res.status(400).json({ error: 'Запись уже отменена' })
    await db.query('UPDATE bookings SET status = "cancelled" WHERE id = ?', [req.params.booking_id])
    if (booking.price > 0) await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [booking.price, req.user.id])
    res.json({ message: 'Запись отменена' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ===== ПРОФИЛЬ =====
app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const [bookings] = await db.query('SELECT b.id, b.status, b.created_at, s.date, s.time, s.price, h.name as hall_name, h.address, sp.name as sport_name, sp.image_url as sport_image FROM bookings b JOIN slots s ON b.slot_id = s.id JOIN halls h ON s.hall_id = h.id JOIN sports sp ON h.sport_id = sp.id WHERE b.user_id = ? ORDER BY s.date DESC, s.time DESC', [req.user.id])
    const [users] = await db.query('SELECT balance FROM users WHERE id = ?', [req.user.id])
    res.json({ bookings, balance: users[0].balance })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ===== БАЛАНС — пополнение организатором =====
app.post('/api/balance/add', authMiddleware, async (req, res) => {
  try {
    const [me] = await db.query('SELECT role FROM users WHERE id = ?', [req.user.id])
    if (!['organizer', 'admin'].includes(me[0].role)) return res.status(403).json({ error: 'Нет доступа' })
    const { user_id, amount } = req.body
    if (!user_id || !amount || amount <= 0) return res.status(400).json({ error: 'Неверные данные' })
    await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, user_id])
    const [updated] = await db.query('SELECT id, name, balance FROM users WHERE id = ?', [user_id])
    res.json({ message: 'Баланс пополнен', user: updated[0] })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ===== ПОИСК ПОЛЬЗОВАТЕЛЕЙ =====
app.get('/api/users/search', authMiddleware, async (req, res) => {
  try {
    const [me] = await db.query('SELECT role FROM users WHERE id = ?', [req.user.id])
    if (!['organizer', 'admin'].includes(me[0].role)) return res.status(403).json({ error: 'Нет доступа' })
    const { q } = req.query
    const [rows] = await db.query('SELECT id, name, email, balance FROM users WHERE name LIKE ? OR email LIKE ? LIMIT 10', ['%' + q + '%', '%' + q + '%'])
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ===== ОРГАНИЗАТОР — залы =====
app.post('/api/organizer/halls', authMiddleware, async (req, res) => {
  try {
    const [me] = await db.query('SELECT role FROM users WHERE id = ?', [req.user.id])
    if (!['organizer', 'admin'].includes(me[0].role)) return res.status(403).json({ error: 'Нет доступа' })
    const { name, address, description, sport_id, image_url } = req.body
    const [result] = await db.query('INSERT INTO halls (name, address, description, sport_id, image_url, organizer_id) VALUES (?, ?, ?, ?, ?, ?)', [name, address, description, sport_id, image_url || null, req.user.id])
    res.json({ id: result.insertId, message: 'Зал создан' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/organizer/halls', authMiddleware, async (req, res) => {
  try {
    const [me] = await db.query('SELECT role FROM users WHERE id = ?', [req.user.id])
    if (!['organizer', 'admin'].includes(me[0].role)) return res.status(403).json({ error: 'Нет доступа' })
    const [rows] = await db.query('SELECT h.*, s.name as sport_name FROM halls h JOIN sports s ON h.sport_id = s.id WHERE h.organizer_id = ?', [req.user.id])
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ===== ОРГАНИЗАТОР — слоты =====
app.post('/api/organizer/slots', authMiddleware, async (req, res) => {
  try {
    const [me] = await db.query('SELECT role FROM users WHERE id = ?', [req.user.id])
    if (!['organizer', 'admin'].includes(me[0].role)) return res.status(403).json({ error: 'Нет доступа' })
    const { hall_id, date, time, max_participants, price } = req.body
    const [result] = await db.query('INSERT INTO slots (hall_id, date, time, max_participants, price) VALUES (?, ?, ?, ?, ?)', [hall_id, date, time, max_participants, price || 0])
    res.json({ id: result.insertId, message: 'Слот создан' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.get('/api/organizer/slots/:id/bookings', authMiddleware, async (req, res) => {
  try {
    const [me] = await db.query('SELECT role FROM users WHERE id = ?', [req.user.id])
    if (!['organizer', 'admin'].includes(me[0].role)) return res.status(403).json({ error: 'Нет доступа' })
    const [rows] = await db.query('SELECT b.id, b.client_name, b.status, b.created_at, u.email, u.id as user_id FROM bookings b LEFT JOIN users u ON b.user_id = u.id WHERE b.slot_id = ?', [req.params.id])
    res.json(rows)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ===== АДМИН — ручное управление участниками =====
app.post('/api/admin/bookings', authMiddleware, async (req, res) => {
  try {
    const [me] = await db.query('SELECT role FROM users WHERE id = ?', [req.user.id])
    if (!['organizer', 'admin'].includes(me[0].role)) return res.status(403).json({ error: 'Нет доступа' })
    const { slot_id, client_name } = req.body
    await db.query('INSERT INTO bookings (slot_id, user_id, client_name, status) VALUES (?, NULL, ?, "active")', [slot_id, client_name])
    res.json({ message: 'Участник добавлен' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/admin/bookings/:id', authMiddleware, async (req, res) => {
  try {
    const [me] = await db.query('SELECT role FROM users WHERE id = ?', [req.user.id])
    if (!['organizer', 'admin'].includes(me[0].role)) return res.status(403).json({ error: 'Нет доступа' })
    await db.query('UPDATE bookings SET status = "cancelled" WHERE id = ?', [req.params.id])
    res.json({ message: 'Участник удалён' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ===== VK АВТОРИЗАЦИЯ =====
app.post('/api/auth/vk', async (req, res) => {
  const { code, device_id, state, code_verifier } = req.body
  try {
    // Шаг 1: обмениваем code на токены
    const params = {
      grant_type: 'authorization_code',
      code,
      device_id,
      client_id: '54575533',
      redirect_uri: 'https://sportplay.458000.ru/auth/vk/callback'
    }
    if (state) params.state = state
    if (code_verifier) params.code_verifier = code_verifier

    const response = await axios.post(
      'https://id.vk.com/oauth2/auth',
      new URLSearchParams(params),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    console.log('VK response:', JSON.stringify(response.data))

    const { user_id, access_token } = response.data
    const vkId = String(user_id)

    // Шаг 2: получаем имя пользователя через user_info
    let name = 'VK пользователь'
    try {
      const userInfoRes = await axios.post(
        'https://id.vk.com/oauth2/user_info',
        new URLSearchParams({ client_id: '54575533', access_token }),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )
      console.log('user_info response:', JSON.stringify(userInfoRes.data))
      const u = userInfoRes.data.user
      if (u && u.first_name) name = u.first_name + ' ' + (u.last_name || '')
    } catch(e) {
      console.log('user_info error:', e.message)
    }

    // Шаг 3: ищем или создаём пользователя в БД
    let [users] = await db.query('SELECT * FROM users WHERE vk_id = ?', [vkId])
    let user = users[0]

    if (!user) {
      // Новый пользователь — создаём
      await db.query('INSERT INTO users (name, vk_id) VALUES (?, ?)', [name, vkId])
      const [newUsers] = await db.query('SELECT * FROM users WHERE vk_id = ?', [vkId])
      user = newUsers[0]
    } else if (user.name === 'VK пользователь' || user.name === 'undefined undefined') {
      // Обновляем имя если было сохранено неверно
      await db.query('UPDATE users SET name = ? WHERE id = ?', [name, user.id])
      user.name = name
    }

    // Шаг 4: генерируем JWT токен
    const token = jwt.sign(
      { id: user.id, name: user.name },
      'sportplay_secret',
      { expiresIn: '7d' }
    )

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    console.error('VK error:', err.response?.data || err.message)
    res.status(500).json({ error: 'Ошибка VK авторизации' })
  }
})
// ===== РЕЙТИНГ =====
app.get('/api/halls/:id/rating', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM ratings WHERE hall_id = ?',
      [req.params.id]
    )
    const [reviews] = await db.query(
      `SELECT r.rating, r.comment, r.created_at, u.name as user_name 
       FROM ratings r JOIN users u ON r.user_id = u.id 
       WHERE r.hall_id = ? ORDER BY r.created_at DESC`,
      [req.params.id]
    )
    res.json({ avg: rows[0].avg_rating, count: rows[0].count, reviews })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

app.post('/api/halls/:id/rating', authMiddleware, async (req, res) => {
  const { rating, comment } = req.body
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Оценка от 1 до 5' })
  }
  try {
    await db.query(
      `INSERT INTO ratings (hall_id, user_id, rating, comment) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE rating = ?, comment = ?`,
      [req.params.id, req.user.id, rating, comment, rating, comment]
    )
    res.json({ message: 'Оценка сохранена' })
  } catch (err) { res.status(500).json({ error: err.message }) }
})
const PORT = 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));