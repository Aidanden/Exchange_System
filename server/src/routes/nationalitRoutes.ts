import express from 'express';
import {
  getNationalits,
  createNationalit,
  updateNationalit,
  deleteNationalit,
  searchNationalit,
} from '../controllers/nationalitsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// تعريف المسارات
router.get('/nationalits', authenticateToken, getNationalits); // جلب الجنسيات
router.post('/nationalits', authenticateToken, createNationalit); // إضافة جنسية
router.put('/nationalits/:id', authenticateToken, updateNationalit); // تعديل جنسية
router.delete('/nationalits/:id', authenticateToken, deleteNationalit); // حذف جنسية

router.get('/search-nationalit', authenticateToken, searchNationalit); // جلب الجنسيات بستخدام الاسم

export default router;
