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

const router = express.Router();

// Route لإضافة عملة جديدة
router.post("/add-currency", addCurrency);

// Route لتعديل سجل في جدول العملات (الاسم والكود فقط)
router.put("/update-currency/:carID", updateCurrency);

// Route لحذف سجل من جدول العملات (فقط إذا كان الرصيد = 0)
router.delete("/delete-currency/:carID", deleteCurrency);

// عرض جميع العملات
router.get("/currencies", getCurrencies);

// عرض عملة محددة
router.get("/currency/:carID", getCurrency);

// إضافة رصيد للعملة وتسجيل حركة خزينة
router.post("/add-balance/:carID", addCurrencyBalance);

// تحديث رصيد العملة إلى قيمة محددة
router.put("/update-balance/:carID", updateCurrencyBalance);

export default router;