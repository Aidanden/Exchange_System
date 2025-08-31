import express from "express";
import {
  createBuy,
  listBuys,
  getBuyById,
  updateBuy,
  deleteBuy,
  getNextBillNumber,
} from "../controllers/buysController";

const router = express.Router();

// إنشاء عملية شراء جديدة
router.post("/", createBuy);

// الحصول على قائمة عمليات الشراء
router.get("/", listBuys);

// الحصول على رقم الفاتورة التالي
router.get("/next-bill-number", getNextBillNumber);

// الحصول على عملية شراء واحدة
router.get("/:id", getBuyById);

// تعديل عملية شراء
router.put("/:id", updateBuy);

// حذف عملية شراء
router.delete("/:id", deleteBuy);

export default router;
