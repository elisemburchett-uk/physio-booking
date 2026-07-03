const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let session = null;

// Get current session
app.get('/api/session', (req, res) => {
  res.json(session);
});

// Physio creates a new session
app.post('/api/session', (req, res) => {
  const { startTime, duration } = req.body;
  session = {
    startTime,
    duration,
    bookings: [],
    createdAt: new Date().toISOString()
  };
  res.json(session);
});

// Clear session
app.delete('/api/session', (req, res) => {
  session = null;
  res.json({ ok: true });
});

// Book a slot
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
  res.json(session);
});

// Cancel a booking
app.delete('/api/book/:playerName', (req, res) => {
  if (!session) return res.status(400).json({ error: 'No session active' });
  session.bookings = session.bookings.filter(b => b.playerName !== req.params.playerName);
  res.json(session);
});

app.listen(PORT, () => {
  console.log(`Physio booking app running at http://localhost:${PORT}`);
});
