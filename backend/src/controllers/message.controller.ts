import { Response } from "express";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = String(req.user.userId);
    const { userId, groupId } = req.params as any;

    const where: any = {};
    if (groupId) {
      where.groupId = groupId;
    } else if (userId) {
      where.OR = [
        { senderId: currentUserId, receiverId: userId },
        { senderId: userId, receiverId: currentUserId },
      ];
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    return res.json({ success: true, messages });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
export const getCallHistory = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const currentUserId = req.user.userId;

    const calls = await prisma.callHistory.findMany({
      where: {
        OR: [
          { callerId: currentUserId },
          { receiverId: currentUserId },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      calls,
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

const ensureUploadDir = async () => {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
};

export const uploadMessageFile = async (req: AuthRequest & { file?: Express.Multer.File }, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    await ensureUploadDir();
    const ext = path.extname(file.originalname) || "";
    const key = `${Date.now()}${ext}`;
    const savedPath = path.join(UPLOAD_DIR, key);

    await fs.writeFile(savedPath, file.buffer);

    const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
    const host = process.env.BACKEND_HOST || "localhost:5000";
    const fileUrl = `${protocol}://${host}/api/files/${key}`;

    let messageType = "file";
    if (file.mimetype.startsWith("image/")) messageType = "image";
    else if (file.mimetype.startsWith("video/")) messageType = "video";

    return res.json({ success: true, fileUrl, fileName: file.originalname, fileType: file.mimetype, messageType });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const saveCallLog = async (
  req: AuthRequest,
  res: Response
) => {

  try {

    const callerId = req.user.userId;

    const {
      receiverId,
      callType,
      duration,
      status
    } = req.body;

    await prisma.callHistory.create({
      data: {
        callerId,
        receiverId,
        callType,
        duration,
        status,
      },
    });

    await prisma.message.create({
      data: {
        senderId: callerId,
        receiverId,
        content:
          `${callType} call (${Math.floor(duration / 60)}m ${duration % 60}s)`,

        type:
          callType === "audio"
            ? "voice_call"
            : "video_call",

        delivered: true,
      },
    });

    return res.json({
      success: true,
    });

  } catch (error: any) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};