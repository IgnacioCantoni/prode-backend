import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import prodeRoutes from './routes/prode.routes';
import { initCronJobs } from './cron/sync.cron';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// ✅ CORS: permite cookies desde el frontend (reemplazá la URL por la tuya)
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true,  // necesario para que Angular pueda enviar/recibir cookies
}));

app.use(express.json());
app.use(cookieParser()); // ✅ necesario para leer req.cookies

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API del PRODE funcionando perfecto' });
});

// Rutas del PRODE
app.use('/api/prode', prodeRoutes);

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
  initCronJobs();
});