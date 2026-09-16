const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

if (!process.env.DATABASE_URL) {
  console.error('Falta la variable de entorno DATABASE_URL.');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Comprueba la conexion con PostgreSQL.
app.get('/api/salud', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() AS fecha');
    res.json({ ok: true, baseDeDatos: 'PostgreSQL', fecha: result.rows[0].fecha });
  } catch (error) {
    console.error('Error PostgreSQL:', error.message);
    res.status(500).json({ ok: false, error: 'No se pudo conectar con PostgreSQL.' });
  }
});

// Datos usados por el panel principal.
app.get('/api/estado', async (req, res) => {
  try {
    const [jugadores, saldo, apuestas, puestos] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS total FROM players WHERE status = 'active'"),
      pool.query("SELECT COALESCE(SUM(balance), 0)::bigint AS total FROM players WHERE status = 'active'"),
      pool.query("SELECT COUNT(*)::int AS total FROM transactions WHERE type = 'bet' AND created_at >= CURRENT_DATE"),
      pool.query("SELECT COUNT(*)::int AS total FROM stations WHERE status = 'active'")
    ]);

    res.json({
      jugadoresActivos: jugadores.rows[0].total,
      saldoCirculacion: Number(saldo.rows[0].total),
      apuestasHoy: apuestas.rows[0].total,
      puestosActivos: puestos.rows[0].total
    });
  } catch (error) {
    console.error('Error cargando estado:', error.message);
    res.status(500).json({ error: 'No se pudo cargar el estado del casino.' });
  }
});

// Registra un jugador y deja constancia del ingreso en transactions.
app.post('/api/jugadores', async (req, res) => {
  const client = await pool.connect();

  try {
    const identificador = String(req.body.identificador || '').trim();
    const saldoInicial = Number(req.body.saldoInicial);

    if (!identificador) {
      return res.status(400).json({ error: 'El identificador es obligatorio.' });
    }

    if (!Number.isSafeInteger(saldoInicial) || saldoInicial < 0) {
      return res.status(400).json({ error: 'El saldo inicial debe ser un entero mayor o igual a 0.' });
    }

    await client.query('BEGIN');

    const jugador = await client.query(
      `INSERT INTO players (qr_code, initial_balance, balance, status)
       VALUES ($1, $2, $2, 'active')
       RETURNING id, qr_code, initial_balance, balance, status, created_at`,
      [identificador, saldoInicial]
    );

    const nuevoJugador = jugador.rows[0];

    await client.query(
      `INSERT INTO transactions
       (player_id, type, stake, payout, amount_delta, balance_before, balance_after)
       VALUES ($1, 'entry', 0, 0, $2, 0, $2)`,
      [nuevoJugador.id, saldoInicial]
    );

    await client.query('COMMIT');

    res.status(201).json({
      mensaje: 'Jugador registrado correctamente.',
      jugador: {
        ...nuevoJugador,
        initial_balance: Number(nuevoJugador.initial_balance),
        balance: Number(nuevoJugador.balance)
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error registrando jugador:', error.message);

    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un jugador con ese identificador.' });
    }

    res.status(500).json({ error: 'No se pudo registrar el jugador.' });
  } finally {
    client.release();
  }
});

// Consulta un jugador por su codigo/identificador QR.
app.get('/api/jugadores/:qrCode', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, qr_code, initial_balance, balance, status, created_at
       FROM players
       WHERE qr_code = $1`,
      [req.params.qrCode]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Jugador no encontrado.' });
    }

    const jugador = result.rows[0];
    res.json({
      jugador: {
        ...jugador,
        initial_balance: Number(jugador.initial_balance),
        balance: Number(jugador.balance)
      }
    });
  } catch (error) {
    console.error('Error buscando jugador:', error.message);
    res.status(500).json({ error: 'No se pudo consultar el jugador.' });
  }
});

// Lista los movimientos mas recientes.
app.get('/api/transacciones', async (req, res) => {
  try {
    const limite = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const result = await pool.query(
      `SELECT t.id, t.type, t.stake, t.payout, t.amount_delta,
              t.balance_before, t.balance_after, t.created_at,
              p.qr_code AS jugador, s.name AS puesto
       FROM transactions t
       JOIN players p ON p.id = t.player_id
       LEFT JOIN stations s ON s.id = t.station_id
       ORDER BY t.created_at DESC
       LIMIT $1`,
      [limite]
    );

    res.json({ transacciones: result.rows });
  } catch (error) {
    console.error('Error cargando transacciones:', error.message);
    res.status(500).json({ error: 'No se pudieron cargar las transacciones.' });
  }
});

// Express 5 requiere una ruta wildcard con nombre.
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Sistema Casino funcionando en el puerto ${PORT}`);
});
