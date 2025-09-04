import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "decimal.js";

const prisma = new PrismaClient();

// قائمة المبيعات
export const listSales = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;
    const custId = req.query.custId as string;
    const exist = req.query.exist as string;

    const skip = (page - 1) * limit;

    // بناء شروط البحث
    const where: any = {};
    
    // افتراضياً، عرض المبيعات الموجودة فقط (غير المحذوفة)
    where.Exist = true;
    
    if (search) {
      where.OR = [
        { BillNum: { contains: search } },
        { Customer: { Customer: { contains: search } } },
      ];
    }

    if (custId) {
      where.CustID = custId;
    }

    // إذا تم تحديد exist بشكل صريح، استخدم القيمة المحددة
    if (exist !== undefined) {
      where.Exist = exist === "true";
    }

    // جلب البيانات مع العلاقات
    const sales = await prisma.sales.findMany({
      where,
      include: {
        Customer: {
          include: {
            Nationality: true,
          },
        },
        Carrence: true,
        User: {
          select: {
            UserName: true,
          },
        },
      },
      orderBy: {
        SaleDate: "desc",
      },
      skip,
      take: limit,
    });

    // جلب العدد الإجمالي
    const total = await prisma.sales.count({ where });

    res.json({
      data: sales,
      total,
      page,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Error listing sales:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب قائمة المبيعات" });
  }
};

// تفاصيل عملية بيع واحدة
export const getSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const sale = await prisma.sales.findUnique({
      where: { 
        SaleID: id,
        Exist: true, // التأكد من أن عملية البيع غير محذوفة
      },
      include: {
        Customer: {
          include: {
            Nationality: true,
          },
        },
        Carrence: true,
        User: {
          select: {
            UserName: true,
          },
        },
      },
    });

    if (!sale) {
      res.status(404).json({ error: "عملية البيع غير موجودة أو تم حذفها" });
      return;
    }

    res.json(sale);
  } catch (error) {
    console.error("Error getting sale:", error);
    res.status(500).json({ error: "حدث خطأ أثناء جلب تفاصيل عملية البيع" });
  }
};

// إنشاء عملية بيع جديدة
export const createSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      CarID,
      Value,
      SalePrice,
      TotalPrice,
      CustID,
      FirstNum,
      LastNum,
      PaymentCurrencyID,
      UserID,
    } = req.body;

    // التحقق من وجود العملة المراد بيعها
    const currencyToSell = await prisma.carrences.findUnique({
      where: { CarID },
    });

    if (!currencyToSell) {
      res.status(400).json({ error: "العملة المراد بيعها غير موجودة" });
      return;
    }

    // التحقق من وجود عملة الدفع
    const paymentCurrency = await prisma.carrences.findUnique({
      where: { CarID: PaymentCurrencyID },
    });

    if (!paymentCurrency) {
      res.status(400).json({ error: "عملة الدفع غير موجودة" });
      return;
    }

    // التحقق من وجود العميل
    const customer = await prisma.customers.findUnique({
      where: { CustID },
    });

    if (!customer) {
      res.status(400).json({ error: "العميل غير موجود" });
      return;
    }

    // التحقق من الرصيد الكافي للعملة المراد بيعها
    const currentBalance = new Decimal(currencyToSell.Balance);
    const valueToSell = new Decimal(Value);

    if (currentBalance.lessThan(valueToSell)) {
      res.status(400).json({ 
        error: `رصيد العملة غير كافي. الرصيد الحالي: ${currentBalance.toFixed(3)}, المطلوب: ${valueToSell.toFixed(3)}` 
      });
      return;
    }

    // إنشاء رقم الفاتورة
    const lastSale = await prisma.sales.findFirst({
      where: {
        Exist: true, // اعتبار المبيعات الموجودة فقط لتجنب فجوات في الترقيم
      },
      orderBy: { BillNum: "desc" },
    });

    let billNum = "S001";
    if (lastSale) {
      const lastNum = parseInt(lastSale.BillNum.substring(1));
      billNum = `S${String(lastNum + 1).padStart(3, "0")}`;
    }

    // إنشاء عملية البيع
    const sale = await prisma.sales.create({
      data: {
        SaleID: crypto.randomUUID(),
        BillNum: billNum,
        CarID,
        Value: new Decimal(Value),
        SalePrice: new Decimal(SalePrice),
        TotalPrice: new Decimal(TotalPrice),
        CustID,
        FirstNum: FirstNum || null,
        LastNum: LastNum || null,
        SaleDate: new Date(),
        UserID,
        Exist: true,
        OperDate: new Date(),
      },
      include: {
        Customer: {
          include: {
            Nationality: true,
          },
        },
        Carrence: true,
        User: {
          select: {
            UserName: true,
          },
        },
      },
    });

    // تحديث رصيد العملة المراد بيعها (نقصان)
    await prisma.carrences.update({
      where: { CarID },
      data: {
        Balance: currentBalance.minus(valueToSell),
      },
    });

    // تحديث رصيد عملة الدفع (زيادة)
    const paymentBalance = new Decimal(paymentCurrency.Balance);
    const totalPayment = new Decimal(TotalPrice);
    
    await prisma.carrences.update({
      where: { CarID: PaymentCurrencyID },
      data: {
        Balance: paymentBalance.plus(totalPayment),
      },
    });

    // تسجيل حركة الخزينة للعملة المراد بيعها (بيع - credit)
    await prisma.treasuryMovements.create({
      data: {
        TreaMoveID: crypto.randomUUID(),
        CarID,
        OpenBalance: currentBalance,
        Cridit: valueToSell,
        Debit: new Decimal(0),
        FinalBalance: currentBalance.minus(valueToSell),
  Statment: `بيع ${Value} ${currencyToSell.Carrency} - فاتورة ${billNum} |SALE:${sale.SaleID}`,
        UserID,
        Exist: true,
        OperDate: new Date(),
      },
    });

    // تسجيل حركة الخزينة لعملة الدفع (استلام - debit)
    await prisma.treasuryMovements.create({
      data: {
        TreaMoveID: crypto.randomUUID(),
        CarID: PaymentCurrencyID,
        OpenBalance: paymentBalance,
        Cridit: new Decimal(0),
        Debit: totalPayment,
        FinalBalance: paymentBalance.plus(totalPayment),
  Statment: `استلام ${totalPayment.toString()} ${paymentCurrency.Carrency} - فاتورة ${billNum} |SALE:${sale.SaleID}`,
        UserID,
        Exist: true,
        OperDate: new Date(),
      },
    });

    res.status(201).json(sale);
  } catch (error) {
    console.error("Error creating sale:", error);
    res.status(500).json({ error: "حدث خطأ أثناء إنشاء عملية البيع" });
  }
};

