import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { uploadMessageFile } from "../controllers/message.controller";
import { upload } from "../middlewares/upload";

const router = Router();

// multipart/form-data
router.post(
  "/:userId",
  authMiddleware,
  upload.single("file"),
  uploadMessageFile
);

export default router;

