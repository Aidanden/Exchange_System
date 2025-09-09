import express from "express";
import { getCategories } from "../controllers/categoriesController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

// نقطة النهاية لجلب التصنيفات
router.get("/categories", authenticateToken, getCategories);

export default router;
