import express from "express";
import { getCategories } from "../controllers/categoriesController";

const router = express.Router();

// نقطة النهاية لجلب التصنيفات
router.get("/categories", getCategories);

export default router;
