import { Router } from "express";
import { getDashboardMetrics } from "../controllers/dashboardController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.get("/dashboard", authenticateToken, getDashboardMetrics);

export default router;
