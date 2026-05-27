import express from "express";
import {
  addExpense,
  getExpenses,
  deleteExpense,
  updateExpense,
  getSingleExpense,
  getExpenseSummary,
  analyzeExpenses,
  chatAboutExpenses,
  getChatHistory,
  clearChatHistory,
} from "../../controllers/expenses/expenses.controller.js";

import authMiddleware from "../../middleware/auth/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", addExpense);
router.get("/", getExpenses);
router.get("/summary", getExpenseSummary);
router.get("/analyze", analyzeExpenses);
router.post("/chat", chatAboutExpenses);
router.get("/chat/history", getChatHistory);


router.delete("/chat/history", clearChatHistory);


router.get("/:id", getSingleExpense);
router.put("/:id", updateExpense);
router.delete("/:id", deleteExpense);

export default router;