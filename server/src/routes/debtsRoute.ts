import { Router } from "express";
import {
  createDebt,
  listDebts,
  addDebtPayment,
  getDebtById,
  deleteDebt,
  getDebtsSummary,
} from "../controllers/debtsController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// POST /api/debts - Create a new debt
router.post("/debtsAdd", authenticateToken, createDebt);

// GET /api/debts - List debts with pagination and filters
router.get("/debts", authenticateToken, listDebts);

// GET /api/debts/summary - Get debts summary
router.get("/summary", authenticateToken, getDebtsSummary);

// GET /api/debts/:debtId - Get debt by ID
router.get("/:debtId", authenticateToken, getDebtById);

// POST /api/debts/:debtId/payment - Add debt payment
router.post("/:debtId/payment", authenticateToken, addDebtPayment);

// DELETE /api/debts/:debtId - Delete debt (soft delete)
router.delete("/:debtId", authenticateToken, deleteDebt);

export default router;

