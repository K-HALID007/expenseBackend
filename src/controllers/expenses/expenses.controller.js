import { GoogleGenerativeAI } from "@google/generative-ai";
import Expense from "../../models/expense/expenses.model.js";
import Chat from "../../models/chat/chat.model.js";

// ADD EXPENSE
export const addExpense = async (req, res) => {
  try {
    const { title, amount, category, note, date } = req.body;

    if (!title || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, amount and category are required",
      });
    }

    const expense = await Expense.create({
      user: req.user,
      title,
      amount,
      category,
      note,
      date,
    });

    res.status(201).json({
      success: true,
      message: "Expense added successfully",
      expense,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET ALL EXPENSES
export const getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, expenses });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE EXPENSE
export const updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    if (expense.user.toString() !== req.user) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });

    res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      expense: updatedExpense,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET SINGLE EXPENSE
export const getSingleExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    res.status(200).json({ success: true, expense });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE EXPENSE
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    await expense.deleteOne();
    res.status(200).json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// SUMMARY
export const getExpenseSummary = async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.user });

    const totalExpense = expenses.reduce((acc, item) => acc + item.amount, 0);
    const totalTransactions = expenses.length;

    res.status(200).json({
      success: true,
      summary: { totalExpense, totalTransactions },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ANALYZE EXPENSES
export const analyzeExpenses = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.log("CRITICAL ERROR: API Key is missing!");
      return res.status(500).json({ success: false, message: "API Key missing on server" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const expenses = await Expense.find({ user: req.user }).limit(30);

    if (expenses.length === 0) {
      return res.status(200).json({
        success: true,
        insights: "You don't have any expenses yet. Start tracking to get AI insights!",
      });
    }

    // 👇 UPDATED: Dates and Notes injected into the prompt
    const expenseData = expenses
      .map((e) => {
        const dateStr = new Date(e.date || e.createdAt).toLocaleDateString("en-IN");
        const noteStr = e.note ? ` [Note: ${e.note}]` : "";
        return `- ${e.title}: ₹${e.amount} (${e.category}) on ${dateStr}${noteStr}`;
      })
      .join("\n");

    const prompt = `
      You are an expert financial advisor. Here are my recent expenses:
      ${expenseData}

      Please provide a brief, friendly financial health check (max 3 short paragraphs). 
      Identify my biggest spending category, warn me of any bad financial habits, 
      and give me one actionable tip to save money next month. Keep the tone encouraging.
      Do not use markdown formatting like **bold** or *italics*, just use plain text with line breaks.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Save to DB so it appears in chat history
    let chat = await Chat.findOne({ user: req.user });
    if (!chat) {
      chat = await Chat.create({ user: req.user, messages: [] });
    }
    chat.messages.push(
      { role: "user", text: "Generate financial health report" },
      { role: "ai", text: responseText }
    );
    chat.updatedAt = new Date();
    await chat.save();

    res.status(200).json({ success: true, insights: responseText });
  } catch (error) {
    console.log("AI Analysis Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// CHAT ABOUT EXPENSES
export const chatAboutExpenses = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message is required to chat." });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: "API Key missing on server" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const expenses = await Expense.find({ user: req.user }).limit(50);

    // 👇 UPDATED: Dates and Notes injected into the prompt
    const expenseData =
      expenses.length > 0
        ? expenses.map((e) => {
            const dateStr = new Date(e.date || e.createdAt).toLocaleDateString("en-IN");
            const noteStr = e.note ? ` [Note: ${e.note}]` : "";
            return `- ${e.title}: ₹${e.amount} (${e.category}) on ${dateStr}${noteStr}`;
          }).join("\n")
        : "The user has no expenses recorded yet.";

    const prompt = `
      You are a helpful, friendly, and expert financial assistant. 
      Here is my recent expense data:
      ${expenseData}

      Based ONLY on the data provided above, please answer my question.
      Keep your answer concise, conversational, and helpful. 
      Do not use markdown formatting like **bold** or *italics*, just plain text.
      
      My Question: "${message}"
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Save to DB
    let chat = await Chat.findOne({ user: req.user });
    if (!chat) {
      chat = await Chat.create({ user: req.user, messages: [] });
    }
    chat.messages.push(
      { role: "user", text: message },
      { role: "ai", text: responseText }
    );
    chat.updatedAt = new Date();
    await chat.save();

    res.status(200).json({ success: true, reply: responseText });
  } catch (error) {
    console.log("AI Chat Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET CHAT HISTORY
export const getChatHistory = async (req, res) => {
  try {
    const chat = await Chat.findOne({ user: req.user });
    res.status(200).json({
      success: true,
      messages: chat ? chat.messages : [],
    });
  } catch (error) {
    console.log("Get Chat History Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// CLEAR CHAT HISTORY
export const clearChatHistory = async (req, res) => {
  try {
    await Chat.findOneAndUpdate(
      { user: req.user },
      { messages: [], updatedAt: new Date() }
    );
    res.status(200).json({ success: true, message: "Chat history cleared" });
  } catch (error) {
    console.log("Clear Chat History Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};