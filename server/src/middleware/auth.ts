import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    permissions: string[];
  };
}

// Middleware للتحقق من صحة JWT token
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ 
      success: false, 
      message: 'رمز الوصول مطلوب' 
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    
    // التحقق من وجود الجلسة في قاعدة البيانات
    const session = await prisma.userSessions.findFirst({
      where: {
        Token: token,
        IsActive: true,
        ExpiresAt: {
          gt: new Date()
        }
      },
      include: {
        User: {
          include: {
            Role: true
          }
        }
      }
    });

    if (!session || !session.User.IsActive) {
      res.status(401).json({ 
        success: false, 
        message: 'جلسة غير صالحة أو منتهية الصلاحية' 
      });
      return;
    }

    req.user = {
      id: session.User.UserID,
      username: session.User.UserName,
      role: session.User.Role.RoleName,
      permissions: session.User.Role.Permissions as string[]
    };

    next();
  } catch (error) {
    res.status(403).json({ 
      success: false, 
      message: 'رمز وصول غير صالح' 
    });
    return;
  }
};

// Middleware للتحقق من الصلاحيات
export const requirePermissions = (requiredPermissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'يجب تسجيل الدخول أولاً' 
      });
      return;
    }

    // مدير النظام له جميع الصلاحيات
    if (req.user.role === 'admin') {
      next();
      return;
    }

    // التحقق من وجود الصلاحيات المطلوبة
    const hasAllPermissions = requiredPermissions.every(permission =>
      req.user!.permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      res.status(403).json({ 
        success: false, 
        message: 'ليس لديك الصلاحيات الكافية للوصول إلى هذا المورد' 
      });
      return;
    }

    next();
  };
};

// Middleware للتحقق من الدور
export const requireRole = (requiredRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ 
        success: false, 
        message: 'يجب تسجيل الدخول أولاً' 
      });
      return;
    }

    if (!requiredRoles.includes(req.user.role)) {
      res.status(403).json({ 
        success: false, 
        message: 'ليس لديك الدور المطلوب للوصول إلى هذا المورد' 
      });
      return;
    }

    next();
  };
};

export { AuthRequest };
