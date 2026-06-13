import cron from 'node-cron';
import { syncTeams, syncMatches } from '../services/sports-api.service';
import { calculatePointsForMatch } from '../services/points.service'; // ✅ Importamos el servicio de puntos
import pool from '../config/database'; // ✅ Importamos la base de datos

export const initCronJobs = () => {
  
  // ⏱️ CRON 1: Sincronización de Partidos 
  // Corre cada 5 minutos (*/5 * * * *) trayendo todo y filtrando en nuestro back.
  cron.schedule('*/5 * * * *', async () => {
    console.log(`⏱️ [${new Date().toISOString()}] [CRON - Partidos] Buscando actualizaciones...`);
    
    try {
      // 1. Buscamos el fixture en la API externa y actualizamos la DB
      await syncMatches();
      
      // 2. Revisamos si hay partidos en juego para actualizar los puntos de los usuarios
      const liveMatch = await pool.query("SELECT id FROM matches WHERE status = 'IN_PLAY' OR status = 'FINISHED'");
      
      if (liveMatch.rows.length > 0) {
        for (const match of liveMatch.rows) {
          await calculatePointsForMatch(match.id);
        }
      }

      console.log(`✅ [${new Date().toISOString()}] [CRON - Partidos] Actualización y puntos completados.`);
    } catch (error) {
      console.error(`❌ [${new Date().toISOString()}] [CRON - Partidos] Error:`, error);
    }
  });

  // 📅 CRON 2: Sincronización de Equipos
  // Sigue corriendo a las 03:00 AM todos los días.
  cron.schedule('0 3 * * *', async () => {
    console.log(`📅 [${new Date().toISOString()}] [CRON - Equipos] Mantenimiento de países...`);
    
    try {
      await syncTeams();
      console.log(`✅ [${new Date().toISOString()}] [CRON - Equipos] Completado.`);
    } catch (error) {
      console.error(`❌ [${new Date().toISOString()}] [CRON - Equipos] Error:`, error);
    }
  });
};