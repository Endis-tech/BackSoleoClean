import { Router } from "express";
import {
    getMemberships,
    getMembershipById,
    createMembership,
    updateMembership,
    deleteMembership,
    getMembershipWithFullRoutine,
    // Cliente
    getClientCurrentMembership,
    getClientMembershipHistory,
    checkMembershipStatus,
    // Admin
    assignMembershipToClient,
    getClientMembershipHistoryAsAdmin // ✅ ¡Importante!
} from "../controllers/membership.controller.js";
import verifyToken from "../middleware/verifyToken.js";
import isAdmin from "../middleware/isAdmin.js";

const router = Router();

// ==================== RUTAS PÚBLICAS ====================
router.get("/", getMemberships);
router.get("/:id", getMembershipById);
router.get("/:id/full-routine", getMembershipWithFullRoutine);

// ==================== RUTAS CLIENTE ====================
router.get("/my/current", verifyToken, getClientCurrentMembership);
router.get("/my/history", verifyToken, getClientMembershipHistory);
router.get("/my/status", verifyToken, checkMembershipStatus);

// ==================== RUTAS ADMIN ====================
router.post("/", verifyToken, isAdmin, createMembership);
router.put("/:id", verifyToken, isAdmin, updateMembership);
router.delete("/:id", verifyToken, isAdmin, deleteMembership);
router.post("/assign-to-client", verifyToken, isAdmin, assignMembershipToClient);
// ✅ Usa la función correcta para admin (con :userId)
router.get("/client-history/:userId", verifyToken, isAdmin, getClientMembershipHistoryAsAdmin);

export default router;