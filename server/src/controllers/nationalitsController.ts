import { Request, Response } from "express";
import prisma from "../models/prismaClient";// استيراد الاتصال بـ Prisma
import { AuthRequest } from "../middleware/auth";


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
export const createNationalit = async (req: AuthRequest, res: Response): Promise<void> => {
  const { Nationality, CatID } = req.body;

  // الحصول على UserID من المستخدم المسجل دخوله
  const UserID = req.user?.id;
  if (!UserID) {
    res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
    return;
  }

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
        UserID: UserID,
      },
      include: { Categorie: true }, // إضافة العلاقات
    });

    res.status(201).json(newNationalit);
  } catch (error) {
    console.error("Error creating nationality:", error);
    res.status(500).json({ error: "خطأ داخلي في الخادم." });
  }
};


// تعديل جنسية
export const updateNationalit = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { Nationality, CatID } = req.body;
  const UserID = req.user?.id || "admin_user_001";
  try {
    const updatedNationalit = await prisma.nationalits.update({
      where: { NatID: id },
      data: { Nationality, CatID, UserID },
      include: { Categorie: true }, // إضافة العلاقات
    });
    res.json(updatedNationalit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// حذف جنسية
export const deleteNationalit = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    // التحقق من وجود السجل أولاً
    const existingRecord = await prisma.nationalits.findUnique({
      where: { NatID: id }
    });
    
    if (!existingRecord) {
      res.status(404).json({ error: "الجنسية غير موجودة" });
      return;
    }

    // تحديث حالة الوجود إلى false (soft delete)
    await prisma.nationalits.update({
      where: { NatID: id },
      data: { Exist: false, UserID: req.user?.id || "admin_user_001" },
    });
    
    // إرجاع استجابة نجاح مع رسالة
    res.json({ success: true, message: "تم حذف الجنسية بنجاح" });
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
