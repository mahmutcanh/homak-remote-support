"use client";

import React, { useEffect, useState, useRef } from "react";

interface AudioDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartCall: (selectedMicId: string, selectedSpeakerId: string) => void;
  isCallActive: boolean;
  onEndCall: () => void;
  isRecordingAudio: boolean;
  onToggleAudioRecord: () => void;
}

export function AudioDeviceModal({
  isOpen,
  onClose,
  onStartCall,
  isCallActive,
  onEndCall,
  isRecordingAudio,
  onToggleAudioRecord,
}: AudioDeviceModalProps) {
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [speakers, setSpeakers] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>("");
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>("");
  const [micLevel, setMicLevel] = useState<number>(0);
  const [speakerTestPlaying, setSpeakerTestPlaying] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const loadDevices = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices.filter((d) => d.kind === "audioinput");
        const spks = devices.filter((d) => d.kind === "audiooutput");

        setMicrophones(mics);
        setSpeakers(spks);

        if (mics.length > 0 && !selectedMic) setSelectedMic(mics[0].deviceId);
        if (spks.length > 0 && !selectedSpeaker) setSelectedSpeaker(spks[0].deviceId);
      } catch (err) {
        console.error("Audio device enumeration error:", err);
      }
    };

    loadDevices();
  }, [isOpen, selectedMic, selectedSpeaker]);

  // Live Microphone Level Meter Test
  useEffect(() => {
    if (!isOpen || !selectedMic) return;

    let isMounted = true;

    const startMicMeter = async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: selectedMic } },
        });
        streamRef.current = stream;

        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioCtxRef.current = ctx;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateMeter = () => {
          if (!isMounted) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const average = sum / dataArray.length;
          const level = Math.min(100, Math.round((average / 128) * 100));
          setMicLevel(level);

          animFrameRef.current = requestAnimationFrame(updateMeter);
        };

        updateMeter();
      } catch (err) {
        console.error("Mic meter error:", err);
      }
    };

    startMicMeter();

    return () => {
      isMounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    };
  }, [isOpen, selectedMic]);

  // Speaker Tone Test
  const testSpeakerTone = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime); // 440Hz A4 note tone
      gain.gain.setValueAtTime(0.1, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      setSpeakerTestPlaying(true);

      setTimeout(() => {
        osc.stop();
        ctx.close();
        setSpeakerTestPlaying(false);
      }, 1000);
    } catch (e) {
      console.error("Speaker test error:", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl text-slate-100 flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
            <span className="material-symbols-outlined text-[22px]">mic</span>
            <span>Sesli Görüşme & Mikrofon / Hoparlör Ayarları</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Microphone Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-indigo-400">mic</span>
            <span>Mikrofon Seçimi</span>
          </label>
          <select
            value={selectedMic}
            onChange={(e) => setSelectedMic(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500"
          >
            {microphones.map((mic) => (
              <option key={mic.deviceId} value={mic.deviceId}>
                {mic.label || `Mikrofon (${mic.deviceId.slice(0, 8)})`}
              </option>
            ))}
          </select>

          {/* Live Mic Volume Level Meter Bar */}
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Canlı Mikrofon Ses Şiddeti (Desibel İbresi):</span>
              <span className="font-mono text-emerald-400 font-bold">{micLevel}%</span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700 p-0.5">
              <div
                className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500"
                style={{ width: `${micLevel}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Speaker Selection */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-indigo-400">volume_up</span>
            <span>Hoparlör / Çıktı Cihazı</span>
          </label>
          <div className="flex gap-2">
            <select
              value={selectedSpeaker}
              onChange={(e) => setSelectedSpeaker(e.target.value)}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500"
            >
              {speakers.map((spk) => (
                <option key={spk.deviceId} value={spk.deviceId}>
                  {spk.label || `Hoparlör (${spk.deviceId.slice(0, 8)})`}
                </option>
              ))}
            </select>
            <button
              onClick={testSpeakerTone}
              disabled={speakerTestPlaying}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-semibold text-indigo-300 flex items-center gap-1 shrink-0 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">graphic_eq</span>
              <span>{speakerTestPlaying ? "Sesi Test Ediliyor..." : "Sesi Test Et"}</span>
            </button>
          </div>
        </div>

        {/* Audio Recording Auto Banner */}
        <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-rose-400 animate-pulse">
              graphic_eq
            </span>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-emerald-300">Otomatik Ses Kaydı Etkin</span>
              <span className="text-[11px] text-slate-300">Görüşme ses kayıtları güvenlik nedeniyle otomatik kaydedilir.</span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-rose-900/60 text-rose-200 text-[10px] font-mono font-bold border border-rose-700/50">
            AUTO RECORD
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
          {isCallActive ? (
            <button
              onClick={onEndCall}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">call_end</span>
              <span>Sesli Görüşmeyi Sonlandır</span>
            </button>
          ) : (
            <button
              onClick={() => onStartCall(selectedMic, selectedSpeaker)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">call</span>
              <span>Sesli Görüşmeyi Başlat</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
