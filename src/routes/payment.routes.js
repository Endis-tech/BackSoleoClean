import { Router } from "express";
import {
    createPayment,
    capturePayment,
    cancelPayment,
    getPaymentHistory,
    getMyPayments,
    getPaymentStats
} from "../controllers/payment.controller.js";
import verifyToken from "../middleware/verifyToken.js";
import isAdmin from "../middleware/isAdmin.js";

const router = Router();

// ==================== RUTAS CLIENTE ====================
router.post("/create", verifyToken, createPayment);
router.post("/capture", verifyToken, capturePayment);
router.post("/cancel", verifyToken, cancelPayment);
router.get("/my-payments", verifyToken, getMyPayments);

// ==================== RUTAS ADMIN ====================
router.get("/history", verifyToken, isAdmin, getPaymentHistory);
router.get("/stats", verifyToken, isAdmin, getPaymentStats);

export default router;