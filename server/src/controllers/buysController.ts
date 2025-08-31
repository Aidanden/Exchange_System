import { Request, Response } from "express";
import prisma from "../models/prismaClient";
import { Decimal } from "decimal.js";

// دالة لتوليد رقم الفاتورة التالي
async function generateNextBillNum(): Promise<string> {
  try {
    // البحث عن آخر عملية شراء للحصول على أعلى رقم فاتورة
    const lastBuy = await prisma.buys.findFirst({
      where: { Exist: true },
      orderBy: { BillNum: 'desc' },
      select: { BillNum: true }
    });
    
    if (lastBuy && lastBuy.BillNum) {
      // تحويل رقم الفاتورة إلى رقم وإضافة 1
      const lastBillNum = parseInt(lastBuy.BillNum, 10);
      if (!isNaN(lastBillNum)) {
        return (lastBillNum + 1).toString();
      }
    }
    
    // إذا لم تكن هناك عمليات شراء سابقة، نبدأ من 1
    return "1";
  } catch (error) {
    console.error("Error generating bill number:", error);
    // في حالة الخطأ، نعيد رقم عشوائي
    return Date.now().toString();
  }
}

// إنشاء عملية شراء جديدة
export const createBuy = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      CarID,
      Value,
      BuyPrice,
      TotalPrice,
      CustID,
      FirstNum,
      LastNum,
      UserID,
      PaymentCurrencyID, // العملة المستخدمة في الدفع
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!CarID || !Value || !BuyPrice || !TotalPrice || !CustID || !UserID || !PaymentCurrencyID) {
      res.status(400).json({ error: "جميع الحقول مطلوبة" });
      return;
    }

    // بدء المعاملة
    const result = await prisma.$transaction(async (tx) => {
      // توليد رقم الفاتورة تلقائياً
      const generatedBillNum = await generateNextBillNum();
      
      // 1. إنشاء عملية الشراء
      const buy = await tx.buys.create({
        data: {
          BuyID: crypto.randomUUID(),
          BillNum: generatedBillNum,
          CarID,
          Value: new Decimal(Value),
          BuyPrice: new Decimal(BuyPrice),
          TotalPrice: new Decimal(TotalPrice),
          CustID,
          FirstNum: FirstNum || null,
          LastNum: LastNum || null,
          UserID,
          Exist: true,
        },
      });

      // 2. إضافة العملة المشتراة إلى الخزينة (debit)
      const buyCurrency = await tx.carrences.findUnique({
        where: { CarID },
      });

      if (!buyCurrency) {
        throw new Error("العملة المشتراة غير موجودة");
      }

      const buyOpenBalance = buyCurrency.Balance;
      const buyDebit = new Decimal(Value);
      const buyFinalBalance = buyOpenBalance.plus(buyDebit);

      await tx.treasuryMovements.create({
        data: {
          TreaMoveID: crypto.randomUUID(),
          CarID,
          OpenBalance: buyOpenBalance,
          Cridit: new Decimal(0),
          Debit: buyDebit,
          FinalBalance: buyFinalBalance,
          Statment: `شراء ${Value} ${buyCurrency.Carrency} - فاتورة رقم ${generatedBillNum}`,
          UserID,
          Exist: true,
        },
      });

      // 3. إنقاص العملة المستخدمة في الدفع من الخزينة (credit)
      const paymentCurrency = await tx.carrences.findUnique({
        where: { CarID: PaymentCurrencyID },
      });

      if (!paymentCurrency) {
        throw new Error("عملة الدفع غير موجودة");
      }

      const paymentOpenBalance = paymentCurrency.Balance;
      const paymentCredit = new Decimal(TotalPrice);
      const paymentFinalBalance = paymentOpenBalance.minus(paymentCredit);

      if (paymentFinalBalance.isNegative()) {
        throw new Error("رصيد عملة الدفع غير كافي");
      }

      await tx.treasuryMovements.create({
        data: {
          TreaMoveID: crypto.randomUUID(),
          CarID: PaymentCurrencyID,
          OpenBalance: paymentOpenBalance,
          Cridit: paymentCredit,
          Debit: new Decimal(0),
          FinalBalance: paymentFinalBalance,
          Statment: `دفع مقابل شراء ${Value} ${buyCurrency.Carrency} - فاتورة رقم ${generatedBillNum}`,
          UserID,
          Exist: true,
        },
      });

      // 4. تحديث أرصدة العملات
      await tx.carrences.update({
        where: { CarID },
        data: { Balance: buyFinalBalance },
      });

      await tx.carrences.update({
        where: { CarID: PaymentCurrencyID },
        data: { Balance: paymentFinalBalance },
      });

      return buy;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("createBuy error", error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  }
};

// الحصول على قائمة عمليات الشراء
export const listBuys = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Math.max(parseInt((req.query.page as string) || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt((req.query.limit as string) || "20", 10), 1), 200);
    const search = (req.query.search as string) || "";
    const custId = (req.query.custId as string) || undefined;
    const existParam = req.query.exist as string | undefined;
    const exist = existParam === undefined ? true : existParam === "true";

    const where: any = {
      Exist: exist,
      ...(custId ? { CustID: custId } : {}),
      ...(search
        ? {
            OR: [
              { BillNum: { contains: search, mode: "insensitive" } },
              { Customer: { Customer: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    };

    const [total, buys] = await Promise.all([
      prisma.buys.count({ where }),
      prisma.buys.findMany({
        where,
        include: {
          Carrence: true,
          Customer: {
            include: {
              Nationality: true,
            },
          },
          User: {
            select: {
              UserName: true,
            },
          },
        },
        orderBy: { BuyDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    res.json({ data: buys, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("listBuys error", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
};

// الحصول على عملية شراء واحدة
export const getBuyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const buy = await prisma.buys.findUnique({
      where: { BuyID: id },
      include: {
        Carrence: true,
        Customer: {
          include: {
            Nationality: true,
          },
        },
        User: {
          select: {
            UserName: true,
          },
        },
      },
    });

    if (!buy) {
      res.status(404).json({ error: "عملية الشراء غير موجودة" });
      return;
    }

    res.json(buy);
  } catch (error) {
    console.error("getBuyById error", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
};

// الحصول على رقم الفاتورة التالي
export const getNextBillNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const nextBillNum = await generateNextBillNum();
    res.json({ nextBillNumber: nextBillNum });
  } catch (error) {
    console.error("getNextBillNumber error", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
};

// تعديل عملية شراء
export const updateBuy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      CarID,
      Value,
      BuyPrice,
      TotalPrice,
      CustID,
      FirstNum,
      LastNum,
      PaymentCurrencyID,
    } = req.body;

    // التحقق من وجود عملية الشراء
    const existingBuy = await prisma.buys.findUnique({
      where: { BuyID: id },
      include: {
        Carrence: true,
      },
    });

    if (!existingBuy || !existingBuy.Exist) {
      res.status(404).json({ error: "عملية الشراء غير موجودة" });
      return;
    }

    // بدء المعاملة
    const result = await prisma.$transaction(async (tx) => {
      // 1. تعديل عملية الشراء
      const updatedBuy = await tx.buys.update({
        where: { BuyID: id },
        data: {
          CarID: CarID || existingBuy.CarID,
          Value: Value ? new Decimal(Value) : existingBuy.Value,
          BuyPrice: BuyPrice ? new Decimal(BuyPrice) : existingBuy.BuyPrice,
          TotalPrice: TotalPrice ? new Decimal(TotalPrice) : existingBuy.TotalPrice,
          CustID: CustID || existingBuy.CustID,
          FirstNum: FirstNum !== undefined ? FirstNum : existingBuy.FirstNum,
          LastNum: LastNum !== undefined ? LastNum : existingBuy.LastNum,
        },
        include: {
          Carrence: true,
          Customer: {
            include: {
              Nationality: true,
            },
          },
          User: {
            select: {
              UserName: true,
            },
          },
        },
      });

      // 2. إضافة حركة خزينة للتوثيق
      await tx.treasuryMovements.create({
        data: {
          TreaMoveID: crypto.randomUUID(),
          CarID: updatedBuy.CarID,
          OpenBalance: new Decimal(0), // سيتم حساب الرصيد لاحقاً
          Cridit: new Decimal(0),
          Debit: new Decimal(0),
          FinalBalance: new Decimal(0),
          Statment: `تعديل عملية شراء - فاتورة رقم ${updatedBuy.BillNum}`,
          UserID: existingBuy.UserID,
          Exist: true,
        },
      });

      return updatedBuy;
    });

    res.json(result);
  } catch (error) {
    console.error("updateBuy error", error);
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: "خطأ في الخادم" });
    }
  }
};

// حذف عملية شراء (soft delete)
export const deleteBuy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.buys.update({
      where: { BuyID: id },
      data: { Exist: false },
    });
    res.status(204).end();
  } catch (error) {
    console.error("deleteBuy error", error);
    res.status(500).json({ error: "خطأ في الخادم" });
  }
};
