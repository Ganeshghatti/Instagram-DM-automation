"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Filter,
  X,
  Trash2,
  Download,
  ExternalLink,
  MessageCircle,
  Link as LinkIcon,
  ChevronDown,
  Check,
  AlertTriangle,
} from "lucide-react";
import { LogItem, ReelRule } from "@/types/dashboard";

interface LogsTableProps {
  logs: LogItem[];
  rulesMap: Record<string, ReelRule>;
  selectedMediaFilter: string;
  onSelectMediaFilter: (mediaId: string) => void;
  onClearLogs: () => Promise<void>;
}

export default function LogsTable({
  logs,
  rulesMap,
  selectedMediaFilter,
  onSelectMediaFilter,
  onClearLogs,
}: LogsTableProps) {
  const [clearing, setClearing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "failed">("all");

  // Custom Reel dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Custom Clear Confirmation popover state
  const [clearPopoverOpen, setClearPopoverOpen] = useState(false);
  const clearPopoverRef = useRef<HTMLDivElement>(null);

  // Close popovers on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (clearPopoverRef.current && !clearPopoverRef.current.contains(event.target as Node)) {
        setClearPopoverOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConfirmClear = async () => {
    setClearing(true);
    try {
      await fetch("/api/logs", { method: "DELETE" });
      await onClearLogs();
      setClearPopoverOpen(false);
    } finally {
      setClearing(false);
    }
  };

  const handleDownloadCsv = () => {
    const url = selectedMediaFilter
      ? `/api/logs/export?mediaId=${selectedMediaFilter}`
      : "/api/logs/export";
    window.open(url, "_blank");
  };

  const filteredLogs = logs.filter((log) => {
    const matchesMedia = !selectedMediaFilter || log.mediaId === selectedMediaFilter;
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesMedia && matchesStatus;
  });

  const selectedRule = rulesMap[selectedMediaFilter];
  const activeLabel = selectedRule
    ? selectedRule.caption
      ? selectedRule.caption.slice(0, 22) + "..."
      : selectedRule.mediaId
    : "All Reels";

  return (
    <div className="bg-white rounded border border-[#DADDE1] overflow-hidden shadow-xs">
      {/* Table Toolbar */}
      <div className="px-5 py-3.5 border-b border-[#DADDE1] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#FAFBFC]">
        <div>
          <h3 className="text-[14px] font-bold text-[#1C1E21] flex items-center gap-2">
            Webhook Delivery Audit Trail
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#E7F3FF] text-[#0866FF]">
              {filteredLogs.length} events
            </span>
          </h3>

        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Segment Filter */}
          <div className="flex items-center bg-[#F0F2F5] p-0.5 rounded border border-[#CCD0D5]">
            {(["all", "sent", "failed"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-0.5 text-[11px] font-semibold capitalize rounded transition cursor-pointer ${statusFilter === st
                  ? "bg-white text-[#1C1E21] shadow-2xs"
                  : "text-[#65676B] hover:text-[#1C1E21]"
                  }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Custom Meta-Styled Reel Filter Dropdown */}
          <div className="relative flex items-center" ref={dropdownRef}>
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-[#65676B]" />
              <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                className="inline-flex items-center justify-between gap-2 px-3 py-1 rounded bg-white hover:bg-[#F2F4F7] border border-[#CCD0D5] text-[12px] font-semibold text-[#1C1E21] transition cursor-pointer min-w-[130px] shadow-2xs"
              >
                <span className="truncate max-w-[150px]">{activeLabel}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-[#65676B] transition-transform duration-150 shrink-0 ${dropdownOpen ? "rotate-180" : ""
                    }`}
                />
              </button>
            </div>

            {selectedMediaFilter && (
              <button
                onClick={() => onSelectMediaFilter("")}
                title="Clear filter"
                className="ml-1 p-1 rounded text-[#65676B] hover:bg-[#E4E6EB] hover:text-[#1C1E21] transition cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Custom Popover Menu for Reels */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-[#DADDE1] rounded-sm shadow-xl py-1 z-50 max-h-64 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#65676B] border-b border-[#EBEDF0]">
                  Filter by Reel
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectMediaFilter("");
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-[12px] font-medium transition flex items-center justify-between cursor-pointer ${!selectedMediaFilter
                    ? "bg-[#E7F3FF] text-[#0866FF] font-semibold"
                    : "text-[#1C1E21] hover:bg-[#F2F4F7]"
                    }`}
                >
                  <span>All Reels</span>
                  {!selectedMediaFilter && <Check className="h-3.5 w-3.5 text-[#0866FF]" />}
                </button>

                {Object.values(rulesMap).map((rule) => {
                  const isSelected = selectedMediaFilter === rule.mediaId;
                  const label = rule.caption
                    ? rule.caption.slice(0, 32) + (rule.caption.length > 32 ? "..." : "")
                    : rule.mediaId;

                  return (
                    <button
                      key={rule.mediaId}
                      type="button"
                      onClick={() => {
                        onSelectMediaFilter(rule.mediaId);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[12px] font-medium transition flex items-center justify-between cursor-pointer border-t border-[#F2F4F7] ${isSelected
                        ? "bg-[#E7F3FF] text-[#0866FF] font-semibold"
                        : "text-[#1C1E21] hover:bg-[#F2F4F7]"
                        }`}
                    >
                      <span className="truncate pr-2" title={rule.caption || rule.mediaId}>
                        {label}
                      </span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-[#0866FF] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* CSV Export Button */}
          <button
            onClick={handleDownloadCsv}
            disabled={logs.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#1C1E21] border border-[#CCD0D5] text-[12px] font-semibold transition cursor-pointer disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 text-[#65676B]" />
            Export CSV
          </button>

          {/* Custom Clear Confirmation Popover */}
          {logs.length > 0 && (
            <div className="relative" ref={clearPopoverRef}>
              <button
                type="button"
                onClick={() => setClearPopoverOpen((prev) => !prev)}
                disabled={clearing}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white hover:bg-[#FDECEA] text-[#D93025] border border-[#CCD0D5] hover:border-[#D93025] text-[12px] font-semibold transition cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {clearing ? "Clearing..." : "Clear"}
              </button>

              {clearPopoverOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 bg-white border border-[#DADDE1] rounded-lg shadow-xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-start gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-[#FDECEA] flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-4 w-4 text-[#D93025]" />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-[#1C1E21] leading-tight">
                        Clear all logs?
                      </h4>
                      <p className="text-[11px] text-[#65676B] mt-1 leading-normal">
                        This action will permanently delete all {logs.length} webhook audit trail events.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3.5 pt-2.5 border-t border-[#EBEDF0] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setClearPopoverOpen(false)}
                      className="px-2.5 py-1 rounded text-[11px] font-semibold text-[#65676B] hover:bg-[#F0F2F5] transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmClear}
                      disabled={clearing}
                      className="px-3 py-1 rounded text-[11px] font-semibold text-white bg-[#D93025] hover:bg-[#C5221F] shadow-2xs transition cursor-pointer disabled:opacity-50"
                    >
                      {clearing ? "Deleting..." : "Yes, clear"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Table Content */}
      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center text-[13px] text-[#65676B]">
          No matching webhook audit records found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1050px]">
            <thead>
              <tr className="border-b border-[#DADDE1] bg-[#F7F8FA] text-[11px] font-bold uppercase tracking-wider text-[#65676B]">
                <th className="py-2.5 px-3 w-[110px]">Status</th>
                <th className="py-2.5 px-3 w-[150px]">User & Reel</th>
                <th className="py-2.5 px-3 w-[170px]">Inbound Comment</th>
                <th className="py-2.5 px-3 min-w-[220px]">Private DM Sent</th>
                <th className="py-2.5 px-3 w-[180px]">CTA Button Card</th>
                <th className="py-2.5 px-3 w-[200px]">Public Comment Reply</th>
                <th className="py-2.5 px-3 w-[100px]">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEDF0] text-[12px]">
              {filteredLogs.map((log) => {
                let displayDm = log.replySent || "";
                let displayCtaTitle = "";
                let displayCtaUrl = log.ctaUrl || "";
                let displayPublic = log.publicReplySent || "";

                const activeRuleItem = rulesMap[log.mediaId];
                const matchedTrigger = activeRuleItem?.triggers?.find(
                  (t) => t.keyword.toLowerCase() === log.matchedKeyword.toLowerCase()
                );

                if (matchedTrigger?.buttonTitle) {
                  displayCtaTitle = matchedTrigger.buttonTitle;
                }
                if (matchedTrigger?.buttonUrl && !displayCtaUrl) {
                  displayCtaUrl = matchedTrigger.buttonUrl;
                }

                if (displayDm.includes(" [CTA:")) {
                  const ctaMatch = displayDm.match(/\[CTA:\s*(.*?)(?:\s*->\s*(https?:\/\/[^\s\]]+))?\]/);
                  if (ctaMatch) {
                    if (!displayCtaTitle) displayCtaTitle = ctaMatch[1] || "";
                    if (ctaMatch[2] && !displayCtaUrl) displayCtaUrl = ctaMatch[2];
                  }
                }

                if (!displayCtaTitle && displayCtaUrl && !displayCtaUrl.startsWith("http")) {
                  displayCtaTitle = displayCtaUrl;
                  displayCtaUrl = matchedTrigger?.buttonUrl || "";
                }

                if (displayCtaUrl && !displayCtaTitle) {
                  displayCtaTitle = "View Link";
                }

                if (displayDm.includes(" | Public:") && !displayPublic) {
                  const publicMatch = displayDm.match(/\|\s*Public:\s*"(.*?)"/);
                  if (publicMatch) displayPublic = publicMatch[1];
                }

                if (displayDm) {
                  displayDm = displayDm
                    .replace(/\s*\[CTA:.*?\]/g, "")
                    .replace(/\s*\|\s*Public:.*$/g, "")
                    .trim();
                }

                const isValidLink =
                  Boolean(displayCtaUrl) &&
                  (displayCtaUrl.startsWith("http://") || displayCtaUrl.startsWith("https://"));

                return (
                  <tr key={log._id} className="hover:bg-[#F7F8FA] transition-colors">
                    {/* 1. Status */}
                    <td className="py-3 px-3 whitespace-nowrap align-top">
                      {log.status === "sent" ? (
                        <span className="inline-flex items-center gap-1 text-[#2B8A3E] font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> 200 OK
                        </span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="inline-flex items-center gap-1 text-[#E41E3F] font-semibold">
                            <AlertCircle className="h-3.5 w-3.5" /> Failed
                          </span>
                          {log.errorMessage && (
                            <span
                              className="text-[10px] text-[#E41E3F] max-w-[110px] truncate"
                              title={log.errorMessage}
                            >
                              {log.errorMessage}
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* 2. User & Reel */}
                    <td className="py-3 px-3 align-top whitespace-nowrap">
                      <div className="font-semibold text-[#1C1E21]">@{log.username}</div>
                      <a
                        href={log.mediaPermalink || `https://www.instagram.com/p/${log.mediaId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-[#0866FF] hover:underline mt-0.5"
                      >
                        View Reel <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </td>

                    {/* 3. Inbound Comment */}
                    <td className="py-3 px-3 align-top">
                      <div
                        className="text-[#1C1E21] font-medium line-clamp-2 leading-snug"
                        title={log.commentText}
                      >
                        &ldquo;{log.commentText}&rdquo;
                      </div>
                      <span
                        style={{ fontFamily: "var(--font-mono)" }}
                        className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] bg-[#E7F3FF] text-[#0866FF] border border-[#0866FF]/15"
                      >
                        {log.matchedKeyword}
                      </span>
                    </td>

                    {/* 4. DM Text */}
                    <td className="py-3 px-3 align-top">
                      <div
                        className="text-[#1C1E21] line-clamp-3 leading-relaxed whitespace-pre-wrap"
                        title={displayDm}
                      >
                        {displayDm}
                      </div>
                    </td>

                    {/* 5. CTA Button Card */}
                    <td className="py-3 px-3 align-top">
                      {displayCtaTitle || isValidLink ? (
                        <div className="space-y-1">
                          {isValidLink ? (
                            <a
                              href={displayCtaUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-[#E7F3FF] text-[#0866FF] border border-[#0866FF]/20 hover:bg-[#D0E7FF] transition"
                              title={displayCtaUrl}
                            >
                              <LinkIcon className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[120px]">
                                {displayCtaTitle || "View Link"}
                              </span>
                              <ExternalLink className="h-2.5 w-2.5 opacity-70 shrink-0" />
                            </a>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#F0F2F5] text-[#1C1E21] border border-[#CCD0D5]">
                              <LinkIcon className="h-3 w-3 text-[#0866FF]" />
                              {displayCtaTitle || "View Link"}
                            </span>
                          )}

                          {isValidLink && (
                            <div
                              className="text-[10px] text-[#65676B] truncate max-w-[170px]"
                              title={displayCtaUrl}
                            >
                              {displayCtaUrl}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#8A8D91] italic">Plain text DM</span>
                      )}
                    </td>

                    {/* 6. Public Reply */}
                    <td className="py-3 px-3 align-top">
                      {displayPublic ? (
                        <div className="flex items-start gap-1.5">
                          <MessageCircle className="h-3.5 w-3.5 text-[#31A24C] shrink-0 mt-0.5" />
                          <span
                            className="text-[11px] text-[#1C1E21] line-clamp-3 leading-snug"
                            title={displayPublic}
                          >
                            {displayPublic}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#8A8D91] italic">None configured</span>
                      )}
                    </td>

                    {/* 7. Timestamp */}
                    <td
                      style={{ fontFamily: "var(--font-mono)" }}
                      className="py-3 px-3 text-[11px] text-[#65676B] whitespace-nowrap align-top"
                    >
                      <div>
                        {new Date(log.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      <div className="text-[10px] text-[#8A8D91]">
                        {new Date(log.createdAt).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}