import { useEffect, useRef } from "react";
import { socket } from "../socket";

type NotificationPayload = {
  id: string;
  senderId: string;
  senderName?: string;
  receiverId: string;
  content: string;
  type?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  createdAt: string;
};

type UseNotificationsProps = {
  currentUserId: string | null | undefined;
  selectedUserId: string | null | undefined;
  selectedGroupId: string | null | undefined;
};

declare global {
  interface Window {
    Notification?: {
      requestPermission(status: "granted" | "denied" | "default"): void;
      permission: "granted" | "denied" | "default";
    };
  }
}

export function useNotifications({ currentUserId, selectedUserId, selectedGroupId }: UseNotificationsProps) {
  const permissionRequested = useRef(false);

  useEffect(() => {
    if (!currentUserId) return;

    const requestPermission = async () => {
      if (typeof window === "undefined" || !("Notification" in window)) return;
      if (permissionRequested.current) return;
      permissionRequested.current = true;
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    };

    requestPermission();

    const handleReceive = (msg: NotificationPayload) => {
      if (msg.receiverId !== currentUserId && msg.groupId !== selectedGroupId) return;
      if (msg.senderId === currentUserId) return;
      if (selectedUserId && msg.senderId === selectedUserId) return;
      if (selectedGroupId && msg.groupId === selectedGroupId) return;

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        const title = msg.senderName || "New message";
        const body =
          msg.type === "image"
            ? "📷 Photo"
            : msg.type === "video"
            ? "🎥 Video"
            : msg.type === "file"
            ? "📎 File"
            : msg.content;

        try {
          const notification = new Notification(title, {
            body,
            icon: "/favicon.ico",
            tag: msg.id,
            requireInteraction: false,
          } as NotificationOptions);

          notification.onclick = () => {
            window.focus();
            window.open("/", "_blank");
            notification.close();
          };
        } catch (err) {
          console.error("Notification error:", err);
        }
      }
    };

    socket.on("receive-message", handleReceive);

    return () => {
      socket.off("receive-message", handleReceive);
    };
  }, [currentUserId, selectedUserId, selectedGroupId]);
}
