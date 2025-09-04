import { Router } from "express";
import {
  createDebt,
  listDebts,
  addDebtPayment,
  getDebtById,
  deleteDebt,
  getDebtsSummary,
} from "../controllers/debtsController";

const router = Router();

// POST /api/debts - Create a new debt
router.post("/debtsAdd", createDebt);

// GET /api/debts - List debts with pagination and filters
router.get("/debts", listDebts);

// GET /api/debts/summary - Get debts summary
router.get("/summary", getDebtsSummary);

// GET /api/debts/:debtId - Get debt by ID
router.get("/:debtId", getDebtById);

// POST /api/debts/:debtId/payment - Add debt payment
router.post("/:debtId/payment", addDebtPayment);

// DELETE /api/debts/:debtId - Delete debt (soft delete)
router.delete("/:debtId", deleteDebt);

export default router;

