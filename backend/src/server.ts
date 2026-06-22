import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { onlineUsers } from "./sockets/onlineUsers";
import { setIO } from "./sockets/io";
import { pairCall, unpairCall } from "./sockets/callPairs";
import userRoutes from "./routes/user.routes";
import messageRoutes from "./routes/message.routes";
import authRoutes from "./routes/auth.routes";
import uploadRoutes from "./routes/upload.routes";
import groupRoutes from "./routes/group.routes";
import { prisma } from "./config/prisma";
import fs from "fs/promises";
import path from "path";

dotenv.config();

const app = express();
const uploadDir = path.join(process.cwd(), "uploads");

app.use(helmet());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "https://capable-healing-production-d365.up.railway.app"
    ],
    credentials: true,
  })
);

app.use(express.json());

app.use("/uploads", express.static(uploadDir));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/groups", groupRoutes);

app.get("/api/files/:key", async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const safeKey = path.basename(key);
    const filePath = path.join(uploadDir, safeKey);

    const stats = await fs.stat(filePath);
    const ext = path.extname(safeKey).toLowerCase();

    const mimeMap: Record<string, string> = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".webp": "image/webp",
      ".mp4": "video/mp4",
      ".mov": "video/quicktime",
      ".webm": "video/webm",
      ".pdf": "application/pdf",
    };

    const contentType = mimeMap[ext] || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(safeKey)}"`
    );

    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
  } catch (error: any) {
    console.error("File download error:", error);
    return res.status(404).json({ success: false, message: "File not found" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Backend Running" });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:3000",
      "https://capable-healing-production-d365.up.railway.app"
    ],
    credentials: true,
  },
});

setIO(io);

io.on("connection", (socket) => {
  socket.on("send-message", async (data) => {
    try {
      const { senderId, receiverId, groupId, content, type = "text", fileUrl, fileName, fileType } = data;

      const message = await prisma.message.create({
        data: {
          senderId,
          receiverId,
          groupId,
          content,
          type,
          fileUrl,
          fileName,
          fileType,
        } as any,
      });

      if (groupId) {
        const members = await prisma.userGroup.findMany({
          where: { groupId },
          select: { userId: true },
        });

        const recipientIds = members
          .map((m) => m.userId)
          .filter((id) => id !== senderId);

        const onlineRecipients = recipientIds.filter((id) => onlineUsers.has(id));
        Promise.all(
          onlineRecipients.map((id) =>
            io.to(onlineUsers.get(id) as string).emit("receive-message", message)
          )
        ).catch(() => {});

        socket.emit("message-sent", message);
        return;
      }

      const receiverSocketId = onlineUsers.get(receiverId as string);
      const isDelivered = !!receiverSocketId;

      await prisma.message.update({
        where: { id: message.id },
        data: { delivered: isDelivered },
      });

      const updated = { ...message, delivered: isDelivered };

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive-message", updated);
      }

      socket.emit("message-sent", updated);
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("typing", ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("typing", { senderId });
    }
  });

  socket.on("mark-read", async ({ readerId, senderId }) => {
    try {
      await prisma.message.updateMany({
        where: { senderId, receiverId: readerId, read: false },
        data: { read: true },
      });

      const senderSocketId = onlineUsers.get(senderId);
      if (senderSocketId) {
        io.to(senderSocketId).emit("messages-read", { readBy: readerId });
      }
    } catch (error) {
      console.log(error);
    }
  });

  socket.on("call-user", ({ to, from, fromName, offer, callType }) => {
    const targetSocketId = onlineUsers.get(to);
    if (!targetSocketId) {
      socket.emit("call-failed", { reason: "User is offline" });
      return;
    }
    pairCall(from, to);
    io.to(targetSocketId).emit("incoming-call", { from, fromName, offer, callType });
  });

  socket.on("answer-call", ({ to, answer }) => {
    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-answered", { answer });
    }
  });

  socket.on("reject-call", ({ to, reason }) => {
    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-rejected", { reason });
    }
    unpairCall(to);
  });

  socket.on("end-call", ({ to }) => {
    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("call-ended");
    }
    unpairCall(to);
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    const targetSocketId = onlineUsers.get(to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("ice-candidate", { candidate });
    }
  });

  console.log("Socket Connected:", socket.id);

  socket.on("user-online", (userId: string) => {
    socket.data.userId = userId;
    onlineUsers.set(userId, socket.id);
    console.log("Online Users:", onlineUsers.size);
    io.emit("online-users", Array.from(onlineUsers.keys()));
  });

  socket.on("disconnect", async () => {
    const userId = socket.data.userId as string | undefined;

    if (userId) {
      onlineUsers.delete(userId);

      const lastSeen = new Date();

      try {
        await prisma.user.update({
          where: { id: userId },
          data: { lastSeen },
        });
      } catch (error) {
        console.log(error);
      }

      io.emit("online-users", Array.from(onlineUsers.keys()));
      io.emit("user-last-seen", { userId, lastSeen });

      const callPartner = unpairCall(userId);
      if (callPartner) {
        const partnerSocketId = onlineUsers.get(callPartner);
        if (partnerSocketId) {
          io.to(partnerSocketId).emit("call-ended");
        }
      }
    }

    console.log("Socket Disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

fs.mkdir(uploadDir, { recursive: true }).catch(() => {});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
