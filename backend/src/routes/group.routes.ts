import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { prisma } from "../config/prisma";

const router = Router();

router.get("/", authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, username: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json({ success: true, groups });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/", authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const { name, memberIds } = req.body as { name: string; memberIds: string[] };

    if (!name) {
      return res.status(400).json({ success: false, message: "Group name is required" });
    }

    const group = await prisma.group.create({
      data: {
        name,
        members: {
          create: [
            { userId },
            ...memberIds
              .filter((id) => id !== userId)
              .map((id) => ({ userId: id })),
          ],
        },
      },
    });

    return res.json({ success: true, group });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/:groupId/leave", authMiddleware, async (req: any, res: any) => {
  try {
    const userId = req.user.userId;
    const groupId = req.params.groupId;

    await prisma.userGroup.deleteMany({
      where: {
        groupId,
        userId,
      },
    });

    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/:groupId/messages", authMiddleware, async (req: any, res: any) => {
  try {
    const { groupId } = req.params;
    const messages = await prisma.message.findMany({
      where: { groupId },
      orderBy: { createdAt: "asc" },
    });
    return res.json({ success: true, messages });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/:groupId/members", authMiddleware, async (req: any, res: any) => {
  try {
    const { groupId } = req.params;
    const members = await prisma.userGroup.findMany({
      where: { groupId },
      include: {
        user: {
          select: { id: true, username: true },
        },
      },
    });
    return res.json({ success: true, members });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
