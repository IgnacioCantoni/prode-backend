import cron from 'node-cron';
import { syncTeams, syncMatches } from '../services/sports-api.service';

export const initCronJobs = () => {
  
  // ⏱️ CRON 1: Sincronización de Partidos 
  // Corre cada 5 minutos (*/5 * * * *) trayendo todo y filtrando en nuestro back.
  cron.schedule('*/5 * * * *', async () => {
    console.log(`⏱️ [${new Date().toISOString()}] [CRON - Partidos] Buscando actualizaciones...`);
    
    try {
      await syncMatches();
      console.log(`✅ [${new Date().toISOString()}] [CRON - Partidos] Actualización completada.`);
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