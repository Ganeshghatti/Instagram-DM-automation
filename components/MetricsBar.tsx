"use client";

import React from "react";
import { Search } from "lucide-react";

interface MetricsBarProps {
  totalReels: number;
  activeReelsCount: number;
  totalDmsSent: number;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  filterStatus: "all" | "active" | "unconfigured";
  onFilterChange: (val: "all" | "active" | "unconfigured") => void;
  showFilters: boolean;
}

export default function MetricsBar({
  totalReels,
  activeReelsCount,
  totalDmsSent,
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  showFilters,
}: MetricsBarProps) {
  return (
    <div className="space-y-4 mb-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded border border-[#DADDE1] p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#65676B]">Total Media</div>
          <div className="text-[22px] font-bold text-[#1C1E21] mt-1">{totalReels}</div>
        </div>
        <div className="bg-white rounded border border-[#DADDE1] p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#65676B]">Active Rules</div>
          <div className="text-[22px] font-bold text-[#31A24C] mt-1">{activeReelsCount}</div>
        </div>
        <div className="bg-white rounded border border-[#DADDE1] p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#65676B]">DMs Dispatched</div>
          <div className="text-[22px] font-bold text-[#0866FF] mt-1">{totalDmsSent}</div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      {showFilters && (
        <div className="bg-white rounded border border-[#DADDE1] p-2.5 px-3 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm flex items-center">
            <Search className="absolute left-2.5 h-3.5 w-3.5 text-[#65676B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search caption or keyword..."
              className="w-full pl-8 pr-3 py-1 rounded bg-[#F0F2F5] border border-transparent focus:bg-white focus:border-[#0866FF] focus:outline-none text-[12px]"
            />
          </div>

          <div className="flex items-center gap-1">
            {(["all", "active", "unconfigured"] as const).map((status) => (
              <button
                key={status}
                onClick={() => onFilterChange(status)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize transition cursor-pointer ${
                  filterStatus === status
                    ? "bg-[#E7F3FF] text-[#0866FF]"
                    : "text-[#65676B] hover:bg-[#F0F2F5]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
