import { Request, Response } from "express";
import prisma from "../models/prismaClient";// استيراد الاتصال بـ Prisma


// جلب كل الجنسيات
export const getNationalits = async (req: Request, res: Response) => {
  try {
    const nationalits = await prisma.nationalits.findMany({where:{Exist:true},
      include: { Categorie: true },
    });
    res.json(nationalits);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: " error" });
  }
};

// إضافة جنسية جديدة
export const createNationalit = async (req: Request, res: Response): Promise<void> => {
  const { Nationality, CatID, UserID } = req.body;

  try {
    // التحقق من إدخال الحقول المطلوبة
    if (!Nationality || !CatID) {
      res.status(400).json({ error: "الرجاء إدخال جميع الحقول المطلوبة." });
      return;
    }

    // التحقق من أن CatID موجود في جدول الفئات
    const categoryExists = await prisma.categories.findUnique({
      where: { CatID },
    });

    if (!categoryExists) {
      res.status(400).json({ error: "الفئة غير موجودة." });
      return;
    }

    // إنشاء السجل
    const newNationalit = await prisma.nationalits.create({
      data: {
        Nationality,
        CatID,
        Exist: true,
        UserID:"9e2895ae-4afe-4ff2-b3b3-be15cf1c82d6", // إذا كان الحقل اختيارياً، يمكنك تخطيه إذا لم يتم تمريره
      },
    });

    res.status(201).json(newNationalit);
  } catch (error) {
    console.error("Error creating nationality:", error);
    res.status(500).json({ error: "خطأ داخلي في الخادم." });
  }
};


// تعديل جنسية
export const updateNationalit = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { Nationality, CatID, UserID } = req.body;
  try {
    const updatedNationalit = await prisma.nationalits.update({
      where: { NatID: id },
      data: { Nationality, CatID, UserID:"9e2895ae-4afe-4ff2-b3b3-be15cf1c82d6" },
    });
    res.json(updatedNationalit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// حذف جنسية
export const deleteNationalit = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    //await prisma.nationalits.delete({ where: { NatID: id } });
    const updatedNationalit = await prisma.nationalits.update({
      where: { NatID: id },
      data: { Exist:false, UserID:"9e2895ae-4afe-4ff2-b3b3-be15cf1c82d6" },
    });
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// البحث بستخدام

export const searchNationalit = async (req: Request, res: Response) => {
  const { searchQuery } = req.query; // الحصول على استعلام البحث من query params

  try {
    const nationalits = await prisma.nationalits.findMany({
      where: {
        Nationality: {
          contains: searchQuery as string, // البحث عن النص داخل الحقول
          mode: "insensitive", // تجاهل حالة الأحرف (اختياري)
        },
      },
    });

    res.status(200).json(nationalits); // إرسال البيانات في الرد
  } catch (error) {
    console.error("Error searching nationalities:", error);
    res.status(500).json({ error: "An error occurred while searching." });
  }
};
