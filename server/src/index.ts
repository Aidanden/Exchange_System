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
import treasuryRoute from "./routes/treasuryRoute";
import authRoute from "./routes/authRoute";
import usersRoute from "./routes/usersRoute";


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
  origin: process.env.CORS_ORIGIN || "http://localhost:3050",
  credentials: true
}));

// Optimized caching for better performance
app.use('/api', (req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=5');
  } else {
    res.set('Cache-Control', 'no-cache');
  }
  next();
});

// Simplified request logging for production performance
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${req.method} ${req.path}`);
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
app.use('/api/treasury', treasuryRoute);
app.use('/api/auth', authRoute);
app.use('/api', usersRoute);


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
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
