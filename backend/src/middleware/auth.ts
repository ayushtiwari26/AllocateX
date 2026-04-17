import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebase';
import { User } from '../models';

const decodeLegacyToken = async (token: string) => {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [userId, email] = decoded.split(':');

    if (!userId || !email) {
      return null;
    }

    const user = await User.findOne({ where: { id: userId, email } });
    if (!user || !user.isActive) {
      return null;
    }

    return {
      uid: user.firebaseUid || userId,
      email: user.email,
      role: user.role,
      userId: user.id,
    };
  } catch (error) {
    console.error('Legacy token decode failed:', error);
    return null;
  }
};

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    role: string;
    userId: string;
  };
}

export const verifyFirebaseToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized - No token provided' });
      return;
    }

    const token = authHeader.split('Bearer ')[1];

    // First try our legacy token
    const legacyUser = await decodeLegacyToken(token);
    if (legacyUser) {
      req.user = legacyUser;
      next();
      return;
    }

    try {
      // Verify Firebase ID token as fallback
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Find user in database
      const user = await User.findOne({
        where: { firebaseUid: decodedToken.uid },
      });

      if (!user || !user.isActive) {
        res.status(403).json({ error: 'User not found or inactive' });
        return;
      }

      // Attach user info to request
      req.user = {
        uid: decodedToken.uid,
        email: user.email,
        role: user.role,
        userId: user.id,
      };

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
      return;
    }

    next();
  };
};
