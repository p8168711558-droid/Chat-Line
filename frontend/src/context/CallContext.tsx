import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { socket } from "../socket";

type CallType = "audio" | "video";
type CallStatus = "idle" | "outgoing" | "incoming" | "connected";

type RemoteUser = {
  id: string;
  username: string;
};

type CallContextValue = {
  callStatus: CallStatus;
  callType: CallType | null;
  remoteUser: RemoteUser | null;
  startCall: (user: RemoteUser, type: CallType) => void;
};

const CallContext = createContext<CallContextValue | null>(null);

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within a CallProvider");
  return ctx;
};

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const PhoneIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92Z" />
  </svg>
);

const PhoneOffIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45c.86.32 1.79.55 2.81.7a2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.33A19.79 19.79 0 0 1 2.05 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91" />
    <path d="M1 1l22 22" />
  </svg>
);

const MicIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);

const MicOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 5.12 2.12" />
    <path d="M19 10v2a7 7 0 0 1-.34 2.16" />
    <path d="M5 10v2a7 7 0 0 0 7 7c.68 0 1.33-.1 1.95-.28" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const VideoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="14" height="12" rx="2" />
    <path d="M16 10l6-3.5v11L16 14" />
  </svg>
);

const VideoOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="14" height="12" rx="2" />
    <path d="M16 10l6-3.5v11L16 14" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export function CallProvider({
  currentUser,
  children,
}: {
  currentUser: any;
  children: ReactNode;
}) {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [callType, setCallType] = useState<CallType | null>(null);
  const [remoteUser, setRemoteUser] = useState<RemoteUser | null>(null);
  const [callError, setCallError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [duration, setDuration] = useState(0);

  const callStatusRef = useRef<CallStatus>("idle");
  const remoteUserRef = useRef<RemoteUser | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const incomingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const ringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const RING_TIMEOUT_MS = 30000;

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    callStatusRef.current = callStatus;
  }, [callStatus]);

  useEffect(() => {
    remoteUserRef.current = remoteUser;
  }, [remoteUser]);

  useEffect(() => {
    if (callStatus !== "connected") {
      setDuration(0);
      return;
    }
    const id = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(id);
  }, [callStatus]);

  const flashError = (msg: string) => {
    setCallError(msg);
    setTimeout(() => setCallError(null), 3000);
  };

  const resetCallState = () => {
    if (ringTimeoutRef.current) {
      clearTimeout(ringTimeoutRef.current);
      ringTimeoutRef.current = null;
    }

    peerConnectionRef.current?.close();
    peerConnectionRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;

    pendingCandidatesRef.current = [];
    incomingOfferRef.current = null;

    setCallStatus("idle");
    setCallType(null);
    setRemoteUser(null);
    setIsMuted(false);
    setIsCameraOff(false);
  };

  const createPeerConnection = (otherUserId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", { to: otherUserId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      const [stream] = e.streams;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
    };

    return pc;
  };

  const startCall = async (user: RemoteUser, type: CallType) => {
    if (callStatusRef.current !== "idle") return;

    try {
      setRemoteUser(user);
      setCallType(type);
      setCallStatus("outgoing");

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === "video",
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = createPeerConnection(user.id);
      peerConnectionRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call-user", {
        to: user.id,
        from: currentUser.id,
        fromName: currentUser.username,
        offer,
        callType: type,
      });

      ringTimeoutRef.current = setTimeout(() => {
        if (callStatusRef.current === "outgoing") {
          socket.emit("end-call", { to: user.id });
          flashError("No answer");
          resetCallState();
        }
      }, RING_TIMEOUT_MS);
    } catch (err) {
      console.log(err);
      flashError("Could not access camera/microphone");
      resetCallState();
    }
  };

  const acceptCall = async () => {
    if (!remoteUser || !callType || !incomingOfferRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === "video",
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = createPeerConnection(remoteUser.id);
      peerConnectionRef.current = pc;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingOfferRef.current));

      for (const c of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }
      pendingCandidatesRef.current = [];

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer-call", { to: remoteUser.id, answer });

      setCallStatus("connected");
    } catch (err) {
      console.log(err);
      flashError("Could not access camera/microphone");
      if (remoteUser) socket.emit("reject-call", { to: remoteUser.id });
      resetCallState();
    }
  };

  const rejectCall = () => {
    if (remoteUser) socket.emit("reject-call", { to: remoteUser.id });
    resetCallState();
  };

  const endCall = () => {
    if (remoteUser) socket.emit("end-call", { to: remoteUser.id });
    resetCallState();
  };

  const toggleMute = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = isMuted));
    setIsMuted((m) => !m);
  };

  const toggleCamera = () => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => (t.enabled = isCameraOff));
    setIsCameraOff((c) => !c);
  };

  // Socket listeners stay active for as long as the user is logged in,
  // regardless of which screen/chat they currently have open.
  useEffect(() => {
    const handleIncomingCall = ({ from, fromName, offer, callType: type }: any) => {
      if (callStatusRef.current !== "idle") {
        socket.emit("reject-call", { to: from, reason: "busy" });
        return;
      }
      incomingOfferRef.current = offer;
      setCallType(type);
      setRemoteUser({ id: from, username: fromName });
      setCallStatus("incoming");
    };

    const handleAnswered = async ({ answer }: any) => {
      if (ringTimeoutRef.current) {
        clearTimeout(ringTimeoutRef.current);
        ringTimeoutRef.current = null;
      }
      const pc = peerConnectionRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      for (const c of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      }
      pendingCandidatesRef.current = [];
      setCallStatus("connected");
    };

    const handleRejected = ({ reason }: any) => {
      const who = remoteUserRef.current?.username || "User";
      flashError(reason === "busy" ? `${who} is busy` : "Call declined");
      resetCallState();
    };

    const handleEnded = () => {
      // call never connected -> the person on the receiving end missed it
      if (callStatusRef.current === "incoming") {
        flashError(`Missed call from ${remoteUserRef.current?.username || "someone"}`);
      }
      resetCallState();
    };

    const handleIce = async ({ candidate }: any) => {
      const pc = peerConnectionRef.current;
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    };

    const handleFailed = ({ reason }: any) => {
      flashError(reason || "Call could not connect");
      resetCallState();
    };

    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-answered", handleAnswered);
    socket.on("call-rejected", handleRejected);
    socket.on("call-ended", handleEnded);
    socket.on("ice-candidate", handleIce);
    socket.on("call-failed", handleFailed);

    return () => {
      socket.off("incoming-call", handleIncomingCall);
      socket.off("call-answered", handleAnswered);
      socket.off("call-rejected", handleRejected);
      socket.off("call-ended", handleEnded);
      socket.off("ice-candidate", handleIce);
      socket.off("call-failed", handleFailed);
    };
  }, []);

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <CallContext.Provider value={{ callStatus, callType, remoteUser, startCall }}>
      {children}

      {callError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-[#1A1A1A] text-white text-sm px-4 py-2 rounded-full shadow-lg">
          {callError}
        </div>
      )}

      {callStatus !== "idle" && remoteUser && (
        <div className="fixed inset-0 z-50 bg-[#111114] flex flex-col items-center justify-center overflow-hidden">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className={`absolute inset-0 w-full h-full object-cover ${
              callType === "video" && callStatus === "connected" ? "block" : "hidden"
            }`}
          />
          <audio ref={remoteAudioRef} autoPlay />

          {callType === "video" && (
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`absolute bottom-28 right-6 w-32 h-44 rounded-xl object-cover border-2 border-white/20 shadow-lg z-10 ${
                isCameraOff || callStatus === "incoming" ? "hidden" : "block"
              }`}
            />
          )}

          {callStatus !== "connected" && (
            <div className="relative z-10 flex flex-col items-center gap-4 text-white">
              <div className="h-24 w-24 rounded-full bg-[#4338CA] flex items-center justify-center text-3xl font-semibold">
                {remoteUser.username.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold">{remoteUser.username}</p>
                <p className="text-sm text-white/60 mt-1">
                  {callStatus === "outgoing" &&
                    `Calling... (${callType === "video" ? "Video" : "Voice"})`}
                  {callStatus === "incoming" &&
                    `Incoming ${callType === "video" ? "video" : "voice"} call`}
                </p>
              </div>
            </div>
          )}

          {callStatus === "connected" && callType === "audio" && (
            <div className="relative z-10 flex flex-col items-center gap-4 text-white">
              <div className="h-24 w-24 rounded-full bg-[#4338CA] flex items-center justify-center text-3xl font-semibold">
                {remoteUser.username.slice(0, 2).toUpperCase()}
              </div>
              <p className="text-xl font-semibold">{remoteUser.username}</p>
              <p className="text-sm text-white/60">{formatDuration(duration)}</p>
            </div>
          )}

          {callStatus === "connected" && callType === "video" && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/80 text-sm z-10 bg-black/30 px-3 py-1 rounded-full">
              {remoteUser.username} · {formatDuration(duration)}
            </div>
          )}

          <div className="absolute bottom-8 z-10 flex items-center gap-4">
            {callStatus === "incoming" ? (
              <>
                <button
                  onClick={rejectCall}
                  className="h-14 w-14 rounded-full bg-[#EF4444] flex items-center justify-center text-white shadow-lg hover:bg-[#DC2626] transition"
                  aria-label="Decline"
                >
                  <PhoneOffIcon />
                </button>
                <button
                  onClick={acceptCall}
                  className="h-14 w-14 rounded-full bg-[#10B981] flex items-center justify-center text-white shadow-lg hover:bg-[#059669] transition"
                  aria-label="Accept"
                >
                  <PhoneIcon />
                </button>
              </>
            ) : (
              <>
                {callStatus === "connected" && (
                  <button
                    onClick={toggleMute}
                    className={`h-12 w-12 rounded-full flex items-center justify-center text-white transition ${
                      isMuted ? "bg-white/30" : "bg-white/10 hover:bg-white/20"
                    }`}
                    aria-label="Toggle mute"
                  >
                    {isMuted ? <MicOffIcon /> : <MicIcon />}
                  </button>
                )}

                {callStatus === "connected" && callType === "video" && (
                  <button
                    onClick={toggleCamera}
                    className={`h-12 w-12 rounded-full flex items-center justify-center text-white transition ${
                      isCameraOff ? "bg-white/30" : "bg-white/10 hover:bg-white/20"
                    }`}
                    aria-label="Toggle camera"
                  >
                    {isCameraOff ? <VideoOffIcon /> : <VideoIcon />}
                  </button>
                )}

                <button
                  onClick={endCall}
                  className="h-14 w-14 rounded-full bg-[#EF4444] flex items-center justify-center text-white shadow-lg hover:bg-[#DC2626] transition"
                  aria-label="End call"
                >
                  <PhoneOffIcon />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </CallContext.Provider>
  );
}