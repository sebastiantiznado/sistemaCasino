const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/estado', (req, res) => {
  res.json({
    jugadoresActivos: 0,
    saldoCirculacion: 0,
    apuestasHoy: 0,
    puestosActivos: 0
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Sistema Casino funcionando en http://localhost:${PORT}`);
});
