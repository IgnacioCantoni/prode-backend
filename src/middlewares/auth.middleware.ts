import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extendemos la request para poder inyectar el userId
export interface AuthRequest extends Request {
  userId?: string;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction): any => {
  // ✅ Leemos el token desde la cookie httpOnly (ya no del header Authorization)
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};