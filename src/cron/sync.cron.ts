import cron from 'node-cron';
import { syncTeams, syncMatches } from '../services/sports-api.service';

export const initCronJobs = () => {
  
  //  Sincronización de Partidos (Goles, tiempos, estados "En Vivo")
  // Corre cada 1 minuto (* * * * *) para mantener el Prode actualizado en tiempo real.
  cron.schedule('* * * * *', async () => {
    console.log(`⏱️ [${new Date().toISOString()}] [CRON - Partidos] Iniciando sincronización en vivo...`);
    
    try {
      await syncMatches();
      console.log(`✅ [${new Date().toISOString()}] [CRON - Partidos] Actualización en vivo completada.`);
    } catch (error) {
      console.error(`❌ [${new Date().toISOString()}] [CRON - Partidos] Error al actualizar en vivo:`, error);
    }
  });

  //  Sincronización de Equipos (Nombres, banderas, grupos)
  // Corre TODOS los días a las 03:00 AM (0 3 * * *) para evitar llamados innecesarios a la API.
  cron.schedule('0 3 * * *', async () => {
    console.log(`📅 [${new Date().toISOString()}] [CRON - Equipos] Iniciando mantenimiento diario de países...`);
    
    try {
      await syncTeams();
      console.log(`✅ [${new Date().toISOString()}] [CRON - Equipos] Base de datos de equipos sincronizada con éxito.`);
    } catch (error) {
      console.error(`❌ [${new Date().toISOString()}] [CRON - Equipos] Error en mantenimiento diario:`, error);
    }
  });
  
  console.log('✅ Sistema de Cron Jobs configurado correctamente:');
  console.log('   -> Partidos: cada 1 minuto.');
  console.log('   -> Equipos: todos los días a las 3:00 AM.');
};