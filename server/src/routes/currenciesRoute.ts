import express from "express";
import {
  addCurrency,
  updateCurrency,
  deleteCurrency,
  getCurrencies,
  getCurrency,
  addCurrencyBalance,
  updateCurrencyBalance,
} from "../controllers/currenciesController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// Route لإضافة عملة جديدة
router.post("/add-currency", authenticateToken, addCurrency);

// Route لتعديل سجل في جدول العملات (الاسم والكود فقط)
router.put("/update-currency/:carID", authenticateToken, updateCurrency);

// Route لحذف سجل من جدول العملات (فقط إذا كان الرصيد = 0)
router.delete("/delete-currency/:carID", authenticateToken, deleteCurrency);

// عرض جميع العملات
router.get("/currencies", authenticateToken, getCurrencies);

// عرض عملة محددة
router.get("/currency/:carID", authenticateToken, getCurrency);

// إضافة رصيد للعملة وتسجيل حركة خزينة
router.post("/add-balance/:carID", authenticateToken, addCurrencyBalance);

// تحديث رصيد العملة إلى قيمة محددة
router.put("/update-balance/:carID", authenticateToken, updateCurrencyBalance);

export default router;