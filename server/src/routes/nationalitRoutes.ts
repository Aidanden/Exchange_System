import express from 'express';
import {
  getNationalits,
  createNationalit,
  updateNationalit,
  deleteNationalit,
  searchNationalit,
} from '../controllers/nationalitsController';

const router = express.Router();

// تعريف المسارات
router.get('/nationalits', getNationalits); // جلب الجنسيات
router.post('/nationalits', createNationalit); // إضافة جنسية
router.put('/nationalits/:id', updateNationalit); // تعديل جنسية
router.delete('/nationalits/:id', deleteNationalit); // حذف جنسية

router.get('/search-nationalit', searchNationalit); // جلب الجنسيات بستخدام الاسم

export default router;
