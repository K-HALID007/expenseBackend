import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import connectDB from "./src/config/db.js";

import authRoutes from "./src/routes/auth/auth.route.js";
import expenseRoutes from "./src/routes/expense/expenses.route.js";

const app = express();

connectDB();

app.use(cors());
app.use(express.json());


//  ROUTE
app.get("/", (req, res) => {
  res.send("Expense Tracker API Running");
});


// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);


const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});