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
const allowedOrigins = [
  'http://localhost:4200', 
  process.env.FRONTEND_URL // ¡Que se aseguren de que en Railway esta URL NO tenga una barra al final!
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true // ESTO ES VITAL PARA LAS COOKIES
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