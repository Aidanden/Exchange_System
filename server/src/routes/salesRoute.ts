import express from "express";
import {
  createSale,
  listSales,
  getSale,
  updateSale,
  deleteSale,
} from "../controllers/salesController";

const router = express.Router();

// GET /api/sales - قائمة المبيعات
router.get("/", listSales);

// GET /api/sales/:id - تفاصيل عملية بيع واحدة
router.get("/:id", getSale);

// POST /api/sales - إنشاء عملية بيع جديدة
router.post("/", createSale);

// PUT /api/sales/:id - تحديث عملية بيع
router.put("/:id", updateSale);

// DELETE /api/sales/:id - حذف عملية بيع
router.delete("/:id", deleteSale);

export default router;
