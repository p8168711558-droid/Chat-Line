import { useEffect, useState } from "react";
import Login from "./pages/Login";
import Users from "./pages/Users";
import { socket } from "./socket";
import Chat from "./pages/Chat";
import { api } from "./api/api";
import { CallProvider } from "./context/CallContext";

function App() {
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [connected, setConnected] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<string[]>([]);

  // Runs once on app load (including page refresh): if a token is saved,
  // validate it against the backend and restore the session.
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

    socket.connect();

    socket.on("connect", () => {
      console.log("Connected:", socket.id);
      setConnected(true);
      socket.emit("user-online", user.id);
    });

    socket.on("online-users", (ids: string[]) => {
      setOnlineUserIds(ids);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.disconnect();
    };
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    socket.disconnect();
    setUser(null);
    setSelectedUser(null);
  }

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
      <div className="min-h-screen bg-[#FAFAF8]">
        <header className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-[#F0F0EE]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#4338CA] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 11.5a8.5 8.5 0 0 1-12.36 7.58L3 20l1.07-5.4A8.5 8.5 0 1 1 21 11.5Z"
                  fill="white"
                  opacity="0.95"
                />
              </svg>
            </div>
            <span className="font-semibold text-[#1A1A1A] tracking-tight">ChatLine</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-[#4A4A4E]">{user.username}</span>

            <span
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                connected ? "bg-[#ECFDF5] text-[#047857]" : "bg-[#FEF2F2] text-[#B91C1C]"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-[#10B981]" : "bg-[#EF4444]"}`} />
              {connected ? "Connected" : "Disconnected"}
            </span>

            <button
              onClick={handleLogout}
              className="text-xs font-medium text-[#8A8A8E] hover:text-[#1A1A1A] transition"
            >
              Log out
            </button>
          </div>
        </header>

        <div className="flex" style={{ height: "calc(100vh - 57px)" }}>
          <Users
            currentUser={user}
            selectedUser={selectedUser}
            selectedGroup={selectedGroup}
            onSelectUser={setSelectedUser}
            onSelectGroup={setSelectedGroup}
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
              <div className="h-full flex items-center justify-center text-[#B5B5B2] text-sm">
                Select someone from the list to start chatting
              </div>
            )}
          </div>
        </div>
      </div>
    </CallProvider>
  );
}

export default App;
