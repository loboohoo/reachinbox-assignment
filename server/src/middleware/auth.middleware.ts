import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    avatar?: string | null;
  };
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // 1. Retrieve token from HTTP-only cookie or Authorization Bearer header
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
      return;
    }

    // 2. Verify JWT token signature
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'reachinbox_default_secret'
    ) as { userId: string; email: string };

    // 3. Retrieve user from PostgreSQL
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, avatar: true },
    });

    if (!user) {
      res.status(401).json({ success: false, error: 'User account not found.' });
      return;
    }

    req.user = user;
    next();
  } catch (error: any) {
    res.status(401).json({ success: false, error: 'Invalid or expired session token.' });
  }
}
