import { useState, useRef, useEffect } from "react";

type Tab = "chat" | "email" | "call" | "documentation";
export type ActiveAction =
  | "chat"
  | "email_reply"
  | "email_drafting"
  | "call_voice"
  | "call_video"
  | "doc_generate"
  | "doc_read";

type SidebarProps = {
  user: any;
  connected: boolean;
  onLogout: () => void;
  activeAction: ActiveAction;
  onActionChange: (action: ActiveAction) => void;
};

// Icons
const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const EmailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const CallIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const DocIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);

export default function Sidebar({ user, connected, onLogout, activeAction, onActionChange }: SidebarProps) {
  const [expandedTab, setExpandedTab] = useState<Tab | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTabClick = (tab: Tab) => {
    if (tab === "chat") {
      setExpandedTab(null);
      onActionChange("chat");
    } else {
      setExpandedTab(expandedTab === tab ? null : tab);
    }
  };

  return (
    <div className="w-64 bg-white border-r border-[#F0F0EE] flex flex-col h-full shrink-0">
      {/* App Logo */}
      <div className="px-6 py-5 flex items-center gap-3 border-b border-[#F0F0EE]">
        <div className="h-8 w-8 rounded-lg bg-[#4338CA] flex items-center justify-center shadow-md">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 11.5a8.5 8.5 0 0 1-12.36 7.58L3 20l1.07-5.4A8.5 8.5 0 1 1 21 11.5Z"
              fill="white"
              opacity="0.95"
            />
          </svg>
        </div>
        <span className="font-bold text-[#1A1A1A] text-lg tracking-tight">ChatLine</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {/* Chat */}
        <button
          onClick={() => handleTabClick("chat")}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
            activeAction === "chat" ? "bg-[#EEF2FF] text-[#4338CA] font-medium" : "text-[#4A4A4E] hover:bg-[#F4F4F2]"
          }`}
        >
          <ChatIcon />
          <span>Chat</span>
        </button>

        {/* Email */}
        <div>
          <button
            onClick={() => handleTabClick("email")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
              expandedTab === "email" ? "text-[#1A1A1A] font-medium" : "text-[#4A4A4E] hover:bg-[#F4F4F2]"
            }`}
          >
            <div className="flex items-center gap-3">
              <EmailIcon />
              <span>Email</span>
            </div>
            {expandedTab === "email" ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>
          {expandedTab === "email" && (
            <div className="ml-9 mt-1 space-y-1">
              <button
                onClick={() => onActionChange("email_reply")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeAction === "email_reply" ? "bg-[#EEF2FF] text-[#4338CA] font-medium" : "text-[#4A4A4E] hover:bg-[#F4F4F2]"
                }`}
              >
                Reply
              </button>
              <button
                onClick={() => onActionChange("email_drafting")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeAction === "email_drafting" ? "bg-[#EEF2FF] text-[#4338CA] font-medium" : "text-[#4A4A4E] hover:bg-[#F4F4F2]"
                }`}
              >
                Drafting
              </button>
            </div>
          )}
        </div>

        {/* Call */}
        <div>
          <button
            onClick={() => handleTabClick("call")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
              expandedTab === "call" ? "text-[#1A1A1A] font-medium" : "text-[#4A4A4E] hover:bg-[#F4F4F2]"
            }`}
          >
            <div className="flex items-center gap-3">
              <CallIcon />
              <span>Call</span>
            </div>
            {expandedTab === "call" ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>
          {expandedTab === "call" && (
            <div className="ml-9 mt-1 space-y-1">
              <button
                onClick={() => onActionChange("call_voice")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeAction === "call_voice" ? "bg-[#EEF2FF] text-[#4338CA] font-medium" : "text-[#4A4A4E] hover:bg-[#F4F4F2]"
                }`}
              >
                Voice Call
              </button>
              <button
                onClick={() => onActionChange("call_video")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeAction === "call_video" ? "bg-[#EEF2FF] text-[#4338CA] font-medium" : "text-[#4A4A4E] hover:bg-[#F4F4F2]"
                }`}
              >
                Video Call
              </button>
            </div>
          )}
        </div>

        {/* Documentation */}
        <div>
          <button
            onClick={() => handleTabClick("documentation")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
              expandedTab === "documentation" ? "text-[#1A1A1A] font-medium" : "text-[#4A4A4E] hover:bg-[#F4F4F2]"
            }`}
          >
            <div className="flex items-center gap-3">
              <DocIcon />
              <span>Documentation</span>
            </div>
            {expandedTab === "documentation" ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </button>
          {expandedTab === "documentation" && (
            <div className="ml-9 mt-1 space-y-1">
              <button
                onClick={() => onActionChange("doc_generate")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeAction === "doc_generate" ? "bg-[#EEF2FF] text-[#4338CA] font-medium" : "text-[#4A4A4E] hover:bg-[#F4F4F2]"
                }`}
              >
                Doc Generate
              </button>
              <button
                onClick={() => onActionChange("doc_read")}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeAction === "doc_read" ? "bg-[#EEF2FF] text-[#4338CA] font-medium" : "text-[#4A4A4E] hover:bg-[#F4F4F2]"
                }`}
              >
                Doc Read
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Section */}
      <div className="relative border-t border-[#F0F0EE] p-4 bg-[#FAFAF8]" ref={profileRef}>
        {showProfileMenu && (
          <div className="absolute bottom-full mb-2 left-4 right-4 bg-white border border-[#E5E5E3] rounded-xl shadow-lg overflow-hidden z-10">
            <button
              onClick={() => {
                alert("API Key: YOUR_API_KEY_HERE");
                setShowProfileMenu(false);
              }}
              className="w-full text-left px-4 py-3 text-sm text-[#1A1A1A] hover:bg-[#F4F4F2] transition border-b border-[#F0F0EE]"
            >
              Api key
            </button>
            <button
              onClick={() => {
                onLogout();
                setShowProfileMenu(false);
              }}
              className="w-full text-left px-4 py-3 text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition"
            >
              Logout
            </button>
          </div>
        )}

        <button
          onClick={() => setShowProfileMenu(!showProfileMenu)}
          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-[#F0F0EE] transition"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="h-9 w-9 rounded-full bg-[#4338CA] flex items-center justify-center text-white text-xs font-semibold">
                {user?.username?.slice(0, 2).toUpperCase()}
              </div>
              <span
                className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#FAFAF8] ${
                  connected ? "bg-[#10B981]" : "bg-[#EF4444]"
                }`}
              />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-[#1A1A1A] truncate max-w-[100px]">{user?.username}</p>
              <p className={`text-[10px] font-medium ${connected ? "text-[#10B981]" : "text-[#EF4444]"}`}>
                {connected ? "Connected" : "Disconnected"}
              </p>
            </div>
          </div>
          <ChevronUpIcon />
        </button>
      </div>
    </div>
  );
}
