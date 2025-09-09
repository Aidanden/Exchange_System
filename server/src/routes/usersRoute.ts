import express from 'express';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  getRoles, 
  resetUserPassword 
} from '../controllers/usersController';
import { authenticateToken, requirePermissions } from '../middleware/auth';

const router = express.Router();

// الحصول على جميع المستخدمين
router.get('/users', 
  authenticateToken, 
  requirePermissions(['users.view']), 
  getUsers
);

// إضافة مستخدم جديد
router.post('/users', 
  authenticateToken, 
  requirePermissions(['users.create']), 
  createUser
);

// تحديث مستخدم
router.put('/users/:id', 
  authenticateToken, 
  requirePermissions(['users.edit']), 
  updateUser
);

// حذف مستخدم
router.delete('/users/:id', 
  authenticateToken, 
  requirePermissions(['users.delete']), 
  deleteUser
);

// إعادة تعيين كلمة مرور المستخدم
router.put('/users/:id/reset-password', 
  authenticateToken, 
  requirePermissions(['users.edit']), 
  resetUserPassword
);

// الحصول على الأدوار
router.get('/roles', 
  authenticateToken, 
  getRoles
);

export default router;
