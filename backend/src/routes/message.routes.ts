import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { getMessages } from "../controllers/message.controller";

const router = Router();

router.get("/:userId", authMiddleware, getMessages);
router.get("/group/:groupId", authMiddleware, getMessages);

export default router;