require('dotenv').config();

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./db');

const router = express.Router();

const JWT_SECRET = "sportplay_secret";

/* ================= REGISTER ================= */
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ error: 'Все поля обязательны' });

  try {
    const hash = await bcrypt.hash(password, 10);

    await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES (?, ?, ?)`,
      [name, email, hash]
    );

    res.json({ message: 'Пользователь создан' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ================= LOGIN ================= */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const [users] = await db.query(
    `SELECT * FROM users WHERE email=?`,
    [email]
  );

  if (!users.length)
    return res.status(400).json({ error: 'Пользователь не найден' });

  const user = users[0];

  const valid = await bcrypt.compare(password, user.password_hash);

  if (!valid)
    return res.status(400).json({ error: 'Неверный пароль' });

  const token = jwt.sign(
    { id: user.id, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
});

/* ================= MIDDLEWARE ================= */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header)
    return res.status(401).json({ error: 'Нет токена' });

  const token = header.split(' ')[1];

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Неверный токен' });
  }
}

module.exports = { router, authMiddleware };