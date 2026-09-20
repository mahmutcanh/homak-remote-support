"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { WS_URL, getStoredToken } from "@/lib/api";
import { AudioDeviceModal } from "./AudioDeviceModal";

interface RemoteDesktopViewerProps {
  sessionId: string;
  supportCode: string;
  deviceHostname?: string | null;
}

type ConnectionState = "idle" | "connecting" | "waiting_consent" | "connected" | "error" | "ended";

interface ChatMessage {
  text: string;
  sender: "agent" | "tech";
  senderName: string;
  timestamp: string;
}

export default function RemoteDesktopViewer({
  sessionId,
  supportCode,
  deviceHostname,
}: RemoteDesktopViewerProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [fps, setFps] = useState<number>(0);
  const [resolution, setResolution] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [techCount, setTechCount] = useState<number>(1);
  const [inviteCopied, setInviteCopied] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(true);
  const [isInputBlocked, setIsInputBlocked] = useState<boolean>(false);
  const [isPrivacyScreen, setIsPrivacyScreen] = useState<boolean>(false);
  const [sysInfo, setSysInfo] = useState<any>(null);
  const [showSysInfoModal, setShowSysInfoModal] = useState<boolean>(false);
  const [isWhiteboardMode, setIsWhiteboardMode] = useState<boolean>(false);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawColor, setDrawColor] = useState<string>("#ef4444");
  const [voiceActive, setVoiceActive] = useState<boolean>(false);
  const [showAudioModal, setShowAudioModal] = useState<boolean>(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(true);
  const [selectedMicId, setSelectedMicId] = useState<string>("");
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>("");

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localAudioStreamRef = useRef<MediaStream | null>(null);
  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const socketRef = useRef<Socket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const frameCountRef = useRef<number>(0);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Initialize Socket connection
  useEffect(() => {
    const token = getStoredToken();
    const socket: Socket = io(`${WS_URL}/support-ws`, {
      transports: ["websocket", "polling"],
      reconnection: true,
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      // Socket connected
    });

    socket.on("agent:status", (data: { sessionId: string; online: boolean }) => {
      if (data.sessionId !== sessionId) return;
      if (data.online) {
        setErrorMessage("");
      }
    });

    socket.on("remote:consent-result", (data: { sessionId: string; result: string; error?: string }) => {
      if (data.sessionId !== sessionId) return;
      if (data.result === "accepted") {
        setConnectionState("connected");
        setErrorMessage("");
        // Auto fullscreen when session connects
        if (containerRef.current && !document.fullscreenElement) {
          containerRef.current.requestFullscreen().catch(() => {});
        }
      } else if (data.result === "declined") {
        setConnectionState("error");
        setErrorMessage("Kullanıcı uzaktan bağlantı talebini reddetti.");
      } else if (data.result === "timeout") {
        setConnectionState("error");
        setErrorMessage("Kullanıcı onay penceresi yanıt vermedi (zaman aşımı).");
      } else if (data.result === "offline") {
        setConnectionState("error");
        setErrorMessage(data.error || "Müşteri agentı çevrimdışı.");
      }
    });

    socket.on("webrtc:signal", async (data: { sessionId: string; signal: any }) => {
      if (data.sessionId !== sessionId || !data.signal) return;
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        if (data.signal.type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("webrtc:signal", { sessionId, signal: answer });
        } else if (data.signal.type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
        } else if (data.signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(data.signal));
        }
      } catch (err) {
        console.error("WebRTC signal error:", err);
      }
    });

    socket.on("remote:frame", (data: { sessionId: string; frame: string; width: number; height: number }) => {
      if (data.sessionId !== sessionId) return;

      setConnectionState("connected");

      setResolution({ width: data.width, height: data.height });
      frameCountRef.current += 1;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        if (canvas.width !== data.width) canvas.width = data.width;
        if (canvas.height !== data.height) canvas.height = data.height;
        ctx.drawImage(img, 0, 0);
      };
      img.src = `data:image/jpeg;base64,${data.frame}`;
    });

    socket.on("remote:sysinfo", (data: { sessionId: string; info: any }) => {
      if (data.sessionId !== sessionId) return;
      setSysInfo(data.info);
    });

    socket.on("remote:clipboard", (data: { sessionId: string; text: string; sender: string }) => {
      if (data.sessionId !== sessionId || data.sender === "tech") return;
      if (data.text) {
        navigator.clipboard?.writeText(data.text).catch(() => {});
      }
    });

    socket.on("remote:stop", (data: { sessionId: string }) => {
      if (data.sessionId === sessionId) {
        setConnectionState("ended");
      }
    });

    socket.on("tech:presence-changed", (data: { sessionId: string; techCount: number }) => {
      if (data.sessionId !== sessionId) return;
      setTechCount(data.techCount);
    });

    socket.on("tech:joined", (data: { sessionId: string; technicianName: string; techCount: number }) => {
      if (data.sessionId !== sessionId) return;
      setTechCount(data.techCount);
      setChatMessages((prev) => [
        ...prev,
        {
          text: `${data.technicianName} oturuma katıldı.`,
          sender: "tech",
          senderName: "Sistem",
          timestamp: new Date().toISOString(),
        },
      ]);
    });

    socket.on(
      "chat:message",
      (data: { sessionId: string; text: string; sender: "agent" | "tech"; senderName: string; timestamp: string }) => {
        if (data.sessionId !== sessionId) return;
        setChatMessages((prev) => [
          ...prev,
          { text: data.text, sender: data.sender, senderName: data.senderName, timestamp: data.timestamp },
        ]);
      },
    );

    // FPS calculation loop
    const fpsInterval = setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);

    return () => {
      clearInterval(fpsInterval);
      if (socketRef.current) {
        socketRef.current.emit("tech:leave", { sessionId });
        socketRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const startRemoteSession = useCallback(() => {
    if (!socketRef.current) return;
    setConnectionState("waiting_consent");
    setErrorMessage("");

    socketRef.current.emit("remote:start", { sessionId }, (response: { ok?: boolean; error?: string }) => {
      if (response && !response.ok) {
        setConnectionState("error");
        setErrorMessage(response.error || "Bağlantı başlatılamadı.");
      }
    });
  }, [sessionId]);

  const sendChatMessage = useCallback(() => {
    const text = chatInput.trim();
    if (!text || !socketRef.current) return;

    socketRef.current.emit("chat:message", {
      sessionId,
      text,
      sender: "tech",
      senderName: "Teknisyen",
    });

    setChatMessages((prev) => [
      ...prev,
      { text, sender: "tech", senderName: "Siz", timestamp: new Date().toISOString() },
    ]);
    setChatInput("");
  }, [chatInput, sessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const stopRemoteSession = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("remote:stop", { sessionId });
    }
    setConnectionState("ended");
  }, [sessionId]);

  const sendCtrlAltDel = useCallback(() => {
    if (socketRef.current && connectionState === "connected") {
      socketRef.current.emit("remote:control", { sessionId, action: "ctrl-alt-del" });
    }
  }, [sessionId, connectionState]);

  const toggleInputBlock = () => {
    const next = !isInputBlocked;
    setIsInputBlocked(next);
    socketRef.current?.emit("remote:control", { sessionId, action: "block-input", enable: next });
  };

  const togglePrivacyScreen = () => {
    const next = !isPrivacyScreen;
    setIsPrivacyScreen(next);
    socketRef.current?.emit("remote:control", { sessionId, action: "privacy-screen", enable: next });
  };

  const runAdminCmd = (cmdName: string) => {
    socketRef.current?.emit("remote:control", { sessionId, action: "run-cmd", cmd: cmdName });
  };

  const requestSysInfo = () => {
    socketRef.current?.emit("remote:control", { sessionId, action: "request-sysinfo" });
    setShowSysInfoModal(true);
  };

  const startVoiceCall = async (micId: string, speakerId: string) => {
    try {
      setSelectedMicId(micId);
      setSelectedSpeakerId(speakerId);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: micId ? { deviceId: { exact: micId } } : true,
      });
      localAudioStreamRef.current = stream;

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerConnectionRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("webrtc:signal", { sessionId, signal: event.candidate });
        }
      };

      pc.ontrack = (event) => {
        const remoteAudio = new Audio();
        remoteAudio.srcObject = event.streams[0];
        if (speakerId && (remoteAudio as any).setSinkId) {
          (remoteAudio as any).setSinkId(speakerId).catch(() => {});
        }
        remoteAudio.play().catch(() => {});
      };

      // Always auto-record audio stream
      audioChunksRef.current = [];
      try {
        const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
        const recorder = new MediaRecorder(stream, { mimeType });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.start(1000);
        audioRecorderRef.current = recorder;
      } catch (e) {
        console.error("Audio recorder init error:", e);
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      if (socketRef.current) {
        socketRef.current.emit("webrtc:signal", { sessionId, signal: offer });
      }

      setVoiceActive(true);
      setShowAudioModal(false);
    } catch (err) {
      console.error("Start voice call error:", err);
      alert("Mikrofon erişimi sağlanamadı veya görüşme başlatılamadı.");
    }
  };

  const endVoiceCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localAudioStreamRef.current) {
      localAudioStreamRef.current.getTracks().forEach((t) => t.stop());
      localAudioStreamRef.current = null;
    }
    if (audioRecorderRef.current && audioRecorderRef.current.state !== "inactive") {
      audioRecorderRef.current.stop();
      audioRecorderRef.current = null;
    }
    setVoiceActive(false);
    setShowAudioModal(false);
  };

  const copyInviteLink = useCallback(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://remote.homaklab.com";
    const inviteUrl = `${origin}/support-queue?session=${sessionId}`;
    navigator.clipboard?.writeText(inviteUrl).catch(() => {});
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2500);
  }, [sessionId]);

  // Mouse & Keyboard Handlers for Canvas
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (connectionState !== "connected" || !canvasRef.current || !socketRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));

    socketRef.current.emit("remote:control", { sessionId, action: "mousemove", x, y });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (connectionState !== "connected" || !socketRef.current) return;
    const btn = e.button === 2 ? "right" : "left";
    socketRef.current.emit("remote:control", { sessionId, action: "mousedown", button: btn });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (connectionState !== "connected" || !socketRef.current) return;
    const btn = e.button === 2 ? "right" : "left";
    socketRef.current.emit("remote:control", { sessionId, action: "mouseup", button: btn });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (connectionState !== "connected" || !socketRef.current) return;
    // Don't intercept keyboard shortcuts if user is typing in chat input
    if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
      return;
    }
    const mapping: Record<string, string> = {
      Enter: "{ENTER}",
      Escape: "{ESC}",
      Backspace: "{BACKSPACE}",
      Tab: "{TAB}",
      Delete: "{DELETE}",
      ArrowUp: "{UP}",
      ArrowDown: "{DOWN}",
      ArrowLeft: "{LEFT}",
      ArrowRight: "{RIGHT}",
      F1: "{F1}", F2: "{F2}", F3: "{F3}", F4: "{F4}", F5: "{F5}",
      F6: "{F6}", F7: "{F7}", F8: "{F8}", F9: "{F9}", F10: "{F10}",
      F11: "{F11}", F12: "{F12}",
    };
    const key = e.key.length === 1 ? e.key : mapping[e.key] || "";
    if (!key) return;
    e.preventDefault();
    socketRef.current.emit("remote:control", { sessionId, action: "keypress", key });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`flex flex-col w-full bg-slate-950 border border-slate-800 text-slate-100 overflow-hidden outline-none select-none shadow-xl ${
        isFullscreen ? "h-screen rounded-none" : "rounded-xl"
      }`}
    >
      {/* Control Header Bar */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs flex-wrap gap-2 transition-all ${
          isFullscreen ? "opacity-0 hover:opacity-100 absolute top-0 left-0 right-0 z-20" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-white flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-indigo-400">desktop_windows</span>
            {deviceHostname || "Uzak Masaüstü"}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950 text-indigo-300 border border-indigo-800/50">
            PIN: {supportCode}
          </span>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {connectionState === "connected" && (
            <>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                CANLI ({fps} FPS {resolution.width > 0 ? `${resolution.width}x${resolution.height}` : ""})
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800/60 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                KAYIT ALINIYOR (MP4)
              </span>
            </>
          )}

          {connectionState === "waiting_consent" && (
            <span className="flex items-center gap-1 text-[11px] text-amber-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              Onay İsteği Gönderildi (Yanıt Bekleniyor)
            </span>
          )}

          {/* Action Buttons */}
          {connectionState === "idle" && (
            <button
              onClick={startRemoteSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-all shadow"
            >
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
              <span>Canlı Ekran Bağlantısı Başlat</span>
            </button>
          )}

          {connectionState === "connected" && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={copyInviteLink}
                title="Başka bir teknisyeni bu canlı oturuma katılmaya davet et"
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-900/80 hover:bg-indigo-800 text-indigo-200 font-semibold text-[11px] border border-indigo-700/60 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">person_add</span>
                <span>{inviteCopied ? "Davet Linki Kopyalandı!" : "Davet Et"}</span>
              </button>
              {techCount > 1 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-800/50 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">group</span>
                  {techCount} Teknisyen Bağlı
                </span>
              )}
              <button
                onClick={() => setShowAudioModal(true)}
                title="Sesli Görüşme & Mikrofon / Hoparlör Ayarları"
                className={`flex items-center gap-1 px-2.5 py-1 rounded font-semibold text-[11px] border transition-all ${
                  voiceActive
                    ? "bg-emerald-900/80 border-emerald-600 text-emerald-200 animate-pulse"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {voiceActive ? "mic" : "mic_none"}
                </span>
                <span>{voiceActive ? "Sesli Görüşme Aktif" : "Sesli Görüşme"}</span>
              </button>
              <button
                onClick={() => setIsChatOpen((v) => !v)}
                title="Canlı Sohbet"
                className={`relative p-1 rounded text-[11px] border ${
                  isChatOpen
                    ? "bg-indigo-900/60 border-indigo-700 text-indigo-300"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
              </button>
              <button
                onClick={togglePrivacyScreen}
                title="Müşteri Ekranını Karart (Privacy Mode)"
                className={`p-1 rounded text-[11px] border ${
                  isPrivacyScreen
                    ? "bg-amber-900/80 border-amber-600 text-amber-200"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">visibility_off</span>
              </button>
              <button
                onClick={toggleInputBlock}
                title="Müşteri Fare/Klavye Girdisini Engelle"
                className={`p-1 rounded text-[11px] border ${
                  isInputBlocked
                    ? "bg-rose-900/80 border-rose-600 text-rose-200"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">block</span>
              </button>
              <button
                onClick={requestSysInfo}
                title="Sistem ve Donanım Bilgilerini Gör"
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700"
              >
                <span className="material-symbols-outlined text-[16px]">info</span>
              </button>
              <div className="h-4 w-px bg-slate-700 mx-0.5"></div>
              <button
                onClick={() => runAdminCmd("devmgmt")}
                title="Aygıt Yöneticisi Aç"
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700"
              >
                DevMgmt
              </button>
              <button
                onClick={() => runAdminCmd("services")}
                title="Hizmetler (Services) Aç"
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700"
              >
                Services
              </button>
              <button
                onClick={() => runAdminCmd("cmd")}
                title="CMD / Komut İstemcisi Aç"
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700"
              >
                CMD
              </button>
              <button
                onClick={sendCtrlAltDel}
                title="Ctrl+Alt+Del Gönder"
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] border border-slate-700"
              >
                Ctrl+Alt+Del
              </button>
              <button
                onClick={toggleFullscreen}
                title="Tam Ekran"
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isFullscreen ? "fullscreen_exit" : "fullscreen"}
                </span>
              </button>
              <button
                onClick={stopRemoteSession}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-900/80 hover:bg-rose-800 text-rose-200 font-semibold text-[11px] border border-rose-700/60"
              >
                <span className="material-symbols-outlined text-[14px]">power_settings_new</span>
                <span>Sonlandır</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Screen Canvas Display */}
      <div
        className={`relative w-full bg-slate-950 flex items-center justify-center overflow-hidden ${
          isFullscreen ? "flex-1" : "aspect-video"
        }`}
      >
        {connectionState === "idle" && (
          <div className="flex flex-col items-center gap-3 p-6 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl text-slate-600">monitor</span>
            <p className="text-sm max-w-sm">
              Homak Native uzaktan masaüstü çözümü ile istemci ekranını canlı izlemek ve kontrol etmek için yukarıdaki butona tıklayın.
            </p>
            <button
              onClick={startRemoteSession}
              className="mt-1 flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md transition-all text-sm"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              <span>Uzak Masaüstü Bağlantısı Başlat</span>
            </button>
          </div>
        )}

        {connectionState === "waiting_consent" && (
          <div className="flex flex-col items-center gap-3 p-6 text-center text-amber-300">
            <span className="material-symbols-outlined text-4xl animate-bounce">pending</span>
            <p className="text-sm font-semibold">Müşteri bilgisayarında onay penceresi açıldı.</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Kullanıcının 30 saniye içinde onay vermesi bekleniyor...
            </p>
          </div>
        )}

        {connectionState === "error" && (
          <div className="flex flex-col items-center gap-3 p-6 text-center text-rose-400">
            <span className="material-symbols-outlined text-4xl text-rose-500">error</span>
            <p className="text-sm font-bold">{errorMessage}</p>
            <button
              onClick={startRemoteSession}
              className="mt-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Tekrar Deneyin
            </button>
          </div>
        )}

        {connectionState === "ended" && (
          <div className="flex flex-col items-center gap-2 p-6 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl text-slate-500">do_not_disturb</span>
            <p className="text-sm">Uzak masaüstü oturumu sonlandırıldı.</p>
            <button
              onClick={startRemoteSession}
              className="mt-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Yeniden Bağlan
            </button>
          </div>
        )}

        {/* Live Canvas */}
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onContextMenu={(e) => e.preventDefault()}
          className={`w-full h-full object-contain cursor-crosshair ${
            connectionState === "connected" ? "block" : "hidden"
          }`}
        />

        {/* Always-visible Exit Fullscreen Button */}
        {isFullscreen && connectionState === "connected" && (
          <button
            onClick={toggleFullscreen}
            title="Tam Ekrandan Çık (ESC)"
            className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-700 backdrop-blur"
          >
            <span className="material-symbols-outlined text-[16px]">fullscreen_exit</span>
            <span>Tam Ekrandan Çık</span>
          </button>
        )}

        {/* Floating Chat Panel */}
        {connectionState === "connected" && isChatOpen && (
          <div className="absolute bottom-3 right-3 w-72 h-80 bg-slate-900/95 backdrop-blur border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
              <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">chat</span>
                Canlı Sohbet
              </span>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2 text-[11px]">
              {chatMessages.length === 0 && (
                <div className="text-center text-slate-500 text-[10px] mt-6">
                  Müşteri ile buradan anlık mesajlaşabilirsiniz.
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] px-2.5 py-1.5 rounded-lg leading-snug break-words ${
                    msg.sender === "tech"
                      ? "self-end bg-indigo-600 text-white rounded-br-sm"
                      : "self-start bg-slate-700 text-slate-100 rounded-bl-sm"
                  }`}
                >
                  <div className="text-[9px] font-bold opacity-80 mb-0.5">{msg.senderName}</div>
                  <div>{msg.text}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="flex items-center gap-1.5 p-2 border-t border-slate-700 bg-slate-800">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendChatMessage();
                  }
                }}
                onKeyUp={(e) => e.stopPropagation()}
                onKeyPress={(e) => e.stopPropagation()}
                placeholder="Mesajınızı yazın..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-100 outline-none focus:border-indigo-500"
                autoComplete="off"
              />
              <button
                onClick={sendChatMessage}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold"
              >
                <span className="material-symbols-outlined text-[14px]">send</span>
              </button>
            </div>
          </div>
        )}
      </div>
      {/* System Information Modal */}
      {showSysInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-5 shadow-2xl text-slate-100 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold">
                <span className="material-symbols-outlined text-[20px]">info</span>
                <span>İstemci Sistem & Donanım Özeti</span>
              </div>
              <button onClick={() => setShowSysInfoModal(false)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            {sysInfo ? (
              <div className="flex flex-col gap-2.5 text-xs font-mono">
                <div className="flex justify-between p-2 rounded bg-slate-800/60">
                  <span className="text-slate-400">Hostname:</span>
                  <span className="font-bold text-white">{sysInfo.hostname}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-800/60">
                  <span className="text-slate-400">İşletim Sistemi:</span>
                  <span className="text-emerald-400">{sysInfo.os}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-800/60">
                  <span className="text-slate-400">İşlemci (CPU):</span>
                  <span className="text-indigo-300">{sysInfo.cpu} ({sysInfo.cpuCores} Çekirdek)</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-800/60">
                  <span className="text-slate-400">Bellek (RAM):</span>
                  <span className="text-amber-300">{sysInfo.memory}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-800/60">
                  <span className="text-slate-400">Açık Kalma Süresi:</span>
                  <span className="text-slate-200">{sysInfo.uptime}</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-slate-800/60">
                  <span className="text-slate-400">Kullanıcı:</span>
                  <span className="text-purple-300">{sysInfo.user}</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-2xl animate-spin text-indigo-400">progress_activity</span>
                <span>Agent tan sistem bilgileri alınıyor...</span>
              </div>
            )}
            <button
              onClick={() => setShowSysInfoModal(false)}
              className="mt-2 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
      {/* Audio Device & Call Control Modal */}
      <AudioDeviceModal
        isOpen={showAudioModal}
        onClose={() => setShowAudioModal(false)}
        onStartCall={startVoiceCall}
        isCallActive={voiceActive}
        onEndCall={endVoiceCall}
        isRecordingAudio={isRecordingAudio}
        onToggleAudioRecord={() => setIsRecordingAudio((v) => !v)}
      />
    </div>
  );
}
