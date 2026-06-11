import cron from 'node-cron';
import { syncTeams, syncMatches } from '../services/sports-api.service';

export const initCronJobs = () => {
  // Se ejecuta todos los días a las 00:00 AM para actualizar el fixture
  cron.schedule('0 0 * * *', async () => {
    console.log('📅 Ejecutando sincronización diaria del fixture...');
    await syncTeams();
    await syncMatches();
  });
  
  console.log('✅ Cron job diario configurado.');
};