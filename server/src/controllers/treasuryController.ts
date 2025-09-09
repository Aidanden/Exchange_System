import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const listTreasuryMovements = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      carID,
      startDate,
      endDate,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {
      Exist: true,
    };

    if (search) {
      where.Statment = {
        contains: search as string,
        mode: "insensitive",
      };
    }

    if (carID && carID !== "") {
      where.CarID = carID;
    }

    if (startDate) {
      where.OperDate = {
        ...where.OperDate,
        gte: new Date(startDate as string),
      };
    }

    if (endDate) {
      where.OperDate = {
        ...where.OperDate,
        lte: new Date(endDate as string),
      };
    }

    // Get total count
    const total = await prisma.treasuryMovements.count({ where });

    // Get treasury movements with pagination
    const treasuryMovements = await prisma.treasuryMovements.findMany({
      where,
      include: {
        Carrence: true,
        User: true,
      },
      orderBy: {
        OperDate: 'desc', // أحدث العمليات أولاً
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const totalPages = Math.ceil(total / Number(limit));

    res.status(200).json({
      data: treasuryMovements,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: total,
        itemsPerPage: Number(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching treasury movements:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getTreasuryMovementById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { movementId } = req.params;

    const movement = await prisma.treasuryMovements.findUnique({
      where: { TreaMoveID: movementId },
      include: {
        Carrence: true,
        User: true,
      },
    });

    if (!movement) {
      res.status(404).json({ message: "Treasury movement not found" });
      return;
    }

    res.status(200).json({
      data: movement,
    });
  } catch (error) {
    console.error("Error fetching treasury movement:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const getTreasurySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get summary by currency
    const movements = await prisma.treasuryMovements.findMany({
      where: {
        Exist: true,
      },
      include: {
        Carrence: true,
      },
    });

    // Calculate summary by currency
    const summary: any = {};

    movements.forEach((movement) => {
      const currencyCode = movement.Carrence.CarrencyCode;
      
      if (!summary[currencyCode]) {
        summary[currencyCode] = {
          currency: movement.Carrence.Carrency,
          currencyCode,
          totalCredit: 0,
          totalDebit: 0,
          currentBalance: movement.Carrence.Balance,
          transactionCount: 0,
        };
      }

      summary[currencyCode].totalCredit += Number(movement.Cridit);
      summary[currencyCode].totalDebit += Number(movement.Debit);
      summary[currencyCode].transactionCount++;
    });

    res.status(200).json({
      data: Object.values(summary),
    });
  } catch (error) {
    console.error("Error fetching treasury summary:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
