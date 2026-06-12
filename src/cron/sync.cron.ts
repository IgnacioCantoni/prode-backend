import cron from 'node-cron';
import { syncTeams, syncMatches } from '../services/sports-api.service';

export const initCronJobs = () => {
  
  cron.schedule('* * * * *', async () => {
    console.log(`⏱️ [${new Date().toISOString()}] Iniciando sincronización de partidos...`);
    
    try {
      await syncTeams();
      await syncMatches();
      
      console.log(`✅ [${new Date().toISOString()}] Sincronización completada con éxito.`);
    } catch (error) {
      console.error(`❌ [${new Date().toISOString()}] Error en la sincronización:`, error);
    }
  });
  
  console.log('✅ Cron job configurado para ejecutarse cada minuto.');
};