import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { uploadMessageFile } from "../controllers/message.controller";
import { upload } from "../middlewares/upload";

const router = Router();

/**
 * Upload attachment and create a Message row with fileUrl/fileType.
 * multipart/form-data with field name: "file"
 */
router.post("/:userId", authMiddleware, upload.single("file"), uploadMessageFile);

export default router;
