"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertCircle, Filter, X, Trash2 } from "lucide-react";
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

  const handleClear = async () => {
    if (!confirm("Are you sure you want to clear all webhook audit logs?")) return;
    setClearing(true);
    try {
      await fetch("/api/logs", { method: "DELETE" });
      await onClearLogs();
    } finally {
      setClearing(false);
    }
  };

  const filteredLogs = selectedMediaFilter
    ? logs.filter((log) => log.mediaId === selectedMediaFilter)
    : logs;

  return (
    <div className="bg-white rounded border border-[#DADDE1] overflow-hidden shadow-xs">
      {/* Logs Header with Filter & Clear Button */}
      <div className="px-5 py-3.5 border-b border-[#DADDE1] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#FAFBFC]">
        <div>
          <h3 className="text-[14px] font-bold text-[#1C1E21]">
            Webhook Delivery Audit Trail
          </h3>
          <p className="text-[12px] text-[#65676B]">
            Showing {filteredLogs.length} of {logs.length} total events
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Reel Selector Filter */}
          <Filter className="h-3.5 w-3.5 text-[#65676B]" />
          <select
            value={selectedMediaFilter}
            onChange={(e) => onSelectMediaFilter(e.target.value)}
            className="px-3 py-1 rounded bg-[#F0F2F5] border border-[#CCD0D5] text-[12px] font-medium text-[#1C1E21] focus:outline-none focus:border-[#0866FF] transition cursor-pointer"
          >
            <option value="">All Reels & Media (No Filter)</option>
            {Object.values(rulesMap).map((rule) => (
              <option key={rule.mediaId} value={rule.mediaId}>
                Reel: {rule.caption ? rule.caption.slice(0, 35) + "..." : rule.mediaId}
              </option>
            ))}
          </select>

          {selectedMediaFilter && (
            <button
              onClick={() => onSelectMediaFilter("")}
              title="Clear filter"
              className="p-1 rounded text-[#65676B] hover:bg-[#E4E6EB] hover:text-[#1C1E21] transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Clear Logs Button */}
          {logs.length > 0 && (
            <button
              onClick={handleClear}
              disabled={clearing}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white hover:bg-[#FDECEA] text-[#D93025] border border-[#CCD0D5] hover:border-[#D93025] text-[12px] font-semibold transition cursor-pointer disabled:opacity-50 ml-2"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {clearing ? "Clearing..." : "Clear Logs"}
            </button>
          )}
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className="p-12 text-center text-[13px] text-[#65676B]">
          No webhook event logs recorded.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#DADDE1] bg-[#F7F8FA] text-[11px] font-bold uppercase tracking-wider text-[#65676B]">
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Sender</th>
                <th className="py-2.5 px-3">Comment Payload</th>
                <th className="py-2.5 px-3">Matched Keyword</th>
                <th className="py-2.5 px-3">Dispatched Reply</th>
                <th className="py-2.5 px-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEDF0] text-[12px]">
              {filteredLogs.map((log) => (
                <tr key={log._id} className="hover:bg-[#F7F8FA] transition-colors">
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {log.status === "sent" ? (
                      <span className="inline-flex items-center gap-1 text-[#2B8A3E] font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" /> 200 OK
                      </span>
                    ) : (
                      <span
                        title={log.errorMessage}
                        className="inline-flex items-center gap-1 text-[#E41E3F] font-semibold"
                      >
                        <AlertCircle className="h-3.5 w-3.5" /> Failed
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-[#1C1E21]">
                    @{log.username}
                  </td>
                  <td className="py-2.5 px-3 text-[#1C1E21] max-w-[200px] truncate">
                    &ldquo;{log.commentText}&rdquo;
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      style={{ fontFamily: "var(--font-mono)" }}
                      className="px-1.5 py-0.5 rounded text-[11px] bg-[#E7F3FF] text-[#0866FF]"
                    >
                      {log.matchedKeyword}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-[#65676B] max-w-[220px] truncate">
                    {log.replySent}
                  </td>
                  <td
                    style={{ fontFamily: "var(--font-mono)" }}
                    className="py-2.5 px-3 text-[11px] text-[#65676B] whitespace-nowrap"
                  >
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}