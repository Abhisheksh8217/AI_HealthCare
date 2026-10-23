require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/patient', require('./routes/patient'));
app.use('/api/health', require('./routes/health'));
app.use('/api/family', require('./routes/family'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/doctor', require('./routes/doctor'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/ai', require('./routes/ai'));

app.get('/', (_, res) => res.json({ status: 'ok', message: 'Healthcare API is running smoothly' }));
app.get('/api/health-check', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
