import { Request, Response } from "express";
import prisma from "../models/prismaClient"; // استيراد الاتصال بـ Prisma
import { Decimal } from "decimal.js";
import { AuthRequest } from "../middleware/auth";
import { randomUUID } from "crypto";

// إضافة عملة جديدة

export const addCurrency = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      Carrency,
      CarrencyCode,
    } = req.body;

    // الحصول على UserID من المستخدم المسجل دخوله
    const UserID = req.user?.id;
    if (!UserID) {
      res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
      return;
    }

    // استخدام معاملة Prisma
    const result = await prisma.carrences.create({
      data: {
        Carrency,
        CarrencyCode: CarrencyCode ?? "",
        // الرصيد عند إنشاء العملة يكون دائماً 0
        Balance: new Decimal(0),
        UserID: UserID,
        Exist: true,
      },
    });

    res.status(201).json({
      message: "تمت إضافة العملة وتحديث الأسعار المرتبطة بنجاح!",
      newCurrency: result,
    });
  } catch (error) {
    console.error("Error adding currency:", error);
    res.status(500).json({ error: "حدث خطأ أثناء إضافة العملة." });
  }
};

// تم إلغاء نظام التسعير: لا توجد عمليات تسعير الآن لأن السعر متغير

// تعديل سجل في جدول العملات
export const updateCurrency = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { carID } = req.params;
    const { Carrency, CarrencyCode } = req.body; // تجاهل أي محاولة لتعديل الرصيد

    // تحديث سجل العملة
    const updatedCurrency = await prisma.carrences.update({
      where: { CarID: carID },
      data: {
        Carrency,
        CarrencyCode: CarrencyCode ?? "",
        // لا نسمح بتعديل الرصيد عبر هذا المسار
      },
    });

    res.status(200).json({
      message: "تم تعديل العملة بنجاح!",
      updatedCurrency,
    });
  } catch (error) {
    console.error("Error updating currency:", error);
    res.status(500).json({ error: "حدث خطأ أثناء تعديل العملة." });
  }
};

// حذف سجل من جدول العملات
export const deleteCurrency = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const paramCarIdRaw = (req.params.carID ?? "").toString();
    const queryCarIdRaw = (typeof req.query.carID === "string" ? req.query.carID : "").toString();
    let carID = (paramCarIdRaw || queryCarIdRaw).trim();
    if (carID.startsWith(":")) {
      carID = carID.slice(1);
    }
    try {
      carID = decodeURIComponent(carID);
    } catch {}
    // منع الحذف إذا كان هناك رصيد
    const current = await prisma.carrences.findUnique({ where: { CarID: carID } });
    if (!current) {
      res.status(404).json({ message: "العملة غير موجودة." });
      return;
    }
    if (current.Balance && current.Balance.gt(new Decimal(0))) {
      res.status(400).json({ message: "لا يمكن الحذف لوجود رصيد في هذه العملة." });
      return;
    }

    await prisma.carrences.update({
      where: { CarID: carID },
      data: { Exist: false },
    });

    res
      .status(200)
      .json({ message: "تم تعديل حالة العملة إلى غير موجودة بنجاح!" });
  } catch (error) {
    console.error("Error updating currency status:", error);
    res.status(500).json({ error: "حدث خطأ أثناء تعديل حالة العملة." });
  }
};

// عرض جدول العملات كامل
export const getCurrencies = async (req: Request, res: Response) => {
  try {
    // استعلام عن جميع العملات
    const currencies = await prisma.carrences.findMany({
      where: {
        Exist: true,
      },
    });
    res.status(200).json(currencies);
  } catch (error) {
    console.error("Error fetching currencies:", error);
    res.status(500).json({ error: "فشل في جلب بيانات العملات." });
  }
};

// الحصول على عملة محددة
export const getCurrency = async (req: Request, res: Response) => {
  try {
    const paramCarIdRaw = (req.params.carID ?? "").toString();
    const queryCarIdRaw = (typeof req.query.carID === "string" ? req.query.carID : "").toString();
    let carID = (paramCarIdRaw || queryCarIdRaw).trim();
    // معالجة حالات وصول ":id" حرفيًا من العميل
    if (carID.startsWith(":")) {
      carID = carID.slice(1);
    }
    try {
      carID = decodeURIComponent(carID);
    } catch {}

    
    const currency = await prisma.carrences.findUnique({
      where: { CarID: carID },
    });

    if (!currency || currency.Exist === false) {
      res.status(404).json({ message: "العملة غير موجودة.", carID });
      return;
    }
    res.status(200).json(currency);
  } catch (error) {
    console.error("Error fetching currency:", error);
    res.status(500).json({ error: "فشل في جلب بيانات العملة." });
  }
};

