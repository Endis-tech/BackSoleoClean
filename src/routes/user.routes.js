import { Router } from "express";
import {
  getProfile,
  updateProfile,
  uploadProfilePhoto,
  getAllClients,
  updateUserStatus,
  deleteOwnAccount,
  adminHardDeleteUser,
  getUserMembership,
  getCurrentUser,
  saveFcmToken
} from "../controllers/user.controller.js";

import verifyToken from "../middleware/verifyToken.js";
import isAdmin from "../middleware/isAdmin.js";
// ❌ Eliminamos esta línea porque ya no usamos uploadProfile
// import uploadProfile from "../middleware/uploadProfile.js";

const router = Router();

router.get("/me", verifyToken, getCurrentUser);
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);

// ✅ Ruta actualizada: sin middleware de multer, solo el controlador
router.post("/profile/photo", verifyToken, uploadProfilePhoto); // ⚠️ Cambié a POST (mejor para subidas)

router.delete("/profile", verifyToken, deleteOwnAccount);

// ✅ Ruta corregida
router.post('/fcm-token', verifyToken, saveFcmToken);

router.get("/membership", verifyToken, getUserMembership);

router.get("/clients", verifyToken, isAdmin, getAllClients);
router.put("/:id/status", verifyToken, isAdmin, updateUserStatus);
router.delete("/:id", verifyToken, isAdmin, adminHardDeleteUser);

export default router;