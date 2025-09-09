import { Router } from "express";
import {
  listTreasuryMovements,
  getTreasuryMovementById,
  getTreasurySummary,
} from "../controllers/treasuryController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// GET /api/treasury - List treasury movements with pagination and filters
router.get("/movements", authenticateToken, listTreasuryMovements);

// GET /api/treasury/summary - Get treasury summary
router.get("/summary", authenticateToken, getTreasurySummary);

// GET /api/treasury/:movementId - Get treasury movement by ID
router.get("/:movementId", authenticateToken, getTreasuryMovementById);

export default router;
