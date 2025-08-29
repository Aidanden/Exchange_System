import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
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

/*CONFIGRATION*/
dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

/*ROUTE */
app.use("/api/dashboard", dashboardRoutes);
app.use('/api/nationalities', nationalitRoutes);
app.use('/api/categories', categoriesRoute);
app.use('/api/currencies', currencyRoutes);
app.use('/api', customersRoute);
app.use('/api/buys', buysRoute);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

/*SERVER */
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server running on port: ${port}`);
});
