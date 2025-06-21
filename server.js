// server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const dbPath = path.join(__dirname, 'scores.db');
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // 정적 파일 서빙

// SQLite DB 초기화
const db = new sqlite3.Database(dbPath);
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    score INTEGER NOT NULL,
    timeTaken INTEGER,
    answers TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

// 점수 제출 API
app.post('/submit-score', (req, res) => {
  const { name, score, answers, timeTaken } = req.body;
  if (!name || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid input' });
  }
  const stmt = db.prepare('INSERT INTO scores (name, score, timeTaken, answers) VALUES (?, ?, ?, ?)');
  stmt.run(name, score, timeTaken || 0, JSON.stringify(answers || []), function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json({ success: true });
  });
});

// 순위표 가져오기 API
app.get('/leaderboard', (req, res) => {
  db.all('SELECT name, score, timeTaken, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT 10', (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    res.json(rows);
  });
});

// 서버 실행
app.listen(port, () => {
  console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});
