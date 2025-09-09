import express from "express";
import {
  createBuy,
  listBuys,
  getBuyById,
  updateBuy,
  deleteBuy,
  getNextBillNumber,
} from "../controllers/buysController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// إنشاء عملية شراء جديدة
router.post("/", authenticateToken, createBuy);

// الحصول على قائمة عمليات الشراء
router.get("/", authenticateToken, listBuys);

// الحصول على رقم الفاتورة التالي
router.get("/next-bill-number", authenticateToken, getNextBillNumber);

// الحصول على عملية شراء واحدة
router.get("/:id", authenticateToken, getBuyById);

// تعديل عملية شراء
router.put("/:id", authenticateToken, updateBuy);

// حذف عملية شراء
router.delete("/:id", authenticateToken, deleteBuy);

export default router;