// تحديث عملية بيع
export const updateSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // التحقق من وجود عملية البيع
    const existingSale = await prisma.sales.findUnique({
      where: { 
        SaleID: id,
        Exist: true, // التأكد من أن عملية البيع غير محذوفة
      },
    });

    if (!existingSale) {
      res.status(404).json({ error: "عملية البيع غير موجودة أو تم حذفها" });
      return;
    }

    // تحديث عملية البيع
    const updatedSale = await prisma.sales.update({
      where: { SaleID: id },
      data: {
        ...updateData,
        Value: updateData.Value ? new Decimal(updateData.Value) : undefined,
        SalePrice: updateData.SalePrice ? new Decimal(updateData.SalePrice) : undefined,
        TotalPrice: updateData.TotalPrice ? new Decimal(updateData.TotalPrice) : undefined,
      },
      include: {
        Customer: {
          include: {
            Nationality: true,
          },
        },
        Carrence: true,
        User: {
          select: {
            UserName: true,
          },
        },
      },
    });

    res.json(updatedSale);
  } catch (error) {
    console.error("Error updating sale:", error);
    res.status(500).json({ error: "حدث خطأ أثناء تحديث عملية البيع" });
  }
};

// حذف عملية بيع
export const deleteSale = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // التحقق من وجود عملية البيع
    const existingSale = await prisma.sales.findUnique({
      where: { 
        SaleID: id,
        Exist: true, // التأكد من أن عملية البيع غير محذوفة مسبقاً
      },
    });

    if (!existingSale) {
      res.status(404).json({ error: "عملية البيع غير موجودة أو تم حذفها مسبقاً" });
      return;
    }

    // perform transactional rollback: mark sale as deleted, reverse related treasury movements
    // and restore currency balances affected by those treasury movements
    await prisma.$transaction(async (tx) => {
      // mark sale as not existing (soft delete)
      await tx.sales.update({ where: { SaleID: id }, data: { Exist: false } });

      const billNum = existingSale.BillNum;

      // Prefer to find movements by explicit SALE:<SaleID> tag we now add at creation time
      const saleTag = `SALE:${existingSale.SaleID}`;
      let relatedMovs = await tx.treasuryMovements.findMany({ where: { Statment: { contains: saleTag } } });

      // fallback: if none found, search by billNum for older records
      if (!relatedMovs || relatedMovs.length === 0) {
        relatedMovs = await tx.treasuryMovements.findMany({ where: { Statment: { contains: billNum } } });
      }

      // reverse each movement's effect on its currency balance
      for (const mov of relatedMovs) {
        const car = await tx.carrences.findUnique({ where: { CarID: mov.CarID } });
        if (!car) continue;

        const currBal = new Decimal((car.Balance as any) ?? 0);
        const credit = new Decimal((mov.Cridit as any) ?? 0);
        const debit = new Decimal((mov.Debit as any) ?? 0);

        // reverse: newBalance = current + credit - debit
        const restored = currBal.plus(credit).minus(debit);

        await tx.carrences.update({ where: { CarID: mov.CarID }, data: { Balance: restored } });
      }

      // delete treasury movements related to this sale (by saleTag or billNum)
      await tx.treasuryMovements.deleteMany({ where: { Statment: { contains: saleTag } } });
      await tx.treasuryMovements.deleteMany({ where: { Statment: { contains: billNum } } });
    });

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting sale:", error);
    res.status(500).json({ error: "حدث خطأ أثناء حذف عملية البيع" });
  }
};
