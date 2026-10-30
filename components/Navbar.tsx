"use client";

import React from "react";
import { RefreshCw, Film, Activity, ShieldCheck, Terminal, Layers } from "lucide-react";

interface NavbarProps {
  loading: boolean;
  onSync: () => void;
  activeTab: "reels" | "logs";
  setActiveTab: (tab: "reels" | "logs") => void;
  logsCount: number;
  activeReelsCount: number;
}

export default function Navbar({
  loading,
  onSync,
  activeTab,
  setActiveTab,
  logsCount,
  activeReelsCount,
}: NavbarProps) {
  return (
    <>
      {/* Left Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 w-[240px] bg-[#1C2B33] text-white flex flex-col justify-between border-r border-[#2B3E49] select-none">
        <div>
          {/* Brand */}
          <div className="h-14 px-4 flex items-center gap-2.5 border-b border-white/10">
            
            <span className="text-[14px] font-bold tracking-tight">The Squirrel Ops Console</span>
          </div>

          {/* Nav Items */}
          <div className="px-3 py-4 space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9BA8] px-3 mb-2">
              Products
            </div>

            <button
              onClick={() => setActiveTab("reels")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-semibold transition ${
                activeTab === "reels"
                  ? "bg-[#0866FF] text-white"
                  : "text-[#CFD8DC] hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <Film className="h-4 w-4" /> Reel Triggers
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20">
                {activeReelsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("logs")}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-[13px] font-semibold transition ${
                activeTab === "logs"
                  ? "bg-[#0866FF] text-white"
                  : "text-[#CFD8DC] hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4" /> Webhook Logs
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20">
                {logsCount}
              </span>
            </button>
          </div>

          {/* System Specs */}
          <div className="px-3 py-2 space-y-1 border-t border-white/10 pt-3">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A9BA8] px-3 mb-1">
              API Status
            </div>
            <div className="px-3 py-1.5 text-[12px] text-[#A0B0BC] flex items-center justify-between">
              <span>Graph Version</span>
              <span style={{ fontFamily: "var(--font-mono)" }} className="text-white text-[11px]">v25.0</span>
            </div>
            <div className="px-3 py-1.5 text-[12px] text-[#A0B0BC] flex items-center justify-between">
              <span>Subscribed Edge</span>
              <span style={{ fontFamily: "var(--font-mono)" }} className="text-white text-[11px]">comments</span>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-white/10 text-[11px] text-[#8A9BA8] text-center">
          IG Graph API v25.0
        </div>
      </aside>

      {/* Top Utility Header */}
      <header className="sticky top-0 z-30 ml-[240px] h-14 bg-white border-b border-[#DADDE1] px-6 flex items-center justify-between">
        <div className="text-[13px] font-semibold text-[#1C1E21]">
          {activeTab === "reels" ? "Instagram Media & Trigger Mapping" : "Webhook Event Log"}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F0F2F5] border border-[#DADDE1] text-[12px] font-semibold text-[#1C1E21]">
            <span className="h-2 w-2 rounded-full bg-[#31A24C]" />
            App Mode: Live
          </div>

          <button
            onClick={onSync}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0866FF] hover:bg-[#075CE5] text-white text-[12px] font-semibold transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            Sync Media
          </button>
        </div>
      </header>
    </>
  );
}
