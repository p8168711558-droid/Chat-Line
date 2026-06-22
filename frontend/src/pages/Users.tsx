import { useEffect, useState } from "react";
import { api } from "../api/api";
import { socket } from "../socket";

type Props = {
  currentUser: any;
  selectedUser: any;
  selectedGroup: any;
  onSelectUser: (user: any) => void;
  onSelectGroup: (group: any) => void;
};

type User = {
  id: string;
  username: string;
  email: string;
  isOnline: boolean;
  lastSeen?: string;
};

type Group = {
  id: string;
  name: string;
  members: { user: User }[];
};

const sortByRecent = (list: any[]) => {
  return [...list].sort((a, b) => {
    const at = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
    const bt = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
    if (at !== bt) return bt - at;
    return a.username?.localeCompare(b.username) ?? 0;
  });
};

const formatPreviewTime = (dateStr: string) => {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
};

export default function Users({ currentUser, selectedUser, selectedGroup, onSelectUser, onSelectGroup }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Create group flow
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchGroups();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users");
      setUsers(sortByRecent(res.data.users));
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get("/groups");
      setGroups(res.data.groups || []);
    } catch (err) {
      console.error("Failed to fetch groups", err);
    }
  };

  const handleMemberToggle = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedMembers.length === 0) return;

    setCreatingGroup(true);
    try {
      const res = await api.post("/groups", {
        name: groupName.trim(),
        memberIds: selectedMembers,
      });
      const newGroup = res.data.group;
      setGroups((prev) => [newGroup, ...prev]);
      resetCreateForm();
    } catch (err: any) {
      console.error("Failed to create group", err.response?.data || err.message);
    } finally {
      setCreatingGroup(false);
    }
  };

  const resetCreateForm = () => {
    setShowCreateGroup(false);
    setGroupName("");
    setSelectedMembers([]);
  };

  // Online status
  useEffect(() => {
    const handleOnlineUsers = (ids: string[]) => {
      setOnlineIds(new Set(ids));
    };
    socket.on("online-users", handleOnlineUsers);
    return () => socket.off("online-users", handleOnlineUsers);
  }, []);

  // New user registered
  useEffect(() => {
    const handleNewUser = (newUser: User) => {
      setUsers((prev) => {
        if (prev.some((u) => u.id === newUser.id)) return prev;
        return sortByRecent([...prev, { ...newUser, lastMessage: null, unreadCount: 0 }]);
      });
    };
    socket.on("new-user", handleNewUser);
    return () => socket.off("new-user", handleNewUser);
  }, []);

  // Last seen updates
  useEffect(() => {
    const handleLastSeen = ({ userId, lastSeen }: { userId: string; lastSeen: string }) => {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, lastSeen } : u)));
    };
    socket.on("user-last-seen", handleLastSeen);
    return () => socket.off("user-last-seen", handleLastSeen);
  }, []);

  // Preview + unread badge
  useEffect(() => {
    const updatePreview = (msg: any, isIncoming: boolean) => {
      const chatKey = msg.groupId || (isIncoming ? msg.senderId : msg.receiverId);
      const isGroup = !!msg.groupId;
      const targetId = isGroup ? msg.groupId : (isIncoming ? msg.senderId : msg.receiverId);

      setUsers((prev) => {
        const updated = prev.map((u) => {
          if (u.id !== targetId) return u;
          const isOpenChat = selectedUser?.id === otherId;
          const bumpUnread = isIncoming && !isOpenChat;
          return {
            ...u,
            lastMessage: msg,
            unreadCount: bumpUnread ? (u.unreadCount || 0) + 1 : u.unreadCount,
          };
        });
        return sortByRecent(updated);
      });
      
      setGroups((prev) => {
        return prev.map((g) => {
          if (g.id !== targetId) return g;
          return { ...g, lastMessage: msg };
        });
      });
    };

    const handleReceive = (msg: any) => updatePreview(msg, true);
    const handleSent = (msg: any) => updatePreview(msg, false);

    socket.on("receive-message", handleReceive);
    socket.on("message-sent", handleSent);

    return () => {
      socket.off("receive-message", handleReceive);
      socket.off("message-sent", handleSent);
    };
  }, [selectedUser?.id, selectedGroup?.id]);

  const handleSelectUser = (u: User) => {
    onSelectUser(u);
  };

  const onlineCount = users.filter((u) => onlineIds.has(u.id)).length;

  return (
    <div className="w-80 shrink-0 bg-white border-r border-[#F0F0EE] flex flex-col">
      <div className="px-5 py-4 border-b border-[#F0F0EE] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#1A1A1A]">Chats</h2>
          <p className="text-xs text-[#8A8A8E] mt-0.5">
            {onlineCount} online
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!showCreateGroup) {
              setShowCreateGroup(true);
              setSelectedMembers([]);
              setGroupName("");
            } else {
              resetCreateForm();
            }
          }}
          className={`h-8 w-8 flex items-center justify-center rounded-full transition text-sm ${
            showCreateGroup
              ? "bg-[#FEE2E2] text-[#EF4444] hover:bg-[#FECACA]"
              : "bg-[#4338CA] text-white hover:bg-[#372DB0]"
          }`}
          aria-label={showCreateGroup ? "Cancel" : "Create group"}
        >
          {showCreateGroup ? "×" : "+"}
        </button>
      </div>

      {showCreateGroup && (
        <div className="shrink-0 border-b border-[#F0F0EE] bg-[#FAFAF8]">
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-[#1A1A1A] mb-2">
              {!groupName ? "Select members for new group" : "Group name"}
            </p>

            {!groupName ? (
              <>
                <div className="max-h-48 overflow-y-auto space-y-1 mb-3">
                  {users.map((u) => {
                    const checked = selectedMembers.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleMemberToggle(u.id)}
                          className="h-4 w-4 rounded border-[#E5E5E3] text-[#4338CA] focus:ring-[#4338CA]"
                        />
                        <div className="relative">
                          <div className="h-8 w-8 rounded-full bg-[#4338CA] flex items-center justify-center text-white text-[10px] font-semibold">
                            {u.username.slice(0, 2).toUpperCase()}
                          </div>
                          {u.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-2 border-[#FAFAF8] bg-[#10B981]" />
                          )}
                        </div>
                        <span className="text-xs text-[#1A1A1A] truncate flex-1">{u.username}</span>
                      </label>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[#8A8A8E]">
                    {selectedMembers.length} selected
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={resetCreateForm}
                      className="h-7 px-3 rounded-full text-[10px] text-[#4A4A4E] border border-[#E5E5E3] hover:bg-[#F4F4F2] transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedMembers.length > 0) {
                          // Will show name input via the groupName check below
                          setGroupName(" ");
                        }
                      }}
                      disabled={selectedMembers.length === 0}
                      className="h-7 px-3 rounded-full text-[10px] text-white bg-[#4338CA] hover:bg-[#372DB0] transition disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={handleCreateGroup}>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name"
                  autoFocus
                  onFocus={(e) => e.target.select()}
                  className="w-full rounded-lg border border-[#E5E5E3] bg-white px-3 py-2 text-xs text-[#1A1A1A] placeholder-[#B5B5B2] outline-none focus:border-[#4338CA] mb-2"
                />
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[#8A8A8E]">
                    {selectedMembers.length} members
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGroupName("")}
                      className="h-7 px-3 rounded-full text-[10px] text-[#4A4A4E] border border-[#E5E5E3] hover:bg-[#F4F4F2] transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={creatingGroup || !groupName.trim()}
                      className="h-7 px-3 rounded-full text-[10px] text-white bg-[#4338CA] hover:bg-[#372DB0] transition disabled:opacity-40"
                    >
                      {creatingGroup ? "Creating..." : "Create"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-5 py-4 text-xs text-[#B5B5B2]">Loading...</p>
        ) : (
          <>
            {groups.length > 0 && (
              <div className="border-b border-[#F0F0EE]">
                <div className="px-5 py-2">
                  <h3 className="text-[10px] font-semibold text-[#8A8A8E] uppercase tracking-wide">Groups</h3>
                </div>
                {groups.map((g) => {
                  const isSelected = selectedGroup?.id === g.id;
                  const memberNames = (g.members || [])
                    .map((m: any) => m.user?.username)
                    .filter(Boolean)
                    .join(", ");

                  return (
                    <button
                      key={g.id}
                      onClick={() => onSelectGroup(g)}
                      className={`w-full flex items-center gap-3 px-5 py-2.5 text-left transition ${
                        isSelected ? "bg-[#EEF2FF]" : "hover:bg-[#FAFAF8]"
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="h-10 w-10 rounded-full bg-[#6366F1] flex items-center justify-center text-white text-xs font-semibold">
                          {g.name.slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#1A1A1A] truncate">{g.name}</p>
                        <p className="text-[10px] text-[#8A8A8E] truncate">
                          {g.members?.length || 0} members
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div>
              <div className="px-5 py-2">
                <h3 className="text-[10px] font-semibold text-[#8A8A8E] uppercase tracking-wide">Contacts</h3>
              </div>
              {users.length === 0 && groups.length === 0 ? (
                <p className="px-5 py-4 text-xs text-[#B5B5B2]">No users yet.</p>
              ) : null}
              {users.map((u) => {
                const isOnline = onlineIds.has(u.id);
                const isSelected = selectedUser?.id === u.id;
                const preview = u.lastMessage
                  ? `${u.lastMessage.senderId === currentUser.id ? "You: " : ""}${u.lastMessage.content}`
                  : isOnline
                  ? "Online"
                  : "Offline";

                return (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    className={`w-full flex items-center gap-3 px-5 py-2 text-left transition ${
                      isSelected ? "bg-[#EEF2FF]" : "hover:bg-[#FAFAF8]"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div className="h-9 w-9 rounded-full bg-[#4338CA] flex items-center justify-center text-white text-xs font-semibold">
                        {u.username.slice(0, 2).toUpperCase()}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                          isOnline ? "bg-[#10B981]" : "bg-[#D1D1CE]"
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[#1A1A1A] truncate">{u.username}</p>
                      <p className="text-[10px] text-[#8A8A8E] truncate mt-0.5">{preview}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
