import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Users from "./pages/Users";
import { socket } from "./socket";
import Chat from "./pages/Chat";
import { api } from "./api/api";
import { CallProvider, useCall } from "./context/CallContext";
import Sidebar from "./components/Sidebar";
import type { ActiveAction } from "./components/Sidebar";
import EmailReply from "./components/EmailReply";
import DocGenerate from "./components/DocGenerate";
import DocRead from "./components/DocRead";

function AppContent({
  user,
  connected,
  onLogout,
}: {
  user: any;
  connected: boolean;
  onLogout: () => void;
}) {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);
  const [activeAction, setActiveAction] = useState<ActiveAction>("chat");

  const { startCall } = useCall();

  useEffect(() => {
    if (!user) return;

    socket.connect();

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
      socket.emit("user-online", user.id);
    });

    socket.on("online-users", (ids: string[]) => {
      setOnlineUserIds(ids);
    });

    return () => {
      socket.off("connect");
      socket.disconnect();
    };
  }, [user]);

  const renderContent = () => {
    switch (activeAction) {
      case "chat":
        return (
          <>
            <Users
              currentUser={user}
              selectedUser={selectedUser}
              selectedGroup={selectedGroup}
              onSelectUser={setSelectedUser}
              onSelectGroup={setSelectedGroup}
              mode="chat"
            />
            <div className="flex-1">
              {selectedUser || selectedGroup ? (
                <Chat
                  currentUser={user}
                  selectedUser={selectedUser}
                  selectedGroup={selectedGroup}
                  onlineUsers={onlineUserIds}
                  onSelectUser={setSelectedUser}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-[#B5B5B2] text-sm bg-white">
                  Select someone from the list to start chatting
                </div>
              )}
            </div>
          </>
        );
      case "call_voice":
      case "call_video":
        return (
          <>
            <Users
              currentUser={user}
              selectedUser={null}
              selectedGroup={null}
              onSelectUser={() => {}}
              onSelectGroup={() => {}}
              mode={activeAction}
              onCallUser={(u, type) => startCall({ id: u.id, username: u.username }, type)}
            />
            <div className="flex-1 h-full flex items-center justify-center bg-white text-[#B5B5B2] text-sm">
              Select a contact to initiate a {activeAction === "call_voice" ? "Voice" : "Video"} Call
            </div>
          </>
        );
      case "email_reply":
        return <EmailReply userEmail={user.email} />;
      case "email_drafting":
        return (
          <div className="flex-1 h-full flex items-center justify-center bg-white">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">Email - Drafting</h2>
              <p className="text-sm text-[#8A8A8E]">This feature is under construction.</p>
            </div>
          </div>
        );
      case "doc_generate":
        return <DocGenerate />;
      case "doc_read":
        return <DocRead />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#FAFAF8] overflow-hidden">
      <Sidebar
        user={user}
        connected={connected}
        onLogout={onLogout}
        activeAction={activeAction}
        onActionChange={setActiveAction}
      />
      {renderContent()}
    </div>
  );
}

function App() {
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setCheckingAuth(false);
      return;
    }

    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data.user);
      })
      .catch(() => {
        localStorage.removeItem("token");
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, []);

  useEffect(() => {
    if (!user) return;

    // Use a separate handler for 'connect'/'disconnect' to manage 'connected' state properly
    // so it doesn't fight with the one inside AppContent
    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    // Initial check in case it's already connected (AppContent calls connect)
    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    socket.disconnect();
    setUser(null);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
        <div className="flex items-center gap-2 text-[#8A8A8E] text-sm">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z" />
          </svg>
          Checking session...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <CallProvider currentUser={user}>
      <AppContent user={user} connected={connected} onLogout={handleLogout} />
    </CallProvider>
  );
}

export default App;
