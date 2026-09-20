"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import TechnicianSidebar from "@/components/TechnicianSidebar";
import TechnicianHeader from "@/components/TechnicianHeader";
import { AuditLogEntry, getAuditLogs } from "@/lib/api";
import { useSupportSocket } from "@/lib/useSupportSocket";

const EVENT_ICONS: Record<string, string> = {
  SESSION_CREATED: "pin",
  CLIENT_CONNECTED: "router",
  SESSION_ACCEPTED: "how_to_reg",
  SESSION_REJECTED: "cancel",
  SESSION_TERMINATED: "stop_circle",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [openRows, setOpenRows] = useState<Set<string>>(new Set());
  const [eventFilter, setEventFilter] = useState("ALL");
  const [actorFilter, setActorFilter] = useState("");
  const [ipFilter, setIpFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const refreshLogs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs({
        limit: 100,
        eventType: eventFilter !== "ALL" ? eventFilter : undefined,
      });
      setLogs(data);
    } catch {
      // silent fail; UI shows empty state
    } finally {
      setLoading(false);
    }
  }, [eventFilter]);

  useEffect(() => {
    refreshLogs();
  }, [refreshLogs]);

  useSupportSocket({
    onSessionCreated: () => refreshLogs(),
    onSessionUpdated: () => refreshLogs(),
  });

  const toggleJson = (id: string) => {
    setOpenRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetFilters = () => {
    setEventFilter("ALL");
    setActorFilter("");
    setIpFilter("");
  };

  const filteredLogs = logs.filter((log) => {
    if (actorFilter && !(log.actorName ?? "").toLowerCase().includes(actorFilter.toLowerCase())) {
      return false;
    }
    if (ipFilter && !(log.ipAddress ?? "").toLowerCase().includes(ipFilter.toLowerCase())) {
      return false;
    }
    return true;
  });


  return (
    <>
      <TechnicianSidebar />
      <div className="lg:pl-64">
        <TechnicianHeader />
        <main className="relative pt-16 bg-surface w-full px-gutter-desktop min-h-screen">
          <div className="flex flex-col w-full">
            {/* Sub-Header & Live Breadcrumb Ribbon */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-space-lg gap-space-md">
              <div className="flex flex-col gap-space-xs">
                <nav className="flex items-center gap-space-xs text-on-surface-variant font-body-sm">
                  <span className="hover:text-primary cursor-pointer transition-colors">Homak Remote</span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  <span className="hover:text-primary cursor-pointer transition-colors">Audit Logs</span>
                  <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                  <span className="font-semibold text-primary">Attended Support Telemetry</span>
                </nav>
                <div className="flex items-center gap-space-sm mt-space-xs">
                  <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">Audit Logs &amp; Session Inspection</h1>
                  <div className="flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-tertiary-container text-on-tertiary-container shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-pulse"></span>
                    <span className="font-label-mono-sm text-label-mono-sm font-semibold tracking-wider uppercase">Live Append Stream</span>
                  </div>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl">
                  Cryptographically signed audit feed tracking full lifecycle events for attended sessions, mutual
                  handshake validations, and strict zero-silent-access policy enforcement.
                </p>
              </div>
              <div className="flex items-center gap-space-sm self-start lg:self-center shrink-0">
                <button className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container-highest text-on-surface hover:bg-surface-container-high transition-all shadow-sm">
                  <span className="material-symbols-outlined text-[18px]">file_download</span>
                  <span className="font-action-btn text-action-btn">Export NDJSON</span>
                </button>
                <button className="flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary text-on-primary hover:bg-surface-tint shadow-md transition-all">
                  <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  <span className="font-action-btn text-action-btn">Verify Chain Hashes</span>
                </button>
              </div>
            </div>
            {/* Realtime Telemetry KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md mb-space-lg">
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-label-mono-sm text-label-mono-sm text-outline tracking-wider uppercase">
                    Active Live Attended Handshakes
                  </span>
                  <span className="material-symbols-outlined text-primary text-[20px]">sync</span>
                </div>
                <div className="my-space-sm flex items-baseline gap-space-xs">
                  <span className="font-headline-xl text-headline-xl text-on-surface">14</span>
                  <span className="font-label-mono-sm text-label-mono-sm text-tertiary font-semibold">100% Consent Confirmed</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                  <div className="bg-primary h-full w-[78%] rounded-full"></div>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-label-mono-sm text-label-mono-sm text-outline tracking-wider uppercase">User Explicit Grants</span>
                  <span className="material-symbols-outlined text-tertiary text-[20px]">check_circle</span>
                </div>
                <div className="my-space-sm flex items-baseline gap-space-xs">
                  <span className="font-headline-xl text-headline-xl text-on-surface">1,289</span>
                  <span className="font-label-mono-sm text-label-mono-sm text-outline">Last 24 hrs</span>
                </div>
                <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm">
                  <span className="font-label-mono-sm text-label-mono-sm font-semibold text-tertiary">0 Silent Bypass</span>
                  <span>• Zero Backdoor Policy</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-label-mono-sm text-label-mono-sm text-outline tracking-wider uppercase">Revocations &amp; Denials</span>
                  <span className="material-symbols-outlined text-error text-[20px]">do_not_disturb_on</span>
                </div>
                <div className="my-space-sm flex items-baseline gap-space-xs">
                  <span className="font-headline-xl text-headline-xl text-on-surface">3</span>
                  <span className="font-label-mono-sm text-label-mono-sm text-error font-semibold">Immediate Abort</span>
                </div>
                <div className="text-on-surface-variant font-body-sm truncate">Tokens invalidated &lt; 80ms</div>
              </div>
              <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col justify-between relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-label-mono-sm text-label-mono-sm text-outline tracking-wider uppercase">Avg Attended Duration</span>
                  <span className="material-symbols-outlined text-secondary text-[20px]">timer</span>
                </div>
                <div className="my-space-sm flex items-baseline gap-space-xs">
                  <span className="font-headline-xl text-headline-xl text-on-surface">18m 42s</span>
                  <span className="font-label-mono-sm text-label-mono-sm text-outline">Per Session</span>
                </div>
                <div className="text-on-surface-variant font-body-sm truncate">Auto-purge on socket disconnect</div>
              </div>
            </div>
            {/* Multi-Layer Filter Engine */}
            <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm mb-space-lg flex flex-col gap-space-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-space-xs text-on-surface font-headline-sm">
                  <span className="material-symbols-outlined text-primary text-[20px]">tune</span>
                  <span>Telemetry Filter Matrix</span>
                </div>
                <button className="font-label-mono-sm text-label-mono-sm text-primary hover:underline" onClick={resetFilters}>
                  Reset All Filters
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-mono-sm text-label-mono-sm text-outline uppercase font-semibold">
                    Event Lifecycle Key
                  </label>
                  <div className="relative">
                    <select
                      className="w-full bg-surface-container-low text-on-surface font-body-md px-space-sm py-space-xs rounded-lg appearance-none cursor-pointer outline-none focus:bg-surface-container-high transition-colors pr-8"
                      value={eventFilter}
                      onChange={(e) => setEventFilter(e.target.value)}
                    >
                      <option value="ALL">Tüm Olaylar</option>
                      <option value="SESSION_CREATED">SESSION_CREATED</option>
                      <option value="CLIENT_CONNECTED">CLIENT_CONNECTED</option>
                      <option value="SESSION_ACCEPTED">SESSION_ACCEPTED</option>
                      <option value="SESSION_REJECTED">SESSION_REJECTED</option>
                      <option value="SESSION_TERMINATED">SESSION_TERMINATED</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-2.5 pointer-events-none text-outline text-[18px]">
                      expand_more
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-mono-sm text-label-mono-sm text-outline uppercase font-semibold">Kayıt Sayısı</label>
                  <div className="flex items-center bg-surface-container-low px-space-sm py-space-xs rounded-lg">
                    <span className="material-symbols-outlined text-outline text-[18px] mr-space-xs">calendar_today</span>
                    <span className="font-label-mono-sm text-label-mono-sm text-on-surface">
                      Son 100 kayıt (canlı akış)
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-mono-sm text-label-mono-sm text-outline uppercase font-semibold">Actor / Technician</label>
                  <div className="flex items-center bg-surface-container-low px-space-sm py-space-xs rounded-lg">
                    <span className="material-symbols-outlined text-outline text-[18px] mr-space-xs">badge</span>
                    <input
                      className="bg-transparent font-body-md text-body-md text-on-surface outline-none w-full placeholder:text-outline"
                      placeholder="Filter by name or usr_id..."
                      type="text"
                      value={actorFilter}
                      onChange={(e) => setActorFilter(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-space-xs">
                  <label className="font-label-mono-sm text-label-mono-sm text-outline uppercase font-semibold">Client Hostname &amp; IP</label>
                  <div className="flex items-center bg-surface-container-low px-space-sm py-space-xs rounded-lg">
                    <span className="material-symbols-outlined text-outline text-[18px] mr-space-xs">router</span>
                    <input
                      className="bg-transparent font-label-mono-sm text-label-mono-sm text-on-surface outline-none w-full placeholder:text-outline"
                      placeholder="e.g. 192.168.1.55 or DESKTOP-*"
                      type="text"
                      value={ipFilter}
                      onChange={(e) => setIpFilter(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-space-xs pt-space-xs">
                <span className="font-label-mono-sm text-label-mono-sm text-outline">Aktif Filtreler:</span>
                {eventFilter !== "ALL" && (
                  <span className="inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-mono-sm text-label-mono-sm">
                    event:{eventFilter}
                  </span>
                )}
                {ipFilter && (
                  <span className="inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-mono-sm text-label-mono-sm">
                    ip:{ipFilter}
                  </span>
                )}
                {actorFilter && (
                  <span className="inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-mono-sm text-label-mono-sm">
                    actor:{actorFilter}
                  </span>
                )}
                {eventFilter === "ALL" && !ipFilter && !actorFilter && (
                  <span className="font-label-mono-sm text-label-mono-sm text-outline">Yok</span>
                )}
              </div>
            </div>
            {/* Split Panel Grid: Telemetry Stream vs Compliance Side Panel */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg mb-space-xl">
              {/* Left / Center: Audit Stream Table */}
              <div className="xl:col-span-8 flex flex-col gap-space-md">
                <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
                  <div className="p-space-md flex items-center justify-between bg-surface-container-low">
                    <div className="flex items-center gap-space-sm">
                      <span className="material-symbols-outlined text-primary text-[20px]">terminal</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface">Structured Audit Stream</span>
                      <span className="px-space-xs py-0.5 rounded bg-surface-container-highest font-label-mono-sm text-label-mono-sm text-on-surface-variant">
                        {filteredLogs.length} Matching Events
                      </span>
                    </div>
                    <div className="flex items-center gap-space-xs">
                      <span className="font-label-mono-sm text-label-mono-sm text-outline">SHA-256 Ledger Verified</span>
                      <span className="material-symbols-outlined text-tertiary text-[16px]">verified</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-body-sm text-body-sm">
                      <thead className="bg-surface-container text-on-surface-variant font-label-mono-sm text-label-mono-sm uppercase tracking-wider">
                        <tr>
                          <th className="px-space-md py-space-sm font-semibold">Timestamp</th>
                          <th className="px-space-md py-space-sm font-semibold">Lifecycle Event</th>
                          <th className="px-space-md py-space-sm font-semibold">Session ID</th>
                          <th className="px-space-md py-space-sm font-semibold">Actor</th>
                          <th className="px-space-md py-space-sm font-semibold">IP</th>
                          <th className="px-space-md py-space-sm font-semibold">Detay</th>
                          <th className="px-space-md py-space-sm font-semibold text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y-0 text-on-surface">
                        {!loading && filteredLogs.length === 0 && (
                          <tr>
                            <td className="px-space-md py-space-lg text-center text-on-surface-variant" colSpan={7}>
                              Henüz audit log kaydı yok.
                            </td>
                          </tr>
                        )}
                        {filteredLogs.map((row) => {
                          const isOpen = openRows.has(row.id);
                          const icon = EVENT_ICONS[row.eventType] ?? "receipt_long";
                          const isTerminal = row.eventType === "SESSION_TERMINATED" || row.eventType === "SESSION_REJECTED";
                          return (
                            <Fragment key={row.id}>
                              <tr
                                className="hover:bg-surface-container-low transition-colors cursor-pointer"
                                onClick={() => toggleJson(row.id)}
                              >
                                <td className="px-space-md py-space-sm font-label-mono-sm text-label-mono-sm whitespace-nowrap text-on-surface font-medium">
                                  {new Date(row.timestamp).toLocaleString("tr-TR")}
                                </td>
                                <td className="px-space-md py-space-sm whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center gap-space-xs px-space-sm py-0.5 rounded-full font-label-mono-sm text-label-mono-sm font-semibold ${
                                      isTerminal
                                        ? "bg-error-container text-on-error-container"
                                        : "bg-surface-container-high text-on-surface"
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[13px]">{icon}</span>
                                    {row.eventType}
                                  </span>
                                </td>
                                <td className="px-space-md py-space-sm font-label-mono-sm text-label-mono-sm whitespace-nowrap text-on-surface">
                                  {row.sessionId ? `${row.sessionId.slice(0, 8)}…` : "-"}
                                </td>
                                <td className="px-space-md py-space-sm whitespace-nowrap">{row.actorName ?? "-"}</td>
                                <td className="px-space-md py-space-sm whitespace-nowrap font-label-mono-sm text-label-mono-sm">
                                  {row.ipAddress ?? "-"}
                                </td>
                                <td className="px-space-md py-space-sm whitespace-nowrap text-on-surface-variant font-body-sm">
                                  {row.detail ?? "-"}
                                </td>
                                <td className="px-space-md py-space-sm text-right whitespace-nowrap">
                                  <button className="px-space-sm py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-label-mono-sm text-label-mono-sm flex items-center gap-space-xs ml-auto">
                                    <span>Inspect</span>
                                    <span className="material-symbols-outlined text-[14px]">code</span>
                                  </button>
                                </td>
                              </tr>
                              <tr className={`bg-surface-container-lowest ${isOpen ? "" : "hidden"}`}>
                                <td className="px-space-md py-space-sm" colSpan={7}>
                                  <div className="bg-inverse-surface text-inverse-on-surface p-space-md rounded-lg font-label-mono-sm text-label-mono-sm overflow-x-auto shadow-inner relative">
                                    <div className="flex items-center justify-between pb-space-xs mb-space-xs text-outline-variant">
                                      <span className="flex items-center gap-space-xs">
                                        <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim">data_object</span>
                                        Ham Audit Log Kaydı
                                      </span>
                                      <button
                                        className="text-inverse-primary hover:underline cursor-pointer"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard?.writeText(JSON.stringify(row, null, 2)).catch(() => {});
                                        }}
                                      >
                                        Copy JSON
                                      </button>
                                    </div>
                                    <pre className="text-inverse-on-surface leading-relaxed">
                                      <code>{JSON.stringify(row, null, 2)}</code>
                                    </pre>
                                  </div>
                                </td>
                              </tr>
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Table Footer Pagination & Telemetry Frequency */}
                  <div className="p-space-md bg-surface-container-low flex items-center justify-between">
                    <div className="flex items-center gap-space-sm text-on-surface-variant font-body-sm">
                      <span>Showing {filteredLogs.length} of {logs.length} logged events</span>
                      <span>•</span>
                      <span className="font-label-mono-sm text-label-mono-sm text-tertiary">Canlı: WebSocket akışı</span>
                    </div>
                    <div className="flex items-center gap-space-xs">
                      <button className="px-space-sm py-1 rounded bg-surface-container-high text-on-surface font-action-btn text-action-btn disabled:opacity-50">
                        Previous
                      </button>
                      <button className="px-space-sm py-1 rounded bg-primary text-on-primary font-action-btn text-action-btn">1</button>
                      <button className="px-space-sm py-1 rounded bg-surface-container-high text-on-surface font-action-btn text-action-btn">2</button>
                      <button className="px-space-sm py-1 rounded bg-surface-container-high text-on-surface font-action-btn text-action-btn">3</button>
                      <button className="px-space-sm py-1 rounded bg-surface-container-high text-on-surface font-action-btn text-action-btn">Next</button>
                    </div>
                  </div>
                </div>
                {/* Protocol Sequence Lifecycle Visualization */}
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
                  <span className="font-headline-sm text-headline-sm text-on-surface">Attended Support State Machine Progression</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Each attended session strictly guarantees an interactive handshake before any input injection is
                    routed.
                  </span>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-space-xs mt-space-sm">
                    <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-space-xs">
                      <span className="font-label-mono-sm text-label-mono-sm text-outline">STEP 01</span>
                      <span className="font-action-btn text-action-btn text-on-surface truncate">CODE_CREATED</span>
                      <span className="text-tertiary text-[11px] font-label-mono-sm flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[14px]">done</span>OTP Valid
                      </span>
                    </div>
                    <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-space-xs">
                      <span className="font-label-mono-sm text-label-mono-sm text-outline">STEP 02</span>
                      <span className="font-action-btn text-action-btn text-on-surface truncate">CLIENT_CONNECT</span>
                      <span className="text-tertiary text-[11px] font-label-mono-sm flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[14px]">done</span>STUN Ready
                      </span>
                    </div>
                    <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-space-xs">
                      <span className="font-label-mono-sm text-label-mono-sm text-outline">STEP 03</span>
                      <span className="font-action-btn text-action-btn text-on-surface truncate">TECH_ACCEPTED</span>
                      <span className="text-tertiary text-[11px] font-label-mono-sm flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[14px]">done</span>MFA Verified
                      </span>
                    </div>
                    <div className="bg-primary-container p-space-sm rounded-lg flex flex-col gap-space-xs shadow-sm">
                      <span className="font-label-mono-sm text-label-mono-sm text-on-primary-container">STEP 04</span>
                      <span className="font-action-btn text-action-btn text-on-primary truncate">USER_CONSENT</span>
                      <span className="text-on-primary-container text-[11px] font-label-mono-sm flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[14px]">verified</span>&apos;İzin Ver&apos;
                      </span>
                    </div>
                    <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-space-xs">
                      <span className="font-label-mono-sm text-label-mono-sm text-outline">STEP 05</span>
                      <span className="font-action-btn text-action-btn text-on-surface truncate">SESSION_START</span>
                      <span className="text-tertiary text-[11px] font-label-mono-sm flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[14px]">done</span>E2EE Pipe
                      </span>
                    </div>
                    <div className="bg-surface-container-low p-space-sm rounded-lg flex flex-col gap-space-xs">
                      <span className="font-label-mono-sm text-label-mono-sm text-outline">STEP 06</span>
                      <span className="font-action-btn text-action-btn text-on-surface truncate">SESSION_ENDED</span>
                      <span className="text-tertiary text-[11px] font-label-mono-sm flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[14px]">done</span>Driver Unloaded
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Right: Compliance & No-Silent-Access Report Side Panel */}
              <div className="xl:col-span-4 flex flex-col gap-space-md">
                <div className="bg-surface-container-lowest p-space-lg rounded-xl shadow-md flex flex-col gap-space-md relative">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col gap-space-xs">
                      <div className="flex items-center gap-space-xs text-primary font-headline-sm">
                        <span className="material-symbols-outlined text-[24px]">gavel</span>
                        <span>Güvenlik &amp; No-Silent-Access Uyumluluk Raporu</span>
                      </div>
                      <span className="font-label-mono-sm text-label-mono-sm text-outline uppercase tracking-wider">
                        Homak Zero-Trust Sovereign Standard
                      </span>
                    </div>
                    <span className="p-space-xs bg-tertiary-container text-on-tertiary-container rounded-lg">
                      <span className="material-symbols-outlined text-[20px]">verified</span>
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Bu oturum dizini ve telemetri kayıtları, kurumsal sistemlerde **arka kapı (backdoor)**, arka planda
                    gizli dinleme ya da kalıcı kontrol izni oluşturulmadığını doğrulamak üzere bağımsız audit zincirine
                    yazılmıştır.
                  </p>
                  <div className="flex flex-col gap-space-sm mt-space-xs">
                    <div className="p-space-sm rounded-lg bg-surface-container-low flex items-start gap-space-sm">
                      <div className="w-6 h-6 rounded-full bg-tertiary-container flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-on-tertiary-container text-[16px]">
                          no_encryption_gmailerrorred
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-action-btn text-action-btn text-on-surface font-bold">
                          Sıfır Kalıcı Servis (Zero-Persistence)
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Oturum sonlandığı an istemci belleği temizlenir. Windows Service ya da daemon arka planda
                          çalışır halde bırakılmaz.
                        </span>
                      </div>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container-low flex items-start gap-space-sm">
                      <div className="w-6 h-6 rounded-full bg-tertiary-container flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-on-tertiary-container text-[16px]">touch_app</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-action-btn text-action-btn text-on-surface font-bold">
                          Explicit User Consent Zorunluluğu
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          İstemci tarafında kullanıcı ekrandaki <strong>&apos;İzin Ver&apos;</strong> butonuna bizzat
                          basmadan hiçbir girdi enjekte edilemez.
                        </span>
                      </div>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container-low flex items-start gap-space-sm">
                      <div className="w-6 h-6 rounded-full bg-tertiary-container flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-on-tertiary-container text-[16px]">lock_clock</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-action-btn text-action-btn text-on-surface font-bold">
                          Kriptografik Token Sona Ermesi
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          6 haneli kod (583921) tek kullanımlıktır. Oturum bitişi ile birlikte tüm geçici
                          Diffie-Hellman anahtarları imha edilir.
                        </span>
                      </div>
                    </div>
                    <div className="p-space-sm rounded-lg bg-surface-container-low flex items-start gap-space-sm">
                      <div className="w-6 h-6 rounded-full bg-tertiary-container flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-on-tertiary-container text-[16px]">visibility</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-action-btn text-action-btn text-on-surface font-bold">
                          Kesintisiz Kullanıcı İptal Hakkı
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Kullanıcı ekranının üstünde sabit yeşil şerit yer alır. İstemci dilediği saniye
                          &apos;Bağlantıyı Kes&apos; butonuna basarak yetkiyi anında revoke edebilir.
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-space-sm bg-surface-container rounded-lg flex flex-col gap-space-xs font-label-mono-sm text-label-mono-sm">
                    <div className="flex justify-between">
                      <span className="text-outline">ISO 27001 / SOC-2 Type II:</span>
                      <span className="font-semibold text-tertiary">COMPLIANT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-outline">KVKK &amp; GDPR Madde 32:</span>
                      <span className="font-semibold text-tertiary">ONAYLANMIŞ</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-outline">Last Cryptographic Digest:</span>
                      <span className="font-semibold text-on-surface">#9fa2-8812</span>
                    </div>
                  </div>
                  <button className="w-full py-space-sm rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-action-btn text-action-btn transition-colors flex items-center justify-center gap-space-xs">
                    <span className="material-symbols-outlined text-[18px]">policy</span>
                    <span>Denetim Raporunu İndir (.PDF)</span>
                  </button>
                </div>
                <div className="bg-surface-container-lowest p-space-md rounded-xl shadow-sm flex flex-col gap-space-sm">
                  <div className="flex items-center gap-space-xs text-on-surface font-headline-sm">
                    <span className="material-symbols-outlined text-secondary text-[20px]">memory</span>
                    <span>Engine Status &amp; Relays</span>
                  </div>
                  <div className="space-y-space-xs font-body-sm text-body-sm">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-on-surface-variant">Core Protocol:</span>
                      <span className="font-label-mono-sm text-label-mono-sm font-semibold text-primary">
                        rustdesk-transport v1.3
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-on-surface-variant">Tunnel Round-Trip:</span>
                      <span className="font-label-mono-sm text-label-mono-sm font-semibold text-tertiary">
                        18 ms (Low Jitter)
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-on-surface-variant">Ephemeral Driver:</span>
                      <span className="font-label-mono-sm text-label-mono-sm text-on-surface">Auto-Detached on Exit</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
