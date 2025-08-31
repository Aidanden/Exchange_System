import { Request, Response } from "express";
import prisma from "../models/prismaClient";// استيراد الاتصال بـ Prisma


export const getDashboardMetrics = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const popularCustomer = await prisma.customers.findMany({
      take: 3,
      orderBy: {
        OperDate: "desc",
      },
    });
    const lastBuy = await prisma.buys.findMany({
      take: 2,
      orderBy: {
        BuyDate: "desc",
      },
    });
    const lastSales = await prisma.sales.findMany({
      take: 2,
      orderBy: {
        SaleDate: "desc",
      },
    });
    const Expanss = await prisma.expanseAccounts.findMany({
      take: 2,
      orderBy: {
        OperDate: "desc",
      },
    });

    res.json({
      popularCustomer,
      lastBuy,
      lastSales,
      Expanss,
    });
  } catch (error) {
    res.status(500).json({ message: "Error retriveing dashboard metrice" });
  }
};
