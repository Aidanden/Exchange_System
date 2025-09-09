import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import Decimal from "decimal.js";
import { AuthRequest } from "../middleware/auth";

const prisma = new PrismaClient();

export const createDebt = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Debug: Log the raw request body
    console.log("Raw request body:", req.body);
    console.log("Request body type:", typeof req.body);
    console.log("Request body stringified:", JSON.stringify(req.body, null, 2));
    
    const {
      DebtType,
      DebtorName,
      DebtorPhone,
      DebtorAddress,
      CarID,
      Amount,
      Description,
    } = req.body;

    // الحصول على UserID من المستخدم المسجل دخوله
    const UserID = req.user?.id;
    if (!UserID) {
      res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
      return;
    }

    // Validate required fields
    if (!DebtType || !DebtorName || !CarID || !Amount) {
      res.status(400).json({
        message: "DebtType, DebtorName, CarID, and Amount are required",
      });
      return;
    }

    // Validate DebtType
    if (!["TAKEN", "GIVEN"].includes(DebtType)) {
      res.status(400).json({
        message: "DebtType must be either 'TAKEN' or 'GIVEN'",
      });
      return;
    }

    // Check if currency exists
    const currency = await prisma.carrences.findUnique({
      where: { CarID },
    });

    if (!currency) {
      res.status(404).json({ message: "Currency not found" });
      return;
    }

    const amountDecimal = new Decimal(Amount);

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create debt record
      const debt = await tx.debts.create({
        data: {
          DebtID: randomUUID(),
          DebtType,
          DebtorName,
          DebtorPhone,
          DebtorAddress,
          CarID,
          Amount: amountDecimal,
          RemainingAmount: amountDecimal,
          Description,
          UserID,
        },
        include: {
          Currency: true,
          User: true,
        },
      });

      // Update currency balance based on debt type
      let newBalance: Decimal;
      let creditAmount: Decimal = new Decimal(0);
      let debitAmount: Decimal = new Decimal(0);
      let statement: string;

      if (DebtType === "TAKEN") {
        // When taking a debt, we receive money (increase balance - debit)
        newBalance = new Decimal(currency.Balance).plus(amountDecimal);
        debitAmount = amountDecimal;
        statement = `استذانة من ${DebtorName} - ${Description || ""}`;
      } else {
        // When giving a debt, we give money (decrease balance - credit)
        newBalance = new Decimal(currency.Balance).minus(amountDecimal);
        creditAmount = amountDecimal;
        statement = `إقراض إلى ${DebtorName} - ${Description || ""}`;
      }

      // Update currency balance
      await tx.carrences.update({
        where: { CarID },
        data: { Balance: newBalance },
      });

      // Create treasury movement record
      await tx.treasuryMovements.create({
        data: {
          TreaMoveID: randomUUID(),
          CarID,
          OpenBalance: currency.Balance,
          Cridit: creditAmount,
          Debit: debitAmount,
          FinalBalance: newBalance,
          Statment: statement,
          UserID,
          Exist: true,
          OperDate: new Date(),
        },
      });

      return debt;
    });

    res.status(201).json({
      message: "Debt created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error creating debt:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const listDebts = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      debtType,
      status = "ACTIVE",
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {
      Exist: true,
    };

    if (search) {
      where.OR = [
        {
          DebtorName: {
            contains: search as string,
            mode: "insensitive",
          },
        },
        {
          Description: {
            contains: search as string,
            mode: "insensitive",
          },
        },
      ];
    }

    if (debtType && ["TAKEN", "GIVEN"].includes(debtType as string)) {
      where.DebtType = debtType;
    }

    if (status && status !== "") {
      if (status === "ACTIVE") {
        // Include ACTIVE, PARTIAL, PAID, and RECEIVED debts when filtering for ACTIVE
        where.Status = { in: ["ACTIVE", "PARTIAL", "PAID", "RECEIVED"] };
      } else {
        where.Status = status;
      }
    }

    // Get total count
    const total = await prisma.debts.count({ where });

    // Get debts with pagination - optimized query
    const debts = await prisma.debts.findMany({
      where,
      select: {
        DebtID: true,
        DebtType: true,
        DebtorName: true,
        DebtorPhone: true,
        DebtorAddress: true,
        Amount: true,
        PaidAmount: true,
        RemainingAmount: true,
        Description: true,
        DebtDate: true,
        Status: true,
        CreatedAt: true,
        UpdatedAt: true,
        Currency: {
          select: {
            CarID: true,
            Carrency: true,
            CarrencyCode: true,
            Balance: true,
          },
        },
        User: {
          select: {
            UserID: true,
            UserName: true,
            Email: true,
          },
        },
      },
      orderBy: [
        {
          RemainingAmount: "desc",
        },
        {
          Status: "asc",
        },
        {
          CreatedAt: "desc",
        },
      ],
      skip,
      take: Math.min(Number(limit), 50), // Limit max results
    });

    const totalPages = Math.ceil(total / Number(limit));

    res.status(200).json({
      data: debts,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: total,
        itemsPerPage: Number(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching debts:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const addDebtPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { debtId } = req.params;
    const { Amount, Description } = req.body;

    // الحصول على UserID من المستخدم المسجل دخوله
    const UserID = req.user?.id;
    if (!UserID) {
      res.status(401).json({ error: "يجب تسجيل الدخول أولاً" });
      return;
    }

    // Validate required fields
    if (!debtId || !Amount) {
      res.status(400).json({
        message: "DebtID and Amount are required",
      });
      return;
    }

    const paymentAmount = new Decimal(Amount);

    // Get existing debt
    const existingDebt = await prisma.debts.findUnique({
      where: { DebtID: debtId },
      include: { 
        Currency: true,
        Payments: true 
      },
    });

    if (!existingDebt) {
      res.status(404).json({ message: "Debt not found" });
      return;
    }

    if (existingDebt.Status === "PAID" || existingDebt.Status === "RECEIVED") {
      res.status(400).json({ message: "Debt is already fully paid" });
      return;
    }

    // Validate payment amount
    if (paymentAmount.lte(0)) {
      res.status(400).json({ message: "Payment amount must be greater than 0" });
      return;
    }

    if (paymentAmount.gt(existingDebt.RemainingAmount)) {
      res.status(400).json({ 
        message: `Payment amount cannot exceed remaining amount: ${existingDebt.RemainingAmount}` 
      });
      return;
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create payment record
      const payment = await tx.debtPayments.create({
        data: {
          PaymentID: randomUUID(),
          DebtID: debtId,
          Amount: paymentAmount,
          PaymentType: existingDebt.DebtType === "TAKEN" ? "PAYMENT" : "RECEIPT",
          Description,
          UserID,
        },
      });

      // Calculate new amounts
      const newPaidAmount = existingDebt.PaidAmount.plus(paymentAmount);
      const newRemainingAmount = existingDebt.RemainingAmount.minus(paymentAmount);
      
      // Determine new status
      let newStatus = "ACTIVE";
      if (newRemainingAmount.eq(0)) {
        newStatus = existingDebt.DebtType === "TAKEN" ? "PAID" : "RECEIVED";
      } else if (newPaidAmount.gt(0)) {
        newStatus = "PARTIAL";
      }

      // Update debt
      const updatedDebt = await tx.debts.update({
        where: { DebtID: debtId },
        data: {
          PaidAmount: newPaidAmount,
          RemainingAmount: newRemainingAmount,
          Status: newStatus,
        },
        include: {
          Currency: true,
          User: true,
          Payments: true,
        },
      });

      // Update currency balance based on payment
      let newBalance: Decimal;
      let creditAmount: Decimal = new Decimal(0);
      let debitAmount: Decimal = new Decimal(0);
      let statement: string;

      // Get current currency balance
      const currentCurrency = await tx.carrences.findUnique({
        where: { CarID: existingDebt.CarID }
      });

      if (!currentCurrency) {
        throw new Error("Currency not found");
      }

      if (existingDebt.DebtType === "TAKEN") {
        // Paying back a debt we took (decrease balance - credit)
        newBalance = new Decimal(currentCurrency.Balance).minus(paymentAmount);
        creditAmount = paymentAmount;
        statement = newRemainingAmount.eq(0) 
          ? `سداد كامل لدين ${existingDebt.DebtorName} - ${Description || ""}`
          : `سداد جزئي لدين ${existingDebt.DebtorName} - ${Description || ""}`;
      } else {
        // Receiving payment for debt we gave (increase balance - debit)
        newBalance = new Decimal(currentCurrency.Balance).plus(paymentAmount);
        debitAmount = paymentAmount;
        statement = newRemainingAmount.eq(0)
          ? `استلام كامل لدين من ${existingDebt.DebtorName} - ${Description || ""}`
          : `استلام جزئي لدين من ${existingDebt.DebtorName} - ${Description || ""}`;
      }

      // Update currency balance
      await tx.carrences.update({
        where: { CarID: existingDebt.CarID },
        data: { Balance: newBalance },
      });

      // Create treasury movement record
      await tx.treasuryMovements.create({
        data: {
          TreaMoveID: randomUUID(),
          CarID: existingDebt.CarID,
          OpenBalance: currentCurrency.Balance,
          Cridit: creditAmount,
          Debit: debitAmount,
          FinalBalance: newBalance,
          Statment: statement,
          UserID,
          Exist: true,
          OperDate: new Date(),
        },
      });

      return { debt: updatedDebt, payment };
    });

    res.status(200).json({
      message: "Payment added successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error adding debt payment:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// Keep the old function for backward compatibility but mark as deprecated
export const updateDebtStatus = addDebtPayment;

export const getDebtById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { debtId } = req.params;

    const debt = await prisma.debts.findUnique({
      where: { DebtID: debtId },
      include: {
        Currency: true,
        User: true,
      },
    });

    if (!debt) {
      res.status(404).json({ message: "Debt not found" });
      return;
    }

    res.status(200).json({
      data: debt,
    });
  } catch (error) {
    console.error("Error fetching debt:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const deleteDebt = async (req: Request, res: Response): Promise<void> => {
  try {
    const { debtId } = req.params;

    // Check if debt exists and is active
    const existingDebt = await prisma.debts.findUnique({
      where: { DebtID: debtId },
    });

    if (!existingDebt) {
      res.status(404).json({ message: "Debt not found" });
      return;
    }

    if (existingDebt.Status !== "ACTIVE") {
      res.status(400).json({ message: "Can only delete active debts" });
      return;
    }

    // Soft delete by setting Exist to false
    await prisma.debts.update({
      where: { DebtID: debtId },
      data: { Exist: false },
    });

    res.status(200).json({
      message: "Debt deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting debt:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getDebtsSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get active debts summary
    const activeDebts = await prisma.debts.findMany({
      where: {
        Status: "ACTIVE",
        Exist: true,
      },
      include: {
        Currency: true,
      },
    });

    // Calculate summary by currency and debt type
    const summary: any = {};

    activeDebts.forEach((debt) => {
      const currencyCode = debt.Currency.CarrencyCode;
      
      if (!summary[currencyCode]) {
        summary[currencyCode] = {
          currency: debt.Currency.Carrency,
          currencyCode,
          totalTaken: new Decimal(0),
          totalGiven: new Decimal(0),
          countTaken: 0,
          countGiven: 0,
        };
      }

      if (debt.DebtType === "TAKEN") {
        summary[currencyCode].totalTaken = summary[currencyCode].totalTaken.plus(debt.Amount);
        summary[currencyCode].countTaken++;
      } else {
        summary[currencyCode].totalGiven = summary[currencyCode].totalGiven.plus(debt.Amount);
        summary[currencyCode].countGiven++;
      }
    });

    res.status(200).json({
      data: Object.values(summary),
    });
  } catch (error) {
    console.error("Error fetching debts summary:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

