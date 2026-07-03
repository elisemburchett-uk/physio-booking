const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'session.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function loadSession() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {}
  return null;
}

function saveSession(session) {
  if (session) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(session, null, 2));
  } else {
    try { fs.unlinkSync(DATA_FILE); } catch (e) {}
  }
}

let session = loadSession();

app.get('/api/session', (req, res) => {
  res.json(session);
});

app.post('/api/session', (req, res) => {
  const { startTime, duration } = req.body;
  session = {
    startTime,
    duration,
    bookings: [],
    createdAt: new Date().toISOString()
  };
  saveSession(session);
  res.json(session);
});

app.delete('/api/session', (req, res) => {
  session = null;
  saveSession(null);
  res.json({ ok: true });
});

app.post('/api/book', (req, res) => {
  if (!session) return res.status(400).json({ error: 'No session active' });

  const { playerName, slotTime, type } = req.body;
  const slotDuration = type === 'treatment' ? 10 : 5;

  const conflict = session.bookings.some(b => {
    const bStart = b.slotTime;
    const bEnd = bStart + (b.type === 'treatment' ? 10 : 5);
    const newEnd = slotTime + slotDuration;
    return slotTime < bEnd && newEnd > bStart;
  });

  if (conflict) return res.status(409).json({ error: 'Slot no longer available' });

  session.bookings.push({ playerName, slotTime, type, bookedAt: new Date().toISOString() });
  session.bookings.sort((a, b) => a.slotTime - b.slotTime);
  saveSession(session);
  res.json(session);
});

app.delete('/api/book/:playerName', (req, res) => {
  if (!session) return res.status(400).json({ error: 'No session active' });
  session.bookings = session.bookings.filter(b => b.playerName !== req.params.playerName);
  saveSession(session);
  res.json(session);
});

app.listen(PORT, () => {
  console.log(`Physio booking app running on port ${PORT}`);
});
