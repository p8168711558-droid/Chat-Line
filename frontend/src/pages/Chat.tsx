import { useEffect, useRef, useState } from "react";
import { socket } from "../socket";
import { api } from "../api/api";
import { useCall } from "../context/CallContext";
import { useNotifications } from "../hooks/useNotifications";

type Props = {
  currentUser: any;
  selectedUser: any;
  selectedGroup: any;
  onlineUsers: string[];
  onSelectUser: (user: any) => void;
};

type Message = {
  id: string;
  senderId: string;
  receiverId: string | null;
  groupId: string | null;
  content: string;
  delivered: boolean;
  read: boolean;
  createdAt: string;
  type?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
};

const VideoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="14" height="12" rx="2" />
    <path d="M16 10l6-3.5v11L16 14" />
  </svg>
);

const PhoneIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 20l18-8L3 4v6l13 2-13 2v6z" />
  </svg>
);

const PaperClipIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

const SingleTick = ({ color }: { color: string }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13l4 4L19 7" />
  </svg>
);

const DoubleTick = ({ color }: { color: string }) => (
  <svg width="18" height="16" viewBox="0 0 28 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 13l4 4L16 7" />
    <path d="M10 13l4 4L24 7" />
  </svg>
);

const formatLastSeen = (value?: string | Date | null) => {
  if (!value) return "Offline";

  const date = new Date(value);
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffMin < 1) return "Last seen just now";
  if (diffMin < 60) return `Last seen ${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Last seen ${diffHr}h ago`;

  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === yesterday.toDateString()) {
    return `Last seen yesterday at ${time}`;
  }

  return `Last seen ${date.toLocaleDateString()} at ${time}`;
};

