import { Server, Socket } from "socket.io";
import { onlineUsers } from "./onlineUsers";

export const registerCallHandlers = (
  io: Server,
  socket: Socket
) => {

  socket.on("call-user", (data) => {
    const receiverSocketId =
      onlineUsers.get(data.to);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "incoming-call",
        data
      );
    }
  });

  socket.on("call-accepted", (data) => {
    const callerSocketId =
      onlineUsers.get(data.to);

    if (callerSocketId) {
      io.to(callerSocketId).emit(
        "call-accepted",
        data
      );
    }
  });

  socket.on("call-rejected", (data) => {
    const callerSocketId =
      onlineUsers.get(data.to);

    if (callerSocketId) {
      io.to(callerSocketId).emit(
        "call-rejected"
      );
    }
  });

  socket.on("webrtc-offer", (data) => {
    const receiverSocketId =
      onlineUsers.get(data.to);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "webrtc-offer",
        data
      );
    }
  });

  socket.on("webrtc-answer", (data) => {
    const receiverSocketId =
      onlineUsers.get(data.to);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "webrtc-answer",
        data
      );
    }
  });

  socket.on("ice-candidate", (data) => {
    const receiverSocketId =
      onlineUsers.get(data.to);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "ice-candidate",
        data
      );
    }
  });

  socket.on("end-call", (data) => {
    const receiverSocketId =
      onlineUsers.get(data.to);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "call-ended"
      );
    }
  });
};