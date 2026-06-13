import { Router, Response } from 'express';
import jwt from 'jsonwebtoken';
import { findOrCreateUser } from '../services/user.service';
import { savePrediction } from '../services/prediction.service';
import { syncTeams, syncMatches, syncLiveScores } from '../services/sports-api.service';
import { calculatePointsForMatch } from '../services/points.service';
import pool from '../config/database';

import { verifyToken, AuthRequest } from '../middlewares/auth.middleware';

const router = Router();

// ─── AUTH ────────────────────────────────────────────────────────────────────

// Login: genera JWT y lo guarda como cookie httpOnly
router.post('/login', async (req, res): Promise<any> => {
  try {
    const { username, email } = req.body;

    if (!username || !email) {
      return res.status(400).json({ error: 'username y email son obligatorios.' });
    }

    const user = await findOrCreateUser(username, email);

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: '30d' }
    );

    // ✅ Seteamos el token como cookie httpOnly (JS del browser no puede leerla)
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // solo HTTPS en prod
      sameSite: 'none',  // protección CSRF básica
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días en ms
    });

    // Solo devolvemos el usuario, el token ya está en la cookie
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Error en el login' });
  }
});

// Logout: borra la cookie
router.post('/logout', (_req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
  });
  res.json({ message: 'Sesión cerrada correctamente.' });
});

// Devuelve el usuario autenticado (útil para que Angular rehidrate la sesión al recargar)
router.get('/me', verifyToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const result = await pool.query('SELECT id, username, email FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el usuario.' });
  }
});

// ─── SYNC (admin) ─────────────────────────────────────────────────────────────

router.post('/sync', async (req, res) => {
  try {
    console.log('--- Iniciando sincronización masiva ---');
    await syncTeams();
    await syncMatches();
    res.json({ message: 'Fixture y equipos cargados correctamente en la DB.' });
  } catch (error) {
    console.error('Error en sync:', error);
    res.status(500).json({ error: 'Fallo al sincronizar con API-Football' });
  }
});

// ─── PARTIDOS ─────────────────────────────────────────────────────────────────

router.get('/matches', async (req, res) => {
  try {

    // JOIN con teams para traer nombre completo y logo (bandera) de cada equipo
    const result = await pool.query(`
       SELECT
        m.id,
        m.date,
        m.status,
        m.stage        AS phase,
        m.home_score,
        m.away_score,
        ht.id          AS home_team_id,
        ht.name        AS home_team,
        ht.logo_url    AS home_flag,
        at.id          AS away_team_id,
        at.name        AS away_team,
        at.logo_url    AS away_flag,
        g.name         AS group_name
      FROM matches m
      JOIN teams ht ON m.home_team_id = ht.id
      JOIN teams at ON m.away_team_id = at.id
      LEFT JOIN group_teams gt ON gt.team_id = ht.id
      LEFT JOIN groups g ON g.id = gt.group_id
      ORDER BY m.date ASC
 `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener partidos:', error);
    res.status(500).json({ error: 'Error al obtener los partidos.' });
  }
});

// ─── PREDICCIONES ─────────────────────────────────────────────────────────────

// Guardar o modificar predicción (PROTEGIDA Y CON LÍMITE DE TIEMPO)
router.post('/predict', verifyToken, async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.userId!; 
    const { matchId, homeScore, awayScore, qualifierPick } = req.body;

    if (!matchId || homeScore === undefined || awayScore === undefined) {
      return res.status(400).json({ error: 'Faltan datos obligatorios para la predicción' });
    }

    // --- NUEVA REGLA: Validación de 1 hora ---
    
    // 1. Buscamos la fecha del partido en la base de datos
    const matchQuery = await pool.query('SELECT date FROM matches WHERE id = $1', [matchId]);
    
    if (matchQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Partido no encontrado' });
    }

    // 2. Calculamos la diferencia de tiempo
    const matchDate = new Date(matchQuery.rows[0].date);
    const now = new Date();
    
    // getTime() devuelve los milisegundos desde 1970. Restamos para saber cuánto falta.
    const timeDifferenceMs = matchDate.getTime() - now.getTime(); 
    const oneHourInMs = 60 * 60 * 1000; // 1 hora expresada en milisegundos

    // 3. El gran bloqueo: Si el partido ya empezó (diferencia negativa) o falta menos de 1 hora
    if (timeDifferenceMs < oneHourInMs) {
      return res.status(403).json({ 
        error: 'El tiempo límite expiró. Solo puedes guardar o modificar predicciones hasta 1 hora antes del partido.' 
      });
    }
    
    // ------------------------------------------

    // Si pasó el chequeo de tiempo, guardamos/actualizamos en la DB
    const prediction = await savePrediction(userId, matchId, homeScore, awayScore, qualifierPick);
    res.json({ message: 'Predicción registrada con éxito', prediction });
    
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Error al guardar la predicción' });
  }
});

// Predicciones del usuario logueado
router.get('/predictions/me', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const result = await pool.query('SELECT * FROM match_predictions WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener predicciones del usuario:', error);
    res.status(500).json({ error: 'Error al obtener tus predicciones.' });
  }
});

// Predicciones de todos los usuarios para un partido
router.get('/predictions/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;

    const query = `
      SELECT 
        p.id            AS prediction_id,
        p.home_score, 
        p.away_score, 
        p.qualifier_pick,
        p.points_earned,
        u.username
      FROM match_predictions p
      JOIN users u ON p.user_id = u.id
      WHERE p.match_id = $1
      ORDER BY p.points_earned DESC;
    `;

    const result = await pool.query(query, [matchId]);
    res.json(result.rows);
  } catch (error) {
    console.error(`Error al obtener predicciones del partido ${req.params.matchId}:`, error);
    res.status(500).json({ error: 'Error al obtener las predicciones del partido.' });
  }
});

// Traer el ranking de usuarios filtrado por torneo (Pública)
router.get('/ranking/:tournamentId', async (req, res) => {
  try {
    const { tournamentId } = req.params;

    const query = `
      SELECT 
        u.id, 
        u.username, 
        COALESCE(SUM(p.points_earned), 0) AS total_points
      FROM users u
      -- Cruzamos con predicciones
      LEFT JOIN match_predictions p ON u.id = p.user_id
      -- Cruzamos con partidos para saber a qué torneo pertenece esa predicción
      LEFT JOIN matches m ON p.match_id = m.id 
      WHERE m.tournament_id = $1 OR m.tournament_id IS NULL
      GROUP BY u.id, u.username
      ORDER BY total_points DESC;
    `;
    
    const result = await pool.query(query, [tournamentId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener el ranking:', error);
    res.status(500).json({ error: 'Error al obtener el ranking' });
  }
});

export default router;