export default function Chat({
  currentUser,
  selectedUser,
 selectedGroup,
  onlineUsers,
  onSelectUser: _onSelectUser,
}: Props) {
  const { startCall } = useCall();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isReceiverOnline, setIsReceiverOnline] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(selectedUser.lastSeen || null);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<{ file: File; preview: string } | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTypingEmitRef = useRef(0);
  const typingClearTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingSentRef = useRef<{ tempId: string; fileUrl: string; fileName: string; fileType: string; messageType: string } | null>(null);

  useNotifications({ currentUserId: currentUser.id, selectedUserId: selectedUser?.id, selectedGroupId: selectedGroup?.id });

  // Reset local last-seen snapshot whenever a different contact is opened
  useEffect(() => {
    setLastSeen(selectedUser.lastSeen || null);
    setIsTyping(false);
  }, [selectedUser.id]);

  // Load chat history whenever a different contact is opened, then mark it read
  useEffect(() => {
    let active = true;
    setLoading(true);
    setMessages([]);

    const url = selectedGroup
      ? `/messages/group/${selectedGroup.id}`
      : `/messages/${selectedUser?.id}`;

    api
      .get(url)
      .then((res) => {
        if (active) setMessages(res.data.messages);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    if (!selectedGroup) {
      socket.emit("mark-read", { readerId: currentUser.id, senderId: selectedUser.id });
    }

    return () => {
      active = false;
    };
  }, [selectedUser?.id, selectedGroup?.id, currentUser.id]);

  // Live online status from cached list
  useEffect(() => {
    setIsReceiverOnline(onlineUsers.includes(selectedUser.id));
  }, [onlineUsers, selectedUser.id]);

  // Keep track of whether the open contact is currently online
  useEffect(() => {
    const handleOnlineUsers = (ids: string[]) => {
      setIsReceiverOnline(ids.includes(selectedUser.id));
    };

    socket.on("online-users", handleOnlineUsers);

    return () => {
      socket.off("online-users", handleOnlineUsers);
    };
  }, [selectedUser.id]);

  // Live last-seen update when the open contact disconnects
  useEffect(() => {
    const handleLastSeen = ({ userId, lastSeen: ls }: { userId: string; lastSeen: string }) => {
      if (userId === selectedUser.id) setLastSeen(ls);
    };

    socket.on("user-last-seen", handleLastSeen);

    return () => {
      socket.off("user-last-seen", handleLastSeen);
    };
  }, [selectedUser.id]);

  // Typing indicator from the open contact
  useEffect(() => {
    const handleTyping = ({ senderId }: { senderId: string }) => {
      if (senderId !== selectedUser.id) return;

      setIsTyping(true);

      if (typingClearTimeoutRef.current) clearTimeout(typingClearTimeoutRef.current);
      typingClearTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
    };

    socket.on("typing", handleTyping);

    return () => {
      socket.off("typing", handleTyping);
      if (typingClearTimeoutRef.current) clearTimeout(typingClearTimeoutRef.current);
    };
  }, [selectedUser.id]);

  // Real-time incoming messages + confirmation of our own sent messages, scoped to this conversation
  useEffect(() => {
    const belongsToThisChat = (msg: Message) => {
      if (selectedGroup) {
        return msg.groupId === selectedGroup.id;
      }
      if (selectedUser) {
        return (
          (msg.senderId === selectedUser.id && msg.receiverId === currentUser.id) ||
          (msg.senderId === currentUser.id && msg.receiverId === selectedUser.id)
        );
      }
      return false;
    };

    const handleReceive = (msg: Message) => {
      if (!belongsToThisChat(msg)) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      if (!selectedGroup) {
        socket.emit("mark-read", { readerId: currentUser.id, senderId: selectedUser.id });
      }
    };

    const handleSent = (msg: Message) => {
      if (!belongsToThisChat(msg)) return;
      setMessages((prev) => {
        if (pendingSentRef.current?.tempId) {
          return prev.map((m) => (m.id === pendingSentRef.current!.tempId ? msg : m));
        }
        return [...prev, msg];
      });
      pendingSentRef.current = null;
    };

    const handleMessagesRead = ({ readBy }: { readBy: string }) => {
      if (!selectedUser || readBy !== selectedUser.id) return;
      setMessages((prev) => prev.map((m) => (m.senderId === currentUser.id ? { ...m, read: true } : m)));
    };

    socket.on("receive-message", handleReceive);
    socket.on("message-sent", handleSent);
    socket.on("messages-read", handleMessagesRead);

    return () => {
      socket.off("receive-message", handleReceive);
      socket.off("message-sent", handleSent);
      socket.off("messages-read", handleMessagesRead);
    };
  }, [selectedUser?.id, selectedGroup?.id, currentUser.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleInputChange = (value: string) => {
    setText(value);

    const now = Date.now();
    if (now - lastTypingEmitRef.current > 2000) {
      socket.emit("typing", { senderId: currentUser.id, receiverId: selectedUser.id });
      lastTypingEmitRef.current = now;
    }
  };

  const sendMessage = () => {
    if (!text.trim()) return;

    const payload: any = {
      senderId: currentUser.id,
      content: text.trim(),
    };

    if (selectedGroup) {
      payload.groupId = selectedGroup.id;
      payload.type = "group";
    } else if (selectedUser) {
      payload.receiverId = selectedUser.id;
    }

    socket.emit("send-message", payload);
    setText("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    const preview = isImage ? URL.createObjectURL(file) : "";

    setPendingFile({ file, preview });
    setSendError(null);
  };

  const sendPendingFile = async () => {
    const file = pendingFile?.file;
    if (!file) return;

    setUploading(true);
    setSendError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const targetId = selectedUser?.id || selectedGroup?.id;
      const res = await api.post(`/upload/${targetId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { fileUrl, fileName, fileType, messageType } = res.data;

      const tempId = `temp_${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        senderId: currentUser.id,
        receiverId: selectedGroup ? null : selectedUser?.id || null,
        groupId: selectedGroup?.id || null,
        content: fileName,
        type: messageType,
        fileUrl,
        fileName,
        fileType,
        delivered: false,
        read: false,
        createdAt: new Date().toISOString(),
      };

      pendingSentRef.current = { tempId, fileUrl, fileName, fileType, messageType };
      setMessages((prev) => [...prev, optimisticMessage]);

      socket.emit("send-message", {
        senderId: currentUser.id,
        receiverId: selectedGroup ? null : selectedUser?.id,
        groupId: selectedGroup?.id || null,
        content: fileName,
        type: messageType,
        fileUrl,
        fileName,
        fileType,
      });
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || "Upload failed";
      console.error("Upload failed:", errMsg);
      setSendError(errMsg);
    } finally {
      setUploading(false);
      setPendingFile(null);
      setSendError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const cancelPendingFile = () => {
    if (pendingFile?.preview) URL.revokeObjectURL(pendingFile.preview);
    setPendingFile(null);
    setSendError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Keep preview visible until server confirms message was saved (or error)
  useEffect(() => {
    return () => {
      if (pendingFile?.preview && !pendingSentRef.current) {
        URL.revokeObjectURL(pendingFile.preview);
      }
    };
  }, [pendingFile]);

  const statusText = isTyping ? "Typing..." : isReceiverOnline ? "Online" : formatLastSeen(lastSeen);
  const statusColor = isTyping ? "text-[#4338CA]" : isReceiverOnline ? "text-[#10B981]" : "text-[#B5B5B2]";

  const chatTitle = selectedGroup
    ? selectedGroup.name
    : selectedUser?.username;

  const chatSubtitle = selectedGroup
    ? `${selectedGroup.members?.length || 0} members`
    : (isTyping ? "Typing..." : isReceiverOnline ? "Online" : formatLastSeen(lastSeen));

  const chatSubtitleColor = selectedGroup
    ? "text-[#4A4A4E]"
    : (isTyping ? "text-[#4338CA]" : isReceiverOnline ? "text-[#10B981]" : "text-[#B5B5B2]");

  return (
    <div className="h-full flex flex-col bg-[#FAFAF8]">
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-[#F0F0EE]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-9 w-9 rounded-full bg-[#4338CA] flex items-center justify-center text-white text-xs font-semibold">
              {chatTitle?.slice(0, 2).toUpperCase()}
            </div>
            {!selectedGroup && (
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                  isReceiverOnline ? "bg-[#10B981]" : "bg-[#D1D1CE]"
                }`}
              />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">{chatTitle}</p>
            <p className={`text-xs ${chatSubtitleColor}`}>{chatSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => startCall({ id: selectedUser.id, username: selectedUser.username }, "audio")}
            className="h-9 w-9 flex items-center justify-center rounded-full text-[#4A4A4E] hover:bg-[#F4F4F2] transition"
            aria-label="Voice call"
          >
            <PhoneIcon />
          </button>
          <button
            type="button"
            onClick={() => startCall({ id: selectedUser.id, username: selectedUser.username }, "video")}
            className="h-9 w-9 flex items-center justify-center rounded-full text-[#4A4A4E] hover:bg-[#F4F4F2] transition"
            aria-label="Video call"
          >
            <VideoIcon />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {loading ? (
          <p className="text-xs text-[#B5B5B2] text-center mt-6">Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-[#B5B5B2] text-center mt-6">No messages yet, say hi</p>
        ) : (
          messages.map((m) => {
            const isMine = m.senderId === currentUser.id;
            const tickColor = m.read ? "#38BDF8" : "rgba(255,255,255,0.7)";

            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm ${
                    isMine
                      ? "bg-[#4338CA] text-white rounded-br-sm"
                      : "bg-white border border-[#F0F0EE] text-[#1A1A1A] rounded-bl-sm"
                  }`}
                >
                  {!isMine && selectedGroup && (
                    <p className="text-[10px] font-semibold text-[#4338CA] mb-1">
                      {m.senderId}
                    </p>
                  )}
                  {m.type === "image" && (
                    <img
                      src={m.fileUrl}
                      alt={m.fileName}
                      className="max-h-48 rounded-lg mb-1"
                      onError={(e) => {
                        console.error("Image load error:", m.fileUrl);
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  )}
                  {m.type === "video" && (
                    <video controls src={m.fileUrl} className="max-h-48 rounded-lg mb-1" />
                  )}
                  {m.type === "file" && (
                    <a
                      href={m.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 mb-1 text-xs underline"
                    >
                      {m.fileName || "Download file"}
                    </a>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 ${
                      isMine ? "text-white/70" : "text-[#B5B5B2]"
                    }`}
                  >
                    <span className="text-[10px]">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isMine && !selectedGroup && (
                      (m.delivered || m.read ? (
                        <DoubleTick color={tickColor} />
                      ) : (
                        <SingleTick color="rgba(255,255,255,0.7)" />
                      ))
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#F0F0EE] rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B5B5B2] animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#B5B5B2] animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-[#B5B5B2] animate-bounce" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="shrink-0 px-4 py-3 bg-white border-t border-[#F0F0EE]">
        {pendingFile ? (
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,video/*,.pdf"
            />
            <span className="flex-1 text-xs text-[#1A1A1A] truncate">{pendingFile.file.name}</span>
            {sendError && <span className="text-[10px] text-[#EF4444]">{sendError}</span>}
            <button
              type="button"
              onClick={cancelPendingFile}
              disabled={uploading}
              className="h-8 px-3 rounded-full text-xs text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#FEF2F2] transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={sendPendingFile}
              disabled={uploading}
              className="h-8 px-4 rounded-full text-xs text-white bg-[#4338CA] hover:bg-[#372DB0] transition disabled:opacity-50"
            >
              {uploading ? "Sending..." : "Send"}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,video/*,.pdf"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full text-[#4A4A4E] hover:bg-[#F4F4F2] transition"
              aria-label="Attach file"
            >
              <PaperClipIcon />
            </button>
            <input
              value={text}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
              placeholder="Type a message..."
              className="flex-1 rounded-full border border-[#E5E5E3] bg-[#FAFAF8] px-4 py-2.5 text-sm text-[#1A1A1A] placeholder-[#B5B5B2] outline-none focus:border-[#4338CA] focus:bg-white focus:ring-2 focus:ring-[#4338CA]/10 transition"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!text.trim()}
              className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-[#4338CA] text-white hover:bg-[#372DB0] active:bg-[#2F27A0] transition disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Send"
            >
              <SendIcon />
            </button>
          </div>
        )}
      </div>

      {pendingFile && (
        <div className="absolute inset-0 z-20 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#F0F0EE]">
              <p className="text-sm font-semibold text-[#1A1A1A] truncate">Preview</p>
              <button
                type="button"
                onClick={cancelPendingFile}
                disabled={uploading}
                className="text-xs text-[#EF4444] hover:text-[#DC2626] transition disabled:opacity-50"
              >
                Remove
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-[#F4F4F2] flex items-center justify-center">
              {pendingFile.file.type.startsWith("image/") && pendingFile.preview ? (
                <img src={pendingFile.preview} alt="preview" className="max-w-full max-h-[50vh] object-contain" />
              ) : pendingFile.file.type.startsWith("video/") ? (
                <video src={pendingFile.preview || URL.createObjectURL(pendingFile.file)} controls className="max-w-full max-h-[50vh]" />
              ) : (
                <div className="p-6 text-center text-[#1A1A1A]">
                  <p className="text-sm font-medium">{pendingFile.file.name}</p>
                  <p className="text-xs text-[#8A8A8A] mt-1">{(pendingFile.file.size / 1024).toFixed(1)} KB</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-[#F0F0EE]">
              <button
                type="button"
                onClick={sendPendingFile}
                disabled={uploading}
                className="h-9 px-5 rounded-full text-sm text-white bg-[#4338CA] hover:bg-[#372DB0] transition disabled:opacity-50"
              >
                {uploading ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
