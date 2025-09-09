import express from "express";
import {
  createSale,
  listSales,
  getSale,
  updateSale,
  deleteSale,
} from "../controllers/salesController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// GET /api/sales - قائمة المبيعات
router.get("/", authenticateToken, listSales);

// GET /api/sales/:id - تفاصيل عملية بيع واحدة
router.get("/:id", authenticateToken, getSale);

// POST /api/sales - إنشاء عملية بيع جديدة
router.post("/", authenticateToken, createSale);

// PUT /api/sales/:id - تحديث عملية بيع
router.put("/:id", authenticateToken, updateSale);

// DELETE /api/sales/:id - حذف عملية بيع
router.delete("/:id", authenticateToken, deleteSale);

export default router;
