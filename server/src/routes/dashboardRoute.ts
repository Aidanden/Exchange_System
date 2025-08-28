import { Router } from "express";
import { getDashboardMetrics } from "../controllers/dashboardController";


const router = Router();

router.get("/dashboard",getDashboardMetrics);

export default router;
