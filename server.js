import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import { Rcon } from 'rcon-client';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

const dbPath = process.env.DB_PATH || path.join(__dirname, 'hotland.db');
const dbDir = path.dirname(dbPath);

try {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
} catch (error) {
  console.warn(`[Warning] Could not create directory ${dbDir}: ${error.message}. Will try to use fallback directory.`);
}

let db;
try {
  db = new Database(dbPath);
} catch (error) {
  console.error(`[Error] Failed to create database at ${dbPath}: ${error.message}`);
  const fallbackPath = path.join(__dirname, 'hotland.db');
  console.log(`[Info] Falling back to local database: ${fallbackPath}`);
  db = new Database(fallbackPath);
}

// Инициализация таблиц
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      is_verified INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS promocodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      uses_left INTEGER DEFAULT 1,
      percentage INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS rcon_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host TEXT NOT NULL,
      port TEXT NOT NULL,
      password TEXT
  );

  CREATE TABLE IF NOT EXISTS easydonate_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_key TEXT NOT NULL,
      server_id TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      item TEXT NOT NULL,
      duration TEXT NOT NULL,
      price TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

try {
  db.exec('ALTER TABLE promocodes ADD COLUMN percentage INTEGER DEFAULT 0;');
} catch (e) {
  // column already exists
}

try {
  db.exec('ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0;');
} catch (e) {
  // column already exists
}

// Вспомогательная функция для ответов
const handleReq = (handler) => async (req, res) => {
  try {
    const result = await handler(req.body, req);
    res.json({ result });
  } catch (err) {
    res.status(400).json({ error: err.message || err });
  }
};

app.post('/api/register', handleReq(async ({ username, email, password }) => {
  const exists = db.prepare('SELECT 1 FROM users WHERE username = ? OR email = ?').get(username, email);
  if (exists) throw new Error('Пользователь с таким ником или email уже существует');

  const hashed = await bcrypt.hash(password, 10);
  db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(username, email, hashed);
  return { msg: 'Регистрация успешна!', username, email };
}));

app.post('/api/login', handleReq(async ({ identifier, password }) => {
  const isEmail = identifier.includes('@');
  const query = isEmail ? 'SELECT username, password, is_banned, email FROM users WHERE email = ?' : 'SELECT username, password, is_banned, email FROM users WHERE username = ?';
  const user = db.prepare(query).get(identifier);

  if (!user) throw new Error('Пользователь не найден');
  if (user.is_banned) throw new Error('Ваш аккаунт заблокирован');
  
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error('Неверный пароль');

  return JSON.stringify({ msg: 'Вход успешен', username: user.username, email: user.email });
}));

app.post('/api/get_users', handleReq(() => {
  return db.prepare('SELECT id, username, email, is_banned, created_at FROM users').all();
}));

app.post('/api/toggle_ban', handleReq(({ id, is_banned }) => {
  db.prepare('UPDATE users SET is_banned = ? WHERE id = ?').run(is_banned ? 1 : 0, id);
  return `Пользователь ${is_banned ? 'забанен' : 'разбанен'}`;
}));

app.post('/api/save_rcon', handleReq(({ host, port, password }) => {
  db.prepare('DELETE FROM rcon_settings').run();
  db.prepare('INSERT INTO rcon_settings (host, port, password) VALUES (?, ?, ?)').run(host, port, password);
  return 'RCON настройки сохранены';
}));

app.post('/api/get_rcon', handleReq(() => {
  return db.prepare('SELECT host, port, password FROM rcon_settings LIMIT 1').get() || { host: '', port: '', password: '' };
}));

app.post('/api/save_easydonate', handleReq(({ shop_key, server_id }) => {
  db.prepare('DELETE FROM easydonate_settings').run();
  db.prepare('INSERT INTO easydonate_settings (shop_key, server_id) VALUES (?, ?)').run(shop_key, server_id);
  return 'EasyDonate настройки сохранены';
}));

app.post('/api/get_easydonate', handleReq(() => {
  return db.prepare('SELECT shop_key, server_id FROM easydonate_settings LIMIT 1').get() || { shop_key: '', server_id: '' };
}));

app.post('/api/rcon_online', handleReq(async () => {
  const rcon = db.prepare('SELECT host, port, password FROM rcon_settings LIMIT 1').get();
  if (!rcon || !rcon.host) return "0";

  try {
    const rconClient = await Rcon.connect({
      host: rcon.host,
      port: parseInt(rcon.port),
      password: rcon.password
    });
    
    const response = await rconClient.send("list");
    rconClient.end();
    
    const match = response.match(/There are (\d+) of a max/);
    return match ? match[1] : "0";
  } catch (e) {
    return "0";
  }
}));

app.post('/api/get_stats', handleReq(() => {
  const users = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const purchases = db.prepare('SELECT COUNT(*) as count FROM purchases').get().count;
  return JSON.stringify({ users, purchases });
}));

app.post('/api/generate_promocode', handleReq(({ uses, percentage }) => {
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  db.prepare('INSERT INTO promocodes (code, uses_left, percentage) VALUES (?, ?, ?)').run(code, uses, percentage || 0);
  return code;
}));

app.post('/api/get_promocodes', handleReq(() => {
  return db.prepare('SELECT id, code, uses_left, percentage FROM promocodes').all();
}));

app.post('/api/delete_promocode', handleReq(({ id }) => {
  db.prepare('DELETE FROM promocodes WHERE id = ?').run(id);
  return 'Промокод удален';
}));

app.post('/api/create_payment', handleReq(async ({ username, email, coupon, products }, req) => {
  const settings = db.prepare('SELECT shop_key, server_id FROM easydonate_settings LIMIT 1').get();
  if (!settings || !settings.shop_key || !settings.server_id) {
    throw new Error('Настройки EasyDonate не заданы в админ-панели');
  }

  // Динамически определяем текущий домен сайта для возврата после оплаты
  const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers.host;
  const currentUrl = `${protocol}://${host}/`;

  const queryParams = new URLSearchParams({
    customer: username,
    server_id: settings.server_id,
    products: JSON.stringify(products),
    success_url: currentUrl
  });

  if (email) queryParams.append('email', email);
  if (coupon) queryParams.append('coupon', coupon);

  const response = await fetch(`https://easydonate.ru/api/v3/shop/payment/create?${queryParams.toString()}`, {
    headers: {
      'Shop-Key': settings.shop_key
    }
  });

  const data = await response.json();
  
  if (!response.ok || !data.success) {
    throw new Error(data.response || 'Ошибка при создании платежа');
  }

  return data.response.url;
}));

app.post('/api/make_purchase', handleReq(({ username, item, duration, price }) => {
  db.prepare('INSERT INTO purchases (username, item, duration, price) VALUES (?, ?, ?, ?)').run(username, item, duration, price);
  return 'Покупка успешно добавлена';
}));

// Раздача статических файлов фронтенда в продакшене (основная)
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all route для SPA (чтобы работал React Router и перезагрузка страниц)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