// إضافة رصيد إلى عملة مع تسجيل حركة خزينة
export const addCurrencyBalance = async (
  req: Request,
  res: Response
) => {
  try {
    const paramCarIdRaw = (req.params.carID ?? "").toString();
    const queryCarIdRaw = (typeof req.query.carID === "string" ? req.query.carID : "").toString();
    let carID = (paramCarIdRaw || queryCarIdRaw).trim();
    if (carID.startsWith(":")) carID = carID.slice(1);
    try { carID = decodeURIComponent(carID); } catch {}

    const amountRaw = req.body?.amount;
    const amount = Number(amountRaw);
    if (!carID) {
      res.status(400).json({ message: "carID مطلوب" });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      res.status(400).json({ message: "قيمة غير صالحة للمبلغ" });
      return;
    }

    // جلب العملة الحالية
    const current = await prisma.carrences.findUnique({ where: { CarID: carID } });
    if (!current || current.Exist === false) {
      res.status(404).json({ message: "العملة غير موجودة." });
      return;
    }

    // إجراء معاملة: تحديث رصيد العملة وتسجيل حركة الخزينة
    const result = await prisma.$transaction(async (tx) => {
      const openBalance = current.Balance;
      const debit = new Decimal(amount);
      const credit = new Decimal(0);
      const finalBalance = openBalance.plus(debit);

      const updatedCurrency = await tx.carrences.update({
        where: { CarID: carID },
        data: { Balance: finalBalance },
      });

      const treasuryMovement = await tx.treasuryMovements.create({
        data: {
          TreaMoveID: randomUUID(),
          CarID: carID,
          OpenBalance: openBalance,
          Cridit: credit,
          Debit: debit,
          FinalBalance: finalBalance,
          UserID: current.UserID,
          Exist: true,
          Statment: "تم اضافة رصيد من شاشة إدارة العملات",
          // ملاحظة: لا يوجد حقل للملاحظة/البيان في النموذج حاليًا
        } as any,
      });

      return { updatedCurrency, treasuryMovement };
    });

    res.status(200).json({
      message: "تمت إضافة الرصيد وتسجيل الحركة بنجاح.",
      ...result,
    });
  } catch (error) {
    console.error("Error adding balance:", error);
    res.status(500).json({ error: "حدث خطأ أثناء إضافة الرصيد." });
  }
};

// تحديث رصيد العملة إلى قيمة محددة
export const updateCurrencyBalance = async (
  req: Request,
  res: Response
) => {
  try {
    const paramCarIdRaw = (req.params.carID ?? "").toString();
    const queryCarIdRaw = (typeof req.query.carID === "string" ? req.query.carID : "").toString();
    let carID = (paramCarIdRaw || queryCarIdRaw).trim();
    if (carID.startsWith(":")) carID = carID.slice(1);
    try { carID = decodeURIComponent(carID); } catch {}

    const newBalanceRaw = req.body?.newBalance;
    const newBalance = Number(newBalanceRaw);
    if (!carID) {
      res.status(400).json({ message: "carID مطلوب" });
      return;
    }
    if (!Number.isFinite(newBalance) || newBalance < 0) {
      res.status(400).json({ message: "قيمة غير صالحة للرصيد" });
      return;
    }

    // جلب العملة الحالية
    const current = await prisma.carrences.findUnique({ where: { CarID: carID } });
    if (!current || current.Exist === false) {
      res.status(404).json({ message: "العملة غير موجودة." });
      return;
    }

    // تحديث رصيد العملة
    const updatedCurrency = await prisma.carrences.update({
      where: { CarID: carID },
      data: { Balance: new Decimal(newBalance) },
    });

    res.status(200).json({
      message: "تم تحديث رصيد العملة بنجاح.",
      updatedCurrency,
    });
  } catch (error) {
    console.error("Error updating balance:", error);
    res.status(500).json({ error: "حدث خطأ أثناء تحديث الرصيد." });
  }
};
