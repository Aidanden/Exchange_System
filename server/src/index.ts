import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
/*ROUTE IMPORT*/
import dashboardRoutes from "./routes/dashboardRoute"
import nationalitRoutes from "./routes/nationalitRoutes";
import categoriesRoute from "./routes/categoriesRoute"
import currencyRoutes from "./routes/currenciesRoute";
import customersRoute from "./routes/customersRoute";
import buysRoute from "./routes/buysRoute";
import salesRoute from "./routes/salesRoute";
import debtsRoute from "./routes/debtsRoute";

/*CONFIGRATION*/
dotenv.config();
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

// Disable caching for all API routes
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.removeHeader('ETag');
  next();
});

// Add request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Body:', req.body);
  }
  next();
});

/*ROUTE */
app.use("/api/dashboard", dashboardRoutes);
app.use('/api/nationalities', nationalitRoutes);
app.use('/api/categories', categoriesRoute);
app.use('/api/currencies', currencyRoutes);
app.use('/api', customersRoute);
app.use('/api/buys', buysRoute);
app.use('/api/sales', salesRoute);
app.use('/api/debts', debtsRoute);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction): void => {
  console.error("Error details:", err);
  console.error("Error stack:", err.stack);
  
  // Handle JSON parsing errors specifically
  if (err.type === 'entity.parse.failed') {
    console.error("JSON Parse Error - Raw body:", err.body);
    res.status(400).json({ 
      error: "Invalid JSON format", 
      details: err.message,
      position: err.message.match(/position (\d+)/)?.[1] || 'unknown'
    });
    return;
  }
  
  res.status(500).json({ error: "Something went wrong!", details: err.message });
});

/*SERVER */
const port = process.env.PORT || 8001;
app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
