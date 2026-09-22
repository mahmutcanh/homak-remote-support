"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
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
  const [isRefreshingDisplays, setIsRefreshingDisplays] = useState<boolean>(false);

  const displayListToRender = useMemo(() => {
    if (displays && displays.length > 0) {
      return displays;
    }
    return [
      { index: 0, id: 1, name: "1. Ekran (Ana)", width: 0, height: 0, isPrimary: true }
    ];
  }, [displays]);

  const refreshDisplays = () => {
    setIsRefreshingDisplays(true);
    socketRef.current?.emit("remote:get-displays", { sessionId });
    socketRef.current?.emit("remote:control", { sessionId, action: "get-displays" });
    setTimeout(() => setIsRefreshingDisplays(false), 1200);
  };
  const [resolution, setResolution] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  // --- 1. Dosya Transferi State ---
  const [showFileModal, setShowFileModal] = useState<boolean>(false);
  const [fileTab, setFileTab] = useState<"upload" | "browse">("upload");
  const [uploadProgress, setUploadProgress] = useState<{ fileName: string; progress: number; status: string } | null>(null);
  const [remoteFiles, setRemoteFiles] = useState<Array<{ name: string; isDir: boolean; size: number; path: string }>>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [currentRemoteDir, setCurrentRemoteDir] = useState<string>("desktop");
  const [transferLogs, setTransferLogs] = useState<Array<{ text: string; time: string; type: "info" | "success" | "error" }>>([]);

  // --- 2. Pano Senkronizasyonu State ---
  const [clipboardToast, setClipboardToast] = useState<string | null>(null);

  // --- 3. Ekrana Çizim & Lazer İşaretçi State ---
  const [whiteboardMode, setWhiteboardMode] = useState<"normal" | "laser" | "pen">("normal");
  const [penColor, setPenColor] = useState<string>("#facc15");
  const whiteboardCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);
  const currentStrokeRef = useRef<Array<{ x: number; y: number }>>([]);

  // --- 4. Sistem Tanılama & Görev Yöneticisi State ---
  const [diagnosticsTab, setDiagnosticsTab] = useState<"sysinfo" | "processes">("sysinfo");
  const [processList, setProcessList] = useState<Array<{ pid: number; name: string; cpu: number; memoryMB: number }>>([]);
  const [isLoadingProcesses, setIsLoadingProcesses] = useState<boolean>(false);
  const [processSearch, setProcessSearch] = useState<string>("");

  // --- 5. UAC / Yönetici Yetkisi Yükseltme State ---
  const [isElevating, setIsElevating] = useState<boolean>(false);
  const [elevateNotice, setElevateNotice] = useState<string | null>(null);
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

    // Dosya Transferi Dinleyicileri
    socket.on("file:upload-progress", (data: { sessionId: string; fileName: string; progress: number; status: string; error?: string }) => {
      if (data.sessionId !== sessionId) return;
      setUploadProgress({ fileName: data.fileName, progress: data.progress, status: data.status });
      if (data.status === "completed") {
        setTransferLogs((prev) => [{ text: `✅ "${data.fileName}" başarıyla yüklendi!`, time: new Date().toLocaleTimeString(), type: "success" }, ...prev]);
        setTimeout(() => setUploadProgress(null), 3500);
      }
    });

    socket.on("file:list-result", (data: { sessionId: string; dir: string; files: any[]; error?: string }) => {
      if (data.sessionId !== sessionId) return;
      setIsLoadingFiles(false);
      if (data.error) {
        setTransferLogs((prev) => [{ text: `Hata: ${data.error}`, time: new Date().toLocaleTimeString(), type: "error" }, ...prev]);
      } else {
        setRemoteFiles(data.files || []);
      }
    });

    socket.on("file:download-result", (data: { sessionId: string; fileName: string; content?: string; error?: string }) => {
      if (data.sessionId !== sessionId) return;
      if (data.error) {
        alert("Dosya indirme hatası: " + data.error);
        return;
      }
      if (data.content) {
        try {
          const byteCharacters = atob(data.content);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: "application/octet-stream" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = data.fileName || "downloaded_file";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          setTransferLogs((prev) => [{ text: `📥 "${data.fileName}" başarıyla indirildi.`, time: new Date().toLocaleTimeString(), type: "success" }, ...prev]);
        } catch (e: any) {
          alert("Dosya çözme hatası: " + e.message);
        }
      }
    });

    // Görev Yöneticisi Dinleyicisi
    socket.on("remote:process-list", (data: { sessionId: string; processes: any[] }) => {
      if (data.sessionId !== sessionId) return;
      setIsLoadingProcesses(false);
      setProcessList(data.processes || []);
    });

    // Beyaz Tahta & Lazer Dinleyicisi (Diğer teknisyenler için de yansıtma)
    socket.on("remote:whiteboard", (data: { sessionId: string; drawData: any }) => {
      if (data.sessionId !== sessionId || !data.drawData) return;
      renderWhiteboardDataLocally(data.drawData);
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
    if (displays.length > 0 && displayIndex >= displays.length) {
      alert(`İstemci bilgisayarda yalnızca ${displays.length} adet monitör bağlı. ${displayIndex + 1}. ekran bulunamadı.`);
      return;
    }
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

  // --- Toast Bildirimi ---
  const showToast = (msg: string) => {
    setClipboardToast(msg);
    setTimeout(() => setClipboardToast(null), 3500);
  };

  // --- 1. Dosya Transferi Fonksiyonları ---
  const handleUploadFile = (file: File, targetDir: "desktop" | "downloads" = "desktop") => {
    if (!file || !socketRef.current) return;
    const CHUNK_SIZE = 60 * 1024; // 60KB
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileName = file.name;
    const fileSize = file.size;

    setUploadProgress({ fileName, progress: 0, status: "Hazırlanıyor..." });
    setTransferLogs((prev) => [
      { text: `📤 "${fileName}" yüklenmeye başlandı (${(fileSize / 1024).toFixed(1)} KB)...`, time: new Date().toLocaleTimeString(), type: "info" },
      ...prev,
    ]);

    socketRef.current.emit("file:upload-start", {
      sessionId,
      fileName,
      fileSize,
      totalChunks,
      targetDir,
    });

    let currentChunk = 0;
    const reader = new FileReader();

    const readNextChunk = () => {
      const start = currentChunk * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const slice = file.slice(start, end);
      reader.readAsArrayBuffer(slice);
    };

    reader.onload = (e) => {
      if (!e.target?.result) return;
      const arrayBuffer = e.target.result as ArrayBuffer;
      let binary = "";
      const bytes = new Uint8Array(arrayBuffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = btoa(binary);

      socketRef.current?.emit("file:upload-chunk", {
        sessionId,
        fileName,
        chunkIndex: currentChunk,
        totalChunks,
        data: base64Data,
      });

      currentChunk++;
      if (currentChunk < totalChunks) {
        setTimeout(readNextChunk, 6);
      }
    };

    readNextChunk();
  };

  const fetchRemoteFiles = (dir: string = currentRemoteDir) => {
    setCurrentRemoteDir(dir);
    setIsLoadingFiles(true);
    socketRef.current?.emit("file:list", { sessionId, dir });
  };

  const downloadRemoteFile = (filePath: string) => {
    setTransferLogs((prev) => [
      { text: `📥 Karşıdan dosya talep edildi: ${filePath}...`, time: new Date().toLocaleTimeString(), type: "info" },
      ...prev,
    ]);
    socketRef.current?.emit("file:download", { sessionId, filePath });
  };

  // --- 2. Pano Senkronizasyonu Fonksiyonları ---
  const sendClipboardToAgent = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        showToast("Panonuzda metin bulunamadı.");
        return;
      }
      socketRef.current?.emit("remote:clipboard", { sessionId, text, sender: "tech" });
      showToast(`📋 Pano (${text.length} karakter) istemciye gönderildi!`);
    } catch {
      const manual = prompt("İstemciye göndermek istediğiniz metni veya şifreyi yapıştırın:");
      if (manual) {
        socketRef.current?.emit("remote:clipboard", { sessionId, text: manual, sender: "tech" });
        showToast("📋 Pano istemciye gönderildi!");
      }
    }
  };

  // --- 3. Ekrana Çizim & Lazer İşaretçi Fonksiyonları ---
  const localStrokesRef = useRef<Array<any>>([]);
  const localLaserRef = useRef<any>(null);

  const renderWhiteboardDataLocally = (drawData: any) => {
    const canvas = whiteboardCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    if (drawData.type === "laser") {
      localLaserRef.current = { x: drawData.x * w, y: drawData.y * h, alpha: 1.0 };
    } else if (drawData.type === "line") {
      const pts = (drawData.points || []).map((p: any) => ({ x: p.x * w, y: p.y * h }));
      if (pts.length > 0) {
        localStrokesRef.current.push({
          points: pts,
          color: drawData.color || "#facc15",
          width: drawData.width || 4,
          initialAlpha: 0.95,
          expire: Date.now() + 4000,
          duration: 4000,
        });
      }
    } else if (drawData.type === "clear") {
      localStrokesRef.current = [];
      localLaserRef.current = null;
      ctx.clearRect(0, 0, w, h);
    }
  };

  useEffect(() => {
    let animId: number;
    const loop = () => {
      const canvas = whiteboardCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const now = Date.now();

          // Laser
          if (localLaserRef.current) {
            ctx.save();
            ctx.globalAlpha = localLaserRef.current.alpha;
            ctx.shadowBlur = 12;
            ctx.shadowColor = "#ff2222";
            ctx.fillStyle = "#ff2222";
            ctx.beginPath();
            ctx.arc(localLaserRef.current.x, localLaserRef.current.y, 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 4;
            ctx.shadowColor = "#ffffff";
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(localLaserRef.current.x, localLaserRef.current.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            localLaserRef.current.alpha *= 0.92;
            if (localLaserRef.current.alpha < 0.05) localLaserRef.current = null;
          }

          // Strokes
          localStrokesRef.current = localStrokesRef.current.filter((s) => now < s.expire);
          for (const s of localStrokesRef.current) {
            const ratio = Math.max(0, (s.expire - now) / s.duration);
            ctx.save();
            ctx.globalAlpha = ratio * s.initialAlpha;
            ctx.strokeStyle = s.color;
            ctx.lineWidth = s.width;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.shadowBlur = 6;
            ctx.shadowColor = s.color;

            ctx.beginPath();
            for (let i = 0; i < s.points.length; i++) {
              const pt = s.points[i];
              if (i === 0) ctx.moveTo(pt.x, pt.y);
              else ctx.lineTo(pt.x, pt.y);
            }
            ctx.stroke();
            ctx.restore();
          }
        }
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleWhiteboardMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (whiteboardMode !== "pen") return;
    const coords = getCanvasCoordinates(e);
    if (!coords) return;
    isDrawingRef.current = true;
    currentStrokeRef.current = [{ x: coords.x, y: coords.y }];
  };

  const handleWhiteboardMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    if (whiteboardMode === "laser") {
      socketRef.current?.emit("remote:whiteboard", {
        sessionId,
        drawData: { type: "laser", x: coords.x, y: coords.y },
      });
      renderWhiteboardDataLocally({ type: "laser", x: coords.x, y: coords.y });
    } else if (whiteboardMode === "pen" && isDrawingRef.current) {
      currentStrokeRef.current.push({ x: coords.x, y: coords.y });
      // Live draw preview
      const canvas = whiteboardCanvasRef.current;
      if (canvas && currentStrokeRef.current.length > 1) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const w = canvas.width;
          const h = canvas.height;
          const len = currentStrokeRef.current.length;
          const p1 = currentStrokeRef.current[len - 2];
          const p2 = currentStrokeRef.current[len - 1];
          ctx.save();
          ctx.strokeStyle = penColor;
          ctx.lineWidth = 4;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(p1.x * w, p1.y * h);
          ctx.lineTo(p2.x * w, p2.y * h);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  };

  const handleWhiteboardMouseUp = () => {
    if (whiteboardMode === "pen" && isDrawingRef.current) {
      isDrawingRef.current = false;
      if (currentStrokeRef.current.length > 0) {
        socketRef.current?.emit("remote:whiteboard", {
          sessionId,
          drawData: {
            type: "line",
            points: currentStrokeRef.current,
            color: penColor,
            width: 4,
          },
        });
        renderWhiteboardDataLocally({
          type: "line",
          points: currentStrokeRef.current,
          color: penColor,
          width: 4,
        });
      }
      currentStrokeRef.current = [];
    }
  };

  const clearWhiteboard = () => {
    socketRef.current?.emit("remote:whiteboard", { sessionId, drawData: { type: "clear" } });
    renderWhiteboardDataLocally({ type: "clear" });
    showToast("🧹 Çizimler temizlendi.");
  };

  // --- 4. Görev Yöneticisi Fonksiyonları ---
  const fetchProcesses = () => {
    setIsLoadingProcesses(true);
    socketRef.current?.emit("remote:get-processes", { sessionId });
  };

  const killProcess = (pid: number, name: string) => {
    if (!confirm(`[PID: ${pid}] "${name}" sürecini sonlandırmak istediğinize emin misiniz?`)) return;
    socketRef.current?.emit("remote:kill-process", { sessionId, pid });
    setProcessList((prev) => prev.filter((p) => p.pid !== pid));
    showToast(`⚡ ${name} (PID: ${pid}) sonlandırıldı.`);
  };

  // --- 5. UAC / Yönetici Yetkisi Yükseltme ---
  const requestAdminElevation = () => {
    if (!confirm("İstemci ajanını Windows Yönetici (Administrator) yetkileriyle yeniden başlatmak istiyor musunuz?")) return;
    setIsElevating(true);
    setElevateNotice("İstemcide Windows UAC onay kutusu bekleniyor... Ajan birkaç saniye içinde aynı destek koduna bağlanacaktır.");
    socketRef.current?.emit("remote:elevate", { sessionId });
    setTimeout(() => {
      setIsElevating(false);
      setElevateNotice(null);
    }, 12000);
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

  const lastMouseMoveRef = useRef(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (connectionState !== "connected" || !socketRef.current) return;
    const now = performance.now();
    // Throttle mouse moves to ~25ms (~40 FPS) to prevent socket buffer congestion & micro-stutters
    if (now - lastMouseMoveRef.current < 25) return;
    lastMouseMoveRef.current = now;

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

    // Auto Ctrl+V Clipboard Sync to Agent
    if (e.ctrlKey && (e.key === "v" || e.key === "V")) {
      e.preventDefault();
      navigator.clipboard?.readText().then((text) => {
        if (text) {
          socketRef.current?.emit("remote:clipboard", { sessionId, text, sender: "tech" });
          showToast(`📋 Pano (${text.length} karakter) istemciye yapıştırıldı!`);
        }
      }).catch(() => {});
      return;
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
              {/* File Transfer Button */}
              <button
                onClick={() => {
                  setShowFileModal(true);
                  if (remoteFiles.length === 0) fetchRemoteFiles("desktop");
                }}
                title="Çift Yönlü Dosya Transferi (Yükle / İndir)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-amber-400">folder_open</span>
                <span>Dosya Transferi</span>
                {uploadProgress && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5"></span>
                )}
              </button>

              {/* Clipboard Sync Button */}
              <button
                onClick={sendClipboardToAgent}
                title="Yerel Panodaki Metni/Şifreyi Karşı Bilgisayara Gönder"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-cyan-400">content_paste_go</span>
                <span>Panoyu Gönder</span>
              </button>

              {/* Whiteboard / Annotation Controls */}
              <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
                <button
                  onClick={() => setWhiteboardMode("normal")}
                  title="Normal Fare / Klavye Kontrol Modu"
                  className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                    whiteboardMode === "normal"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-[15px]">near_me</span>
                </button>
                <button
                  onClick={() => setWhiteboardMode("laser")}
                  title="Kırmızı Lazer İşaretçi Modu (Ekranda dikkat çekmek için)"
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    whiteboardMode === "laser"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-rose-400"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                  <span>Lazer</span>
                </button>
                <button
                  onClick={() => setWhiteboardMode("pen")}
                  title="Serbest Ekrana Çizim Modu (4 saniyede kendiliğinden solar)"
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    whiteboardMode === "pen"
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-slate-400 hover:text-amber-400"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                  <span>Kalem</span>
                </button>
                {whiteboardMode === "pen" && (
                  <div className="flex items-center gap-1 px-1 border-l border-slate-800">
                    <button
                      onClick={() => setPenColor("#facc15")}
                      className={`w-3.5 h-3.5 rounded-full bg-yellow-400 ${penColor === "#facc15" ? "ring-2 ring-white" : ""}`}
                    />
                    <button
                      onClick={() => setPenColor("#ef4444")}
                      className={`w-3.5 h-3.5 rounded-full bg-red-500 ${penColor === "#ef4444" ? "ring-2 ring-white" : ""}`}
                    />
                    <button
                      onClick={() => setPenColor("#3b82f6")}
                      className={`w-3.5 h-3.5 rounded-full bg-blue-500 ${penColor === "#3b82f6" ? "ring-2 ring-white" : ""}`}
                    />
                  </div>
                )}
                {whiteboardMode !== "normal" && (
                  <button
                    onClick={clearWhiteboard}
                    title="Tüm Çizimleri Temizle"
                    className="p-1 rounded-md text-slate-400 hover:text-rose-400 text-xs"
                  >
                    <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
                  </button>
                )}
              </div>

              {/* Diagnostics & Process Killer Button */}
              <button
                onClick={() => {
                  setShowSysInfoModal(true);
                  setDiagnosticsTab("sysinfo");
                  requestSysInfo();
                  fetchProcesses();
                }}
                title="Sistem Donanım & Görev Yöneticisi (Process Killer)"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-indigo-400">insights</span>
                <span>Sistem & Görevler</span>
              </button>

              {/* Elevate to Admin Button */}
              <button
                onClick={requestAdminElevation}
                disabled={isElevating}
                title="İstemciyi Windows Yönetici (Administrator / UAC) Yetkisiyle Yeniden Başlat"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  isElevating
                    ? "bg-amber-950/80 border-amber-600 text-amber-300 animate-pulse"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                }`}
              >
                <span className="material-symbols-outlined text-[15px] text-amber-400">shield_person</span>
                <span className="hidden xl:inline">{isElevating ? "UAC Bekleniyor..." : "Yetki Yükselt"}</span>
              </button>

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

      
      {/* DEDICATED HIGH-VISIBILITY MULTI-MONITOR SELECTOR BAR */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs gap-3 flex-wrap z-10">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 font-black text-cyan-300 bg-cyan-950/90 border border-cyan-700/80 px-3 py-1.5 rounded-xl shadow-xs">
            <span className="material-symbols-outlined text-[18px] text-cyan-400">devices</span>
            <span className="uppercase tracking-wider text-[11px]">Monitör Seçimi:</span>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/90 p-1 rounded-xl border border-slate-800 shadow-inner">
            {displayListToRender.map((disp, idx) => {
              const dispIdx = typeof disp.index === "number" ? disp.index : idx;
              const isActive = activeDisplayIndex === dispIdx;
              return (
                <button
                  key={dispIdx}
                  onClick={() => switchDisplay(dispIdx)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/40 border border-cyan-300 scale-[1.02]"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {disp.isPrimary ? "star" : "desktop_windows"}
                  </span>
                  <span>{disp.name || `${dispIdx + 1}. Ekran`}</span>
                  {disp.width > 0 && (
                    <span className="text-[10px] font-mono opacity-75">
                      ({disp.width}x{disp.height})
                    </span>
                  )}
                  {isActive && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-white/25 text-white font-black uppercase tracking-wider">
                      Aktif
                    </span>
                  )}
                </button>
              );
            })}

            <button
              onClick={refreshDisplays}
              title="Bağlı tüm monitörleri yeniden tara"
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-colors cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[16px] ${isRefreshingDisplays ? "animate-spin text-cyan-400" : ""}`}>
                sync
              </span>
              <span className="text-xs font-semibold">Taramayı Yenile</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Görüntülenen: <strong className="text-white">{activeDisplayIndex + 1}. Ekran</strong></span>
          </span>
          <span className="hidden lg:inline text-[11px] text-slate-500 font-mono">
            {displays.length > 0 ? `(${displays.length} monitör algılandı)` : "(Çoklu ekran hazır)"}
          </span>
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

        {/* Whiteboard & Laser Annotation Transparent Canvas Overlay */}
        <canvas
          ref={whiteboardCanvasRef}
          width={canvasRef.current?.width || 1280}
          height={canvasRef.current?.height || 720}
          onMouseDown={handleWhiteboardMouseDown}
          onMouseMove={handleWhiteboardMouseMove}
          onMouseUp={handleWhiteboardMouseUp}
          onContextMenu={(e) => e.preventDefault()}
          className={`absolute inset-0 w-full h-full object-contain transition-all z-20 ${
            whiteboardMode === "normal" ? "pointer-events-none" : "pointer-events-auto cursor-crosshair"
          } ${connectionState === "connected" ? "block" : "hidden"}`}
        />

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

      {/* File Transfer Manager Modal */}
      {showFileModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 flex flex-col gap-4 animate-fadeIn max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">folder_open</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">Çift Yönlü Dosya Yöneticisi & Transfer</span>
                  <span className="text-[11px] text-slate-400">Teknisyen ve İstemci arasında güvenli dosya aktarımı</span>
                </div>
              </div>
              <button onClick={() => setShowFileModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setFileTab("upload")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  fileTab === "upload" ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">upload</span>
                <span>Dosya Gönder (Upload)</span>
              </button>
              <button
                onClick={() => {
                  setFileTab("browse");
                  if (remoteFiles.length === 0) fetchRemoteFiles("desktop");
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  fileTab === "browse" ? "bg-amber-500 text-slate-950 shadow-sm" : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>İstemci Dosyaları (İndir)</span>
              </button>
            </div>

            {/* Tab 1: Upload */}
            {fileTab === "upload" && (
              <div className="flex flex-col gap-4 overflow-y-auto pr-1">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleUploadFile(e.dataTransfer.files[0], "desktop");
                    }
                  }}
                  className="border-2 border-dashed border-slate-700 hover:border-amber-400/80 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-950/50 hover:bg-slate-950 transition-all text-center group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-slate-200">Dosyayı buraya sürükleyip bırakın</span>
                    <span className="text-xs text-slate-400">veya bilgisayarınızdan seçin (Masaüstüne kaydedilir)</span>
                  </div>
                  <label className="mt-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer transition-colors">
                    Dosya Seç
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleUploadFile(e.target.files[0], "desktop");
                        }
                      }}
                    />
                  </label>
                </div>

                {uploadProgress && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-amber-400">sync</span>
                        {uploadProgress.fileName}
                      </span>
                      <span className="font-mono text-amber-400 font-bold">{uploadProgress.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-200"
                        style={{ width: `${uploadProgress.progress}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">Durum: {uploadProgress.status}</span>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Browse & Download */}
            {fileTab === "browse" && (
              <div className="flex flex-col gap-3 overflow-y-auto pr-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => fetchRemoteFiles("desktop")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        currentRemoteDir === "desktop" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Masaüstü
                    </button>
                    <button
                      onClick={() => fetchRemoteFiles("downloads")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        currentRemoteDir === "downloads" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      İndirilenler
                    </button>
                    <button
                      onClick={() => fetchRemoteFiles("documents")}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                        currentRemoteDir === "documents" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Belgeler
                    </button>
                  </div>
                  <button
                    onClick={() => fetchRemoteFiles(currentRemoteDir)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title="Yenile"
                  >
                    <span className={`material-symbols-outlined text-[16px] ${isLoadingFiles ? "animate-spin" : ""}`}>refresh</span>
                  </button>
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950">
                  {isLoadingFiles ? (
                    <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-3xl animate-spin text-amber-400">progress_activity</span>
                      <span>Klasör taranıyor...</span>
                    </div>
                  ) : remoteFiles.length === 0 ? (
                    <div className="py-12 text-center text-slate-500 text-xs">Bu dizinde dosya bulunamadı veya yetki verilmedi.</div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800 sticky top-0">
                        <tr>
                          <th className="p-2.5">Dosya Adı</th>
                          <th className="p-2.5">Boyut</th>
                          <th className="p-2.5 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {remoteFiles.map((file, i) => (
                          <tr key={i} className="hover:bg-slate-900/50 transition-colors">
                            <td className="p-2.5 flex items-center gap-2 text-slate-200">
                              <span className="material-symbols-outlined text-[16px] text-amber-400">
                                {file.isDir ? "folder" : "description"}
                              </span>
                              <span className="truncate max-w-xs">{file.name}</span>
                            </td>
                            <td className="p-2.5 text-slate-400">
                              {file.isDir ? "-" : `${(file.size / 1024).toFixed(1)} KB`}
                            </td>
                            <td className="p-2.5 text-right">
                              {!file.isDir && (
                                <button
                                  onClick={() => downloadRemoteFile(file.path)}
                                  className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 text-[11px] font-bold transition-colors cursor-pointer"
                                >
                                  İndir
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Transfer Activity Logs */}
            {transferLogs.length > 0 && (
              <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 max-h-24 overflow-y-auto text-[11px] font-mono">
                {transferLogs.slice(0, 5).map((log, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-slate-500">{log.time}</span>
                    <span className={log.type === "success" ? "text-emerald-400" : log.type === "error" ? "text-rose-400" : "text-slate-300"}>
                      {log.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Diagnostics & Task Manager Modal */}
      {showSysInfoModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 flex flex-col gap-4 animate-fadeIn max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <span className="material-symbols-outlined text-[22px]">insights</span>
                <span>Sistem Tanılama & Görev Yöneticisi</span>
              </div>
              <button onClick={() => setShowSysInfoModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Diagnostics Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                onClick={() => setDiagnosticsTab("sysinfo")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  diagnosticsTab === "sysinfo" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">devices</span>
                <span>Donanım & Sistem Özeti</span>
              </button>
              <button
                onClick={() => {
                  setDiagnosticsTab("processes");
                  if (processList.length === 0) fetchProcesses();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  diagnosticsTab === "processes" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">memory</span>
                <span>Çalışan Süreçler ({processList.length})</span>
              </button>
            </div>

            {/* Tab 1: System Info */}
            {diagnosticsTab === "sysinfo" && (
              <div className="flex flex-col gap-3 overflow-y-auto">
                {sysInfo ? (
                  <div className="flex flex-col gap-2 text-xs font-mono">
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50">
                      <span className="text-slate-400">Cihaz Adı:</span>
                      <span className="font-bold text-white">{sysInfo.hostname}</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50">
                      <span className="text-slate-400">İşletim Sistemi:</span>
                      <span className="text-emerald-400 font-bold">{sysInfo.os}</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50">
                      <span className="text-slate-400">İşlemci (CPU):</span>
                      <span className="text-blue-300 font-bold">{sysInfo.cpu} ({sysInfo.cpuCores} Çekirdek)</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50">
                      <span className="text-slate-400">Bellek (RAM):</span>
                      <span className="text-amber-300 font-bold">{sysInfo.memory}</span>
                    </div>
                    <div className="flex justify-between p-2.5 rounded-xl bg-slate-800/70 border border-slate-700/50">
                      <span className="text-slate-400">Açık Kalma Süresi:</span>
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
              </div>
            )}

            {/* Tab 2: Processes (Task Manager) */}
            {diagnosticsTab === "processes" && (
              <div className="flex flex-col gap-3 overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    placeholder="Süreç ara (örn: chrome, cmd)..."
                    value={processSearch}
                    onChange={(e) => setProcessSearch(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={fetchProcesses}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                    title="Yenile"
                  >
                    <span className={`material-symbols-outlined text-[16px] ${isLoadingProcesses ? "animate-spin" : ""}`}>refresh</span>
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto border border-slate-800 rounded-xl bg-slate-950 font-mono text-xs">
                  {isLoadingProcesses ? (
                    <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-3xl animate-spin text-indigo-400">progress_activity</span>
                      <span>Süreçler taranıyor...</span>
                    </div>
                  ) : (
                    <table className="w-full text-left">
                      <thead className="bg-slate-900 border-b border-slate-800 sticky top-0 text-slate-400">
                        <tr>
                          <th className="p-2">PID</th>
                          <th className="p-2">Süreç Adı</th>
                          <th className="p-2">CPU</th>
                          <th className="p-2">Bellek</th>
                          <th className="p-2 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {processList
                          .filter((p) => !processSearch || p.name.toLowerCase().includes(processSearch.toLowerCase()))
                          .map((proc) => (
                            <tr key={proc.pid} className="hover:bg-slate-900/50 transition-colors">
                              <td className="p-2 text-slate-500">{proc.pid}</td>
                              <td className="p-2 text-slate-200 font-bold">{proc.name}</td>
                              <td className="p-2 text-blue-400">{proc.cpu}%</td>
                              <td className="p-2 text-amber-400">{proc.memoryMB} MB</td>
                              <td className="p-2 text-right">
                                <button
                                  onClick={() => killProcess(proc.pid, proc.name)}
                                  className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white text-[10px] font-bold transition-colors cursor-pointer"
                                >
                                  Sonlandır
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clipboard Toast Notification */}
      {clipboardToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-slate-900/95 border border-slate-700 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 animate-fadeIn backdrop-blur">
          <span>{clipboardToast}</span>
        </div>
      )}

      {/* Admin Elevation Banner Notice */}
      {elevateNotice && (
        <div className="absolute top-14 left-1/2 transform -translate-x-1/2 z-40 px-6 py-3 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2.5 animate-bounce">
          <span className="material-symbols-outlined text-[20px]">shield_person</span>
          <span>{elevateNotice}</span>
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
