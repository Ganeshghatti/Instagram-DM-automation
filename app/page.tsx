"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { IgMedia, ReelRule, LogItem } from "@/types/dashboard";
import Navbar from "@/components/Navbar";
import MetricsBar from "@/components/MetricsBar";
import ReelCard from "@/components/ReelCard";
import LogsTable from "@/components/LogsTable";
import TriggerModal from "@/components/TriggerModal";

export default function DashboardPage() {
  const [reels, setReels] = useState<IgMedia[]>([]);
  const [rulesMap, setRulesMap] = useState<Record<string, ReelRule>>({});
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"reels" | "logs">("reels");
  const [selectedReel, setSelectedReel] = useState<IgMedia | null>(null);

  const [selectedMediaFilter, setSelectedMediaFilter] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "unconfigured">("all");

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [reelsRes, rulesRes, logsRes] = await Promise.all([
        fetch("/api/reels"),
        fetch("/api/rules"),
        fetch("/api/logs"),
      ]);

      const [reelsData, rulesData, logsData] = await Promise.all([
        reelsRes.json(),
        rulesRes.json(),
        logsRes.json(),
      ]);

      if (reelsData.reels) setReels(reelsData.reels);
      if (logsData.logs) setLogs(logsData.logs);

      if (rulesData.rules) {
        const map: Record<string, ReelRule> = {};
        rulesData.rules.forEach((r: ReelRule) => {
          map[r.mediaId] = r;
        });
        setRulesMap(map);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const activeReelsCount = Object.values(rulesMap).filter((r) => r.isActive && r.triggers?.length > 0).length;
  const totalDmsSent = logs.filter((l) => l.status === "sent").length;

  const filteredReels = useMemo(() => {
    return reels.filter((reel) => {
      const rule = rulesMap[reel.id];
      const hasTriggers = Boolean(rule && rule.triggers?.length > 0);

      if (filterStatus === "active" && !hasTriggers) return false;
      if (filterStatus === "unconfigured" && hasTriggers) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (reel.caption || "").toLowerCase().includes(q) ||
        reel.id.toLowerCase().includes(q) ||
        rule?.triggers?.some((t) => t.keyword.toLowerCase().includes(q))
      );
    });
  }, [reels, rulesMap, filterStatus, searchQuery]);

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-[#1C1E21]">
      <Navbar
        loading={loading}
        onSync={fetchAllData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        logsCount={logs.length}
        activeReelsCount={activeReelsCount}
      />

      <main className="ml-[240px] p-6 max-w-[1300px]">
        <MetricsBar
          totalReels={reels.length}
          activeReelsCount={activeReelsCount}
          totalDmsSent={totalDmsSent}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
          showFilters={activeTab === "reels"}
        />

        {activeTab === "reels" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredReels.map((reel) => (
              <ReelCard
                key={reel.id}
                reel={reel}
                rule={rulesMap[reel.id]}
                onConfigure={(r) => setSelectedReel(r)}
              />
            ))}
          </div>
        ) : (
          <LogsTable
            logs={logs}
            rulesMap={rulesMap}
            selectedMediaFilter={selectedMediaFilter}
            onSelectMediaFilter={setSelectedMediaFilter}
            onClearLogs={fetchAllData}
          />
        )}
      </main>

      <TriggerModal
        reel={selectedReel}
        existingRule={selectedReel ? rulesMap[selectedReel.id] : undefined}
        onClose={() => setSelectedReel(null)}
        onSaved={fetchAllData}
      />
    </div>
  );
}
