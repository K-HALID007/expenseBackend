import express from "express";

import {
  registerUser,
  loginUser,
  getMe,
  updateUser,
  forgotPassword,  // ADD THIS
  verifyOTP,       // ADD THIS
  resetPassword,   // ADD THIS
} from "../../controllers/auth/auth.controller.js";

import authMiddleware from "../../middleware/auth/auth.middleware.js";

const router = express.Router();

// PUBLIC ROUTES
router.post("/register", registerUser);
router.post("/login", loginUser);

// FORGOT PASSWORD ROUTES (ADD THESE)
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

// PROTECTED ROUTES
router.get("/me", authMiddleware, getMe);
router.put("/update", authMiddleware, updateUser);

export default router;