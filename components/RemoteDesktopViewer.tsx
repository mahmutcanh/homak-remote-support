"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { WS_URL, getStoredToken, getStoredTechnician } from "@/lib/api";
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

interface DisplayItem {
  index: number;
  id: number;
  name: string;
  width: number;
  height: number;
  isPrimary: boolean;
}

export default function RemoteDesktopViewer({
  sessionId,
  supportCode,
  deviceHostname,
}: RemoteDesktopViewerProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [fps, setFps] = useState<number>(0);
  const [displays, setDisplays] = useState<DisplayItem[]>([]);
  const [activeDisplayIndex, setActiveDisplayIndex] = useState<number>(0);
  const [resolution, setResolution] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [techCount, setTechCount] = useState<number>(1);
  const [inviteCopied, setInviteCopied] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [isInputBlocked, setIsInputBlocked] = useState<boolean>(false);
  const [isPrivacyScreen, setIsPrivacyScreen] = useState<boolean>(false);
  const [sysInfo, setSysInfo] = useState<any>(null);
  const [showSysInfoModal, setShowSysInfoModal] = useState<boolean>(false);
  const [voiceActive, setVoiceActive] = useState<boolean>(false);
  const [showAudioModal, setShowAudioModal] = useState<boolean>(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState<boolean>(true);
  const [selectedMicId, setSelectedMicId] = useState<string>("");
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>("");
  const [isVirtualKeyboardOpen, setIsVirtualKeyboardOpen] = useState<boolean>(false);
  const [activeModifiers, setActiveModifiers] = useState<{ ctrl: boolean; shift: boolean; alt: boolean; win: boolean }>({
    ctrl: false,
    shift: false,
    alt: false,
    win: false,
  });

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localAudioStreamRef = useRef<MediaStream | null>(null);
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
      } else if (data.result === "declined") {
        setConnectionState("error");
        setErrorMessage("Kullanıcı uzaktan bağlantı talebini reddetti.");
      } else if (data.result === "timeout") {
        setConnectionState("error");
        setErrorMessage("Kullanıcı onay penceresi zaman aşımına uğradı.");
      } else if (data.result === "offline") {
        setConnectionState("error");
        setErrorMessage(data.error || "İstemci agentı çevrimdışı.");
      }
    });

    socket.on("webrtc:signal", async (data: { sessionId: string; signal: any }) => {
      if (data.sessionId !== sessionId || !data.signal) return;
      let pc = peerConnectionRef.current;
      try {
        if (data.signal.type === "offer") {
          if (!pc) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true }).catch(() => null);
            if (!stream) return;
            localAudioStreamRef.current = stream;
            pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
            peerConnectionRef.current = pc;
            stream.getTracks().forEach((track) => pc!.addTrack(track, stream));
            pc.onicecandidate = (event) => {
              if (event.candidate && socketRef.current) {
                socketRef.current.emit("webrtc:signal", { sessionId, signal: event.candidate });
              }
            };
            pc.ontrack = (event) => {
              const remoteAudio = new Audio();
              remoteAudio.srcObject = event.streams[0];
              remoteAudio.play().catch(() => {});
            };
            setVoiceActive(true);
          }
          await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socketRef.current?.emit("webrtc:signal", { sessionId, signal: answer });
        } else if (data.signal.type === "answer") {
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(data.signal));
          }
        } else if (data.signal.candidate) {
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(data.signal));
          }
        }
      } catch (err) {
        console.error("WebRTC signal error:", err);
      }
    });

    socket.on("remote:frame", (data: { sessionId: string; frame: string; width: number; height: number }) => {
      if (data.sessionId !== sessionId) return;

      setConnectionState((prev) => (prev !== "connected" ? "connected" : prev));

      setResolution((prev) => {
        if (prev.width === data.width && prev.height === data.height) return prev;
        return { width: data.width, height: data.height };
      });
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

    const handleDisplaysUpdate = (data: any) => {
      if (!data) return;
      if (data.sessionId && data.sessionId !== sessionId) return;
      const list = Array.isArray(data) ? data : (data.displays || data.screens || []);
      if (Array.isArray(list) && list.length > 0) {
        setDisplays(list);
        if (typeof data.activeDisplayIndex === "number") {
          setActiveDisplayIndex(data.activeDisplayIndex);
        }
      }
    };
    socket.on("remote:displays", handleDisplaysUpdate);
    socket.on("remote:screen-list", handleDisplaysUpdate);

    // Request displays on connect
    socket.emit("remote:get-displays", { sessionId });
    socket.emit("remote:control", { sessionId, action: "get-displays" });

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
        if (data.sender !== "tech") {
          setUnreadChatCount((v) => v + 1);
          setIsChatOpen(true);
        }
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
  }, [sessionId]);

  const startRemoteSession = useCallback(() => {
    if (!socketRef.current) return;
    setConnectionState("waiting_consent");
    setErrorMessage("");

    const tech = getStoredTechnician();
    const techName = tech?.displayName || tech?.username || "Teknisyen";
    socketRef.current.emit("remote:start", { sessionId, technicianName: techName }, (response: { ok?: boolean; error?: string }) => {
      if (response && !response.ok) {
        setConnectionState("error");
        setErrorMessage(response.error || "Bağlantı başlatılamadı.");
      }
    });
  }, [sessionId]);

  const sendChatMessage = useCallback((isAlertMode = false) => {
    const text = chatInput.trim();
    if (!text || !socketRef.current) return;

    const isAlert = isAlertMode || /bildirim/i.test(text);

    socketRef.current.emit("chat:message", {
      sessionId,
      text,
      sender: "tech",
      senderName: getStoredTechnician()?.displayName || getStoredTechnician()?.username || "Teknisyen",
      isAlert,
    });

    setChatMessages((prev) => [
      ...prev,
      {
        text: isAlert ? `🔔 [BİLDİRİM] ${text}` : text,
        sender: "tech",
        senderName: isAlert ? "Siz (Bildirim)" : "Siz",
        timestamp: new Date().toISOString(),
      },
    ]);
    setChatInput("");
  }, [chatInput, sessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const stopRemoteSession = useCallback(() => {
    if (confirm("Bu uzaktan masaüstü oturumunu sonlandırmak istediğinize emin misiniz?")) {
      if (socketRef.current) {
        socketRef.current.emit("remote:stop", { sessionId });
      }
      setConnectionState("ended");
    }
  }, [sessionId]);

  const toggleModifier = (mod: "ctrl" | "shift" | "alt" | "win") => {
    setActiveModifiers((prev) => {
      const nextVal = !prev[mod];
      if (socketRef.current) {
        socketRef.current.emit("remote:control", {
          sessionId,
          action: nextVal ? "keydown" : "keyup",
          key: mod,
        });
      }
      return { ...prev, [mod]: nextVal };
    });
  };

  const releaseAllModifiers = () => {
    ["ctrl", "shift", "alt", "win"].forEach((mod) => {
      if (socketRef.current) {
        socketRef.current.emit("remote:control", { sessionId, action: "keyup", key: mod });
      }
    });
    setActiveModifiers({ ctrl: false, shift: false, alt: false, win: false });
  };

  const sendKeyCombo = (comboName: string) => {
    if (socketRef.current) {
      socketRef.current.emit("remote:control", { sessionId, action: "combo", combo: comboName });
    }
  };

  const sendSpecialKey = (key: string) => {
    if (socketRef.current) {
      socketRef.current.emit("remote:control", { sessionId, action: "keypress", key });
    }
  };

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

  const switchDisplay = (displayIndex: number) => {
    if (!socketRef.current) return;
    setActiveDisplayIndex(displayIndex);
    socketRef.current.emit("remote:switch-display", { sessionId, displayIndex });
    socketRef.current.emit("remote:control", { sessionId, action: "switch-display", displayIndex, screenIndex: displayIndex });
    socketRef.current.emit("remote:control", { sessionId, action: "switch-screen", displayIndex, screenIndex: displayIndex });
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
        remoteAudio.play().catch(() => {});
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.emit("webrtc:signal", { sessionId, signal: offer });
      setVoiceActive(true);
    } catch (err) {
      console.error("Voice call start error:", err);
      alert("Mikrofon başlatılamadı.");
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
    setVoiceActive(false);
  };

  const copyInviteLink = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://remote.homaklab.com";
    const inviteUrl = `${origin}/support-queue?session=${sessionId}`;
    navigator.clipboard?.writeText(inviteUrl).catch(() => {});
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(null as any), 2500);
  };

  // Precise Canvas Coordinate Calculation
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const nativeWidth = canvas.width || 1920;
    const nativeHeight = canvas.height || 1080;
    const nativeAspect = nativeWidth / nativeHeight;
    const containerAspect = rect.width / rect.height;

    let displayedWidth = rect.width;
    let displayedHeight = rect.height;

    if (containerAspect > nativeAspect) {
      displayedWidth = rect.height * nativeAspect;
    } else {
      displayedHeight = rect.width / nativeAspect;
    }

    const offsetX = (rect.width - displayedWidth) / 2;
    const offsetY = (rect.height - displayedHeight) / 2;

    const mouseX = e.clientX - rect.left - offsetX;
    const mouseY = e.clientY - rect.top - offsetY;

    const x = Math.max(0, Math.min(1, mouseX / displayedWidth));
    const y = Math.max(0, Math.min(1, mouseY / displayedHeight));
    return { x, y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (connectionState !== "connected" || !socketRef.current) return;
    const coords = getCanvasCoordinates(e);
    if (!coords) return;
    socketRef.current.emit("remote:control", { sessionId, action: "mousemove", x: coords.x, y: coords.y });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (connectionState !== "connected" || !socketRef.current) return;
    const coords = getCanvasCoordinates(e);
    const btn = e.button === 2 ? "right" : "left";
    socketRef.current.emit("remote:control", {
      sessionId,
      action: "mousedown",
      button: btn,
      x: coords?.x,
      y: coords?.y,
    });
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (connectionState !== "connected" || !socketRef.current) return;
    const coords = getCanvasCoordinates(e);
    const btn = e.button === 2 ? "right" : "left";
    socketRef.current.emit("remote:control", {
      sessionId,
      action: "mouseup",
      button: btn,
      x: coords?.x,
      y: coords?.y,
    });
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (connectionState !== "connected" || !socketRef.current) return;
    const wheelAmount = e.deltaY < 0 ? 120 : -120;
    socketRef.current.emit("remote:control", { sessionId, action: "wheel", delta: wheelAmount });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (connectionState !== "connected" || !socketRef.current) return;
    if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
      return;
    }

    if (["Tab", "Backspace", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      e.preventDefault();
    }

    // Direct unicode single character input (letters, numbers, symbols, Turkish characters)
    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      socketRef.current.emit("remote:control", { sessionId, action: "char", char: e.key });
      return;
    }

    const mapping: Record<string, string> = {
      Enter: "enter",
      Escape: "esc",
      Backspace: "backspace",
      Tab: "tab",
      Delete: "delete",
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      Home: "home",
      End: "end",
      PageUp: "pageup",
      PageDown: "pagedown",
      " ": "space",
    };

    if (mapping[e.key]) {
      e.preventDefault();
      socketRef.current.emit("remote:control", { sessionId, action: "special-key", key: mapping[e.key] });
      return;
    }

    // Otherwise send keypress
    socketRef.current.emit("remote:control", { sessionId, action: "keypress", key: e.key });
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
      className={`flex flex-col w-full bg-slate-950 border border-slate-800 text-slate-100 overflow-hidden outline-none select-none shadow-2xl transition-all ${
        isFullscreen ? "h-screen rounded-none" : "rounded-2xl"
      }`}
    >
      {/* Top Floating Control Toolbar (Studio Bar) */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-xs flex-wrap gap-2 transition-all z-20 ${
          isFullscreen ? "absolute top-0 left-0 right-0 opacity-0 hover:opacity-100 shadow-2xl" : ""
        }`}
      >
        {/* Left: Device & Stream Info */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <span className="material-symbols-outlined text-[18px] text-blue-400">desktop_windows</span>
            <span>{deviceHostname || "Uzak Masaüstü"}</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-950/80 text-blue-300 border border-blue-800/60">
            PIN: {supportCode}
          </span>
          {connectionState === "connected" && (
            <>
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{fps} FPS</span>
                {resolution.width > 0 && <span className="text-slate-500">• {resolution.width}x{resolution.height}</span>}
              </div>
              <span className="hidden md:flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950/80 text-rose-300 border border-rose-800/60 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                CANLI KAYIT
              </span>
            </>
          )}

          {/* Multi-Monitor Detection & Switcher */}
          <div className="flex items-center gap-1 bg-slate-950/90 border border-cyan-500/40 rounded-xl p-0.5 px-2 shadow-sm">
            <span className="flex items-center gap-1 text-[11px] font-bold text-cyan-300 pr-1">
              <span className="material-symbols-outlined text-[16px] text-cyan-400">desktop_windows</span>
              <span className="hidden sm:inline">Monitör:</span>
            </span>
            <div className="flex items-center gap-1">
              {displays.length > 0 ? (
                displays.map((d, idx) => {
                  const dispIdx = typeof d.index === "number" ? d.index : idx;
                  const isActive = activeDisplayIndex === dispIdx;
                  return (
                    <button
                      key={dispIdx}
                      onClick={() => switchDisplay(dispIdx)}
                      title={`${d.name || `Monitör ${dispIdx + 1}`} (${d.width}x${d.height})${d.isPrimary ? " - Ana Ekran" : ""}`}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/50 border border-cyan-300"
                          : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[13px]">
                        {d.isPrimary ? "star" : "monitor"}
                      </span>
                      <span>{dispIdx + 1}. Ekran</span>
                    </button>
                  );
                })
              ) : (
                <>
                  <button
                    onClick={() => switchDisplay(0)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeDisplayIndex === 0
                        ? "bg-cyan-600 text-white shadow-md border border-cyan-300"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">star</span>
                    <span>1. Ekran</span>
                  </button>
                  <button
                    onClick={() => switchDisplay(1)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeDisplayIndex === 1
                        ? "bg-cyan-600 text-white shadow-md border border-cyan-300"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">monitor</span>
                    <span>2. Ekran</span>
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  socketRef.current?.emit("remote:get-displays", { sessionId });
                  socketRef.current?.emit("remote:control", { sessionId, action: "get-displays" });
                }}
                title="Monitörleri Yenile / Algıla"
                className="p-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-cyan-300 border border-slate-700/60 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">sync</span>
              </button>
            </div>
          </div>
          {connectionState === "waiting_consent" && (
            <span className="flex items-center gap-1.5 text-[11px] text-amber-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
              Onay Bekleniyor
            </span>
          )}
        </div>

        {/* Center & Right: Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {connectionState === "idle" && (
            <button
              onClick={startRemoteSession}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
              <span>Canlı Ekranı Başlat</span>
            </button>
          )}

          {connectionState === "connected" && (
            <>
              {/* Voice Call VoIP Button */}
              <button
                onClick={() => setShowAudioModal(true)}
                title="Sesli İletişim & Aygıt Ayarları"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  voiceActive
                    ? "bg-emerald-900/80 border-emerald-500 text-emerald-200 animate-pulse"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {voiceActive ? "mic" : "mic_none"}
                </span>
                <span>{voiceActive ? "Sesli Görüşme Aktif" : "Sesli Görüşme"}</span>
              </button>

              {/* Chat Toggle Button */}
              <button
                onClick={() => {
                  setIsChatOpen((v) => !v);
                  if (!isChatOpen) setUnreadChatCount(0);
                }}
                title="Canlı Sohbet Paneli"
                className={`relative flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  isChatOpen
                    ? "bg-blue-900/80 border-blue-600 text-blue-200"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
                <span>Sohbet</span>
                {unreadChatCount > 0 && !isChatOpen && (
                  <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white text-[10px] font-black rounded-full">
                    {unreadChatCount}
                  </span>
                )}
              </button>

              {/* Virtual Keyboard Toggle Button */}
              <button
                onClick={() => setIsVirtualKeyboardOpen((v) => !v)}
                title="Sanal Klavye, Çoklu Seçim & Kısayollar"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                  isVirtualKeyboardOpen || activeModifiers.ctrl || activeModifiers.shift
                    ? "bg-indigo-900/90 border-indigo-500 text-indigo-200 shadow-md shadow-indigo-950/40"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">keyboard</span>
                <span>Sanal Klavye</span>
                {(activeModifiers.ctrl || activeModifiers.shift) && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse ml-0.5"></span>
                )}
              </button>

              {/* Security Tools (Privacy Screen & Input Block) */}
              <button
                onClick={togglePrivacyScreen}
                title={isPrivacyScreen ? "Gizlilik Ekranını Kapat" : "İstemci Ekranını Karart (Privacy Mode)"}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isPrivacyScreen
                    ? "bg-amber-900/80 border-amber-500 text-amber-200"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">visibility_off</span>
                <span className="hidden lg:inline">{isPrivacyScreen ? "Karartma Aktif" : "Karart"}</span>
              </button>

              <button
                onClick={toggleInputBlock}
                title={isInputBlocked ? "Kullanıcı Girdisini Aç" : "Müşteri Klavye/Faresini Engelle"}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isInputBlocked
                    ? "bg-rose-900/80 border-rose-500 text-rose-200"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">block</span>
                <span className="hidden lg:inline">{isInputBlocked ? "Girdi Kilitli" : "Girdi Kilidi"}</span>
              </button>

              {/* Admin Tools Dropdown / Quick Buttons */}
              <button
                onClick={sendCtrlAltDel}
                title="Ctrl+Alt+Del Gönder"
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-medium border border-slate-700 transition-colors cursor-pointer"
              >
                Ctrl+Alt+Del
              </button>

              <button
                onClick={requestSysInfo}
                title="Sistem & Donanım Özeti"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[17px]">info</span>
              </button>

              {/* Multi-Tech Invite Button */}
              <button
                onClick={copyInviteLink}
                title="Başka bir teknisyeni davet et"
                className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 text-xs font-semibold border border-indigo-800/60 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">person_add</span>
                <span>{inviteCopied ? "Kopyalandı!" : "Davet"}</span>
              </button>

              {/* Quick Admin Actions (CMD, Devmgmt) */}
              <div className="hidden xl:flex items-center gap-1">
                <button
                  onClick={() => runAdminCmd("cmd")}
                  title="Komut İstemcisi Aç"
                  className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700"
                >
                  CMD
                </button>
                <button
                  onClick={() => runAdminCmd("devmgmt")}
                  title="Aygıt Yöneticisi Aç"
                  className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono border border-slate-700"
                >
                  DevMgmt
                </button>
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? "Tam Ekrandan Çık (ESC)" : "Tam Ekran Yap (F11)"}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isFullscreen ? "fullscreen_exit" : "fullscreen"}
                </span>
                <span>{isFullscreen ? "Küçült" : "Tam Ekran"}</span>
              </button>

              {/* Disconnect Button */}
              <button
                onClick={stopRemoteSession}
                title="Oturumu Sonlandır"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/60 font-bold text-xs transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px]">power_settings_new</span>
                <span>Sonlandır</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Screen Canvas Viewport */}
      <div
        className={`relative w-full bg-slate-950 flex items-center justify-center overflow-hidden ${
          isFullscreen ? "flex-1" : "aspect-video"
        }`}
      >
        {/* State: Idle */}
        {connectionState === "idle" && (
          <div className="flex flex-col items-center gap-4 p-8 text-center max-w-md animate-fadeIn">
            <div className="w-16 h-16 rounded-3xl bg-blue-950/60 border border-blue-800/60 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-950/50">
              <span className="material-symbols-outlined text-3xl">desktop_windows</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold text-white">Uzak Masaüstü Bağlantısına Hazır</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                İstemci bilgisayarına <b>({deviceHostname || supportCode})</b> doğrudan bağlanmak ve ekran kontrolünü başlatmak için aşağıdaki butona tıklayın.
              </p>
            </div>
            <button
              onClick={startRemoteSession}
              className="mt-2 flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <span className="material-symbols-outlined text-[20px]">play_arrow</span>
              <span>Canlı Ekran Bağlantısını Başlat</span>
            </button>
            <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium mt-2">
              <span>⚡ 60 FPS Canlı Yayın</span>
              <span>•</span>
              <span>🔒 AES-256 Şifreli</span>
              <span>•</span>
              <span>🎙️ Entegre Sesli Arama</span>
            </div>
          </div>
        )}

        {/* State: Waiting Consent */}
        {connectionState === "waiting_consent" && (
          <div className="flex flex-col items-center gap-4 p-8 text-center max-w-sm animate-fadeIn">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping"></div>
              <div className="w-16 h-16 rounded-full bg-amber-950/80 border-2 border-amber-500/80 flex items-center justify-center text-amber-400 shadow-lg">
                <span className="material-symbols-outlined text-3xl">pending</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-bold text-amber-300">Müşteri Onayı Bekleniyor...</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                İstemci ekranında onay penceresi açıldı. Kullanıcının &quot;İzin Ver&quot; demesi bekleniyor (30 saniye).
              </p>
            </div>
          </div>
        )}

        {/* State: Error */}
        {connectionState === "error" && (
          <div className="flex flex-col items-center gap-3 p-8 text-center max-w-sm animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-rose-400">
              <span className="material-symbols-outlined text-3xl">error</span>
            </div>
            <h3 className="text-sm font-bold text-rose-300">Bağlantı Kurulamadı</h3>
            <p className="text-xs text-slate-400">{errorMessage}</p>
            <button
              onClick={startRemoteSession}
              className="mt-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
            >
              Tekrar Deneyin
            </button>
          </div>
        )}

        {/* State: Ended */}
        {connectionState === "ended" && (
          <div className="flex flex-col items-center gap-3 p-8 text-center max-w-sm animate-fadeIn">
            <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <span className="material-symbols-outlined text-3xl">do_not_disturb</span>
            </div>
            <h3 className="text-sm font-bold text-slate-300">Oturum Sonlandırıldı</h3>
            <p className="text-xs text-slate-500">Uzak masaüstü ekran paylaşımı tamamlandı.</p>
            <button
              onClick={startRemoteSession}
              className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition-colors"
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
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
          className={`w-full h-full object-contain cursor-crosshair transition-opacity duration-200 ${
            connectionState === "connected" ? "block opacity-100" : "hidden opacity-0"
          }`}
        />

        {/* Fullscreen Floating Exit Button (Always accessible) */}
        {isFullscreen && connectionState === "connected" && (
          <button
            onClick={toggleFullscreen}
            title="Tam Ekrandan Çık (ESC)"
            className="absolute top-4 right-4 z-40 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-white text-xs font-bold border border-slate-700 shadow-2xl backdrop-blur cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">fullscreen_exit</span>
            <span>Tam Ekrandan Çık</span>
          </button>
        )}

        {/* Floating Virtual Keyboard & Multi-Selection Bar */}
        {connectionState === "connected" && isVirtualKeyboardOpen && (
          <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-3.5 flex flex-col gap-2.5 z-30 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-indigo-400 text-[18px]">keyboard</span>
                <span className="text-xs font-bold text-white">Sanal Klavye & Kısayol İstasyonu</span>
                <span className="hidden sm:inline text-[10px] text-slate-400 font-medium">
                  • Çoklu seçim için Ctrl veya Shift&apos;i aktif tutarak ekranda tıklayın
                </span>
              </div>
              <div className="flex items-center gap-2">
                {(activeModifiers.ctrl || activeModifiers.shift || activeModifiers.alt || activeModifiers.win) && (
                  <button
                    onClick={releaseAllModifiers}
                    className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition-colors"
                  >
                    Tuşları Bırak
                  </button>
                )}
                <button
                  onClick={() => setIsVirtualKeyboardOpen(false)}
                  className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            </div>

            {/* Row 1: Sticky Modifiers (For Multi-Selection & Combos) */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-slate-400 mr-1 uppercase">Seçim & Mod:</span>
              <button
                onClick={() => toggleModifier("ctrl")}
                title="Ctrl tuşunu basılı tut (Birden fazla dosya/öğe seçimi için)"
                className={`px-3 py-1 rounded-lg text-xs font-mono font-black border transition-all cursor-pointer flex items-center gap-1 ${
                  activeModifiers.ctrl
                    ? "bg-cyan-600 border-cyan-400 text-white shadow-md shadow-cyan-600/40 animate-pulse"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
              >
                <span>CTRL</span>
                {activeModifiers.ctrl && <span className="text-[10px]">✓</span>}
              </button>

              <button
                onClick={() => toggleModifier("shift")}
                title="Shift tuşunu basılı tut (Aralık / Sıralı çoklu seçim için)"
                className={`px-3 py-1 rounded-lg text-xs font-mono font-black border transition-all cursor-pointer flex items-center gap-1 ${
                  activeModifiers.shift
                    ? "bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-600/40 animate-pulse"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
              >
                <span>SHIFT</span>
                {activeModifiers.shift && <span className="text-[10px]">✓</span>}
              </button>

              <button
                onClick={() => toggleModifier("alt")}
                title="Alt tuşunu basılı tut"
                className={`px-3 py-1 rounded-lg text-xs font-mono font-black border transition-all cursor-pointer flex items-center gap-1 ${
                  activeModifiers.alt
                    ? "bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-600/40 animate-pulse"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
              >
                <span>ALT</span>
                {activeModifiers.alt && <span className="text-[10px]">✓</span>}
              </button>

              <button
                onClick={() => toggleModifier("win")}
                title="Windows tuşunu basılı tut"
                className={`px-3 py-1 rounded-lg text-xs font-mono font-black border transition-all cursor-pointer flex items-center gap-1 ${
                  activeModifiers.win
                    ? "bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-600/40 animate-pulse"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700"
                }`}
              >
                <span>WIN</span>
                {activeModifiers.win && <span className="text-[10px]">✓</span>}
              </button>

              <div className="h-4 w-px bg-slate-700 mx-1"></div>

              {/* Essential Single Keys */}
              <button
                onClick={() => sendSpecialKey("{ESC}")}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700"
              >
                ESC
              </button>
              <button
                onClick={() => sendSpecialKey("{TAB}")}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700"
              >
                TAB
              </button>
              <button
                onClick={() => sendSpecialKey("{ENTER}")}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700"
              >
                ENTER
              </button>
              <button
                onClick={() => sendSpecialKey("{DELETE}")}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700"
              >
                DEL
              </button>
              <button
                onClick={() => sendSpecialKey("{BACKSPACE}")}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono border border-slate-700"
              >
                BKSP
              </button>
            </div>

            {/* Row 2: Important Combinations (Combos) */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800/80">
              <span className="text-[10px] font-bold text-slate-400 mr-1 uppercase">Kısayollar:</span>
              <button
                onClick={() => sendKeyCombo("ctrl-shift-esc")}
                title="Görev Yöneticisi Aç (Ctrl+Shift+Esc)"
                className="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 text-xs font-semibold cursor-pointer"
              >
                Ctrl+Shift+Esc
              </button>
              <button
                onClick={() => sendKeyCombo("ctrl-alt-esc")}
                title="Ctrl+Alt+Esc Gönder"
                className="px-2.5 py-1 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-800/60 text-xs font-semibold cursor-pointer"
              >
                Ctrl+Alt+Esc
              </button>
              <button
                onClick={() => sendKeyCombo("alt-tab")}
                title="Pencereler Arası Geçiş (Alt+Tab)"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer"
              >
                Alt+Tab
              </button>
              <button
                onClick={() => sendKeyCombo("alt-f4")}
                title="Aktif Pencereyi Kapat (Alt+F4)"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer"
              >
                Alt+F4
              </button>
              <button
                onClick={() => sendKeyCombo("win-d")}
                title="Masaüstünü Göster (Win+D)"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer"
              >
                Win+D
              </button>
              <button
                onClick={() => sendKeyCombo("win-e")}
                title="Dosya Gezgini Aç (Win+E)"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer"
              >
                Win+E
              </button>
              <button
                onClick={() => sendKeyCombo("win-r")}
                title="Çalıştır Aç (Win+R)"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer"
              >
                Win+R
              </button>
              <button
                onClick={() => sendKeyCombo("ctrl-a")}
                title="Tümünü Seç (Ctrl+A)"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer"
              >
                Ctrl+A
              </button>
              <button
                onClick={() => sendKeyCombo("ctrl-c")}
                title="Kopyala (Ctrl+C)"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer"
              >
                Ctrl+C
              </button>
              <button
                onClick={() => sendKeyCombo("ctrl-v")}
                title="Yapıştır (Ctrl+V)"
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium cursor-pointer"
              >
                Ctrl+V
              </button>
            </div>
          </div>
        )}

        {/* Floating Live Chat Widget */}
        {connectionState === "connected" && isChatOpen && (
          <div className="absolute bottom-4 right-4 w-80 h-96 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-30 animate-fadeIn">
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/80 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-blue-400">chat</span>
                <span className="text-xs font-bold text-white">İstemci ile Canlı Sohbet</span>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 text-xs">
              {chatMessages.length === 0 && (
                <div className="text-center text-slate-500 text-[11px] my-auto">
                  💬 İstemciye buradan anlık mesaj gönderebilirsiniz.
                </div>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] px-3 py-2 rounded-xl leading-snug break-words ${
                    msg.sender === "tech"
                      ? "self-end bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-br-xs shadow-xs"
                      : "self-start bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-xs shadow-xs"
                  }`}
                >
                  <div className="text-[10px] font-bold opacity-75 mb-0.5">{msg.senderName}</div>
                  <div>{msg.text}</div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <div className="flex items-center gap-1.5 p-2.5 border-t border-slate-800 bg-slate-900">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    e.preventDefault();
                    sendChatMessage(false);
                  }
                }}
                onKeyUp={(e) => e.stopPropagation()}
                onKeyPress={(e) => e.stopPropagation()}
                placeholder="Mesaj veya bildirim yazın..."
                className="flex-1 bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-blue-500"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => sendChatMessage(true)}
                title="İstemci ekranında sesli ve açılır pencereli alert bildirimi gönder"
                className="px-2.5 py-2 rounded-xl bg-amber-600/90 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer shadow-xs"
              >
                <span className="material-symbols-outlined text-[15px]">notifications_active</span>
                <span className="hidden sm:inline">Bildirim</span>
              </button>
              <button
                type="button"
                onClick={() => sendChatMessage(false)}
                title="Mesaj Gönder"
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* System Information Modal */}
      {showSysInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100 flex flex-col gap-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                <span className="material-symbols-outlined text-[22px]">devices</span>
                <span>İstemci Sistem & Donanım Özeti</span>
              </div>
              <button onClick={() => setShowSysInfoModal(false)} className="text-slate-400 hover:text-white">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {sysInfo ? (
              <div className="flex flex-col gap-2.5 text-xs font-mono">
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50">
                  <span className="text-slate-400">Cihaz Adı:</span>
                  <span className="font-bold text-white">{sysInfo.hostname}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50">
                  <span className="text-slate-400">İşletim Sistemi:</span>
                  <span className="text-emerald-400">{sysInfo.os}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50">
                  <span className="text-slate-400">İşlemci (CPU):</span>
                  <span className="text-blue-300">{sysInfo.cpu} ({sysInfo.cpuCores} Çekirdek)</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50">
                  <span className="text-slate-400">Bellek (RAM):</span>
                  <span className="text-amber-300">{sysInfo.memory}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50">
                  <span className="text-slate-400">Açık Kalma:</span>
                  <span className="text-slate-200">{sysInfo.uptime}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50">
                  <span className="text-slate-400">Kullanıcı:</span>
                  <span className="text-purple-300">{sysInfo.user}</span>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <span className="material-symbols-outlined text-3xl animate-spin text-blue-500">progress_activity</span>
                <span>İstemciden sistem bilgileri alınıyor...</span>
              </div>
            )}

            <button
              onClick={() => setShowSysInfoModal(false)}
              className="mt-2 w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </div>
      )}

      {/* Audio Device & VoIP Call Modal */}
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
