import { Response } from "express";
import { prisma } from "../config/prisma";
import { AuthRequest } from "../middlewares/auth.middleware";

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const myId = req.user.userId;

    const users = await prisma.user.findMany({
      where: {
        id: { not: myId },
      },
      select: {
        id: true,
        username: true,
        email: true,
        lastSeen: true,
      },
      orderBy: {
        username: "asc",
      },
    });

    // Pull every message that involves me once, then aggregate in memory
    // instead of running a last-message + unread-count query per contact.
    const messages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: myId }, { receiverId: myId }],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const lastMessageMap = new Map<string, (typeof messages)[number]>();
    const unreadCountMap = new Map<string, number>();

    for (const msg of messages) {
      const otherId =
  msg.senderId === myId ? msg.receiverId : msg.senderId;

if (!otherId) continue;

if (!lastMessageMap.has(otherId)) {
  lastMessageMap.set(otherId, msg);
}

if (msg.receiverId === myId && !msg.read) {
  unreadCountMap.set(
    otherId,
    (unreadCountMap.get(otherId) || 0) + 1
  );
}
    }

    const enrichedUsers = users.map((u) => ({
      ...u,
      lastMessage: lastMessageMap.get(u.id) || null,
      unreadCount: unreadCountMap.get(u.id) || 0,
    }));

    return res.json({
      success: true,
      users: enrichedUsers,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};