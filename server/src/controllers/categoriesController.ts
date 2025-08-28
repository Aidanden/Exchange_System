import { Request, Response } from "express";
import prisma from "../models/prismaClient";// استيراد الاتصال بـ Prisma


// دالة جلب التصنيفات من قاعدة البيانات
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.categories.findMany(); // جلب التصنيفات من قاعدة البيانات
    res.json(categories); // إرجاع التصنيفات
  } catch (error) {
    res.status(500).json({ error: "حدث خطأ أثناء جلب التصنيفات" });
  }
};
