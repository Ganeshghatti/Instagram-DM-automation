"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  X,
  Check,
  Link as LinkIcon,
  Shuffle,
  Sparkles,
  Smartphone,
  MessageCircle,
  Phone,
  Video,
  ChevronLeft,
  Heart,
  Camera,
  Mic,
  Wifi,
  Battery,
  Signal,
  RefreshCw,
  BadgeCheck,
} from "lucide-react";
import { IgMedia, ReelRule, Trigger } from "@/types/dashboard";

interface TriggerModalProps {
  reel: IgMedia | null;
  existingRule?: ReelRule;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export default function TriggerModal({
  reel,
  existingRule,
  onClose,
  onSaved,
}: TriggerModalProps) {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTriggerIdx, setSelectedTriggerIdx] = useState(0);
  const [previewTab, setPreviewTab] = useState<"dm" | "comment">("dm");
  const [variationIdx, setVariationIdx] = useState(0);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!reel) return;
    if (existingRule && existingRule.triggers && existingRule.triggers.length > 0) {
      setTriggers(
        existingRule.triggers.map((t) => ({
          keyword: t.keyword || "",
          replyMessage: t.replyMessage || "",
          buttonTitle: t.buttonTitle || "",
          buttonUrl: t.buttonUrl || "",
          publicReplyMessages: Array.isArray(t.publicReplyMessages)
            ? t.publicReplyMessages
            : [],
        }))
      );
      setIsActive(existingRule.isActive);
    } else {
      setTriggers([
        {
          keyword: "guide",
          replyMessage: "I have a long list of guide for you to know more!",
          buttonTitle: "View Guide",
          buttonUrl: "https://thesquirrel.tech/guide",
          publicReplyMessages: [
            "{@username} Sent to your DMs! Check message requests 📥",
            "Hey {@username}, just dropped the link in your inbox! 🚀",
          ],
        },
      ]);
      setIsActive(true);
    }
  }, [reel, existingRule]);

  if (!reel) return null;

  const updateTrigger = (index: number, field: keyof Trigger, value: any) => {
    const updated = [...triggers];
    updated[index] = { ...updated[index], [field]: value };
    setTriggers(updated);
  };

  const insertToken = (
    index: number,
    field: "replyMessage" | "publicReplyMessages",
    token: string
  ) => {
    if (field === "replyMessage") {
      const current = triggers[index].replyMessage || "";
      updateTrigger(index, "replyMessage", current ? `${current} ${token}` : token);
    } else {
      const currentArr = triggers[index].publicReplyMessages || [];
      if (currentArr.length === 0) {
        updateTrigger(index, "publicReplyMessages", [`${token} Check your DMs! 📥`]);
      } else {
        const lastIdx = currentArr.length - 1;
        const updatedArr = [...currentArr];
        updatedArr[lastIdx] = `${updatedArr[lastIdx]} ${token}`;
        updateTrigger(index, "publicReplyMessages", updatedArr);
      }
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId: reel.id,
          caption: reel.caption || "Untitled Reel",
          mediaType: reel.media_type,
          permalink: reel.permalink,
          thumbnailUrl: reel.thumbnail_url || reel.media_url || "",
          isActive,
          triggers,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save rules");

      await onSaved();
      onClose();
    } catch (err: any) {
      alert(`Error saving rules: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAll = async () => {
    await fetch(`/api/rules?mediaId=${reel.id}`, { method: "DELETE" });
    await onSaved();
    onClose();
  };

  const activeTrigger = triggers[selectedTriggerIdx] || triggers[0] || {
    keyword: "guide",
    replyMessage: "I have a long list of guide for you to know more!",
    buttonTitle: "View Guide",
    buttonUrl: "",
    publicReplyMessages: [],
  };

  const previewUsername = "itzhakuji";
  const reelThumb = reel.thumbnail_url || reel.media_url || "";

  const renderTokens = (str: string) => {
    if (!str) return "";
    return str
      .replace(/\{@username\}/gi, `@${previewUsername}`)
      .replace(/\{username\}/gi, previewUsername)
      .replace(/\{keyword\}/gi, activeTrigger.keyword || "guide");
  };

  // Highlight @mentions in Instagram link-blue (#0095F6)
  const renderFormattedComment = (text: string) => {
    const resolved = renderTokens(text);
    const parts = resolved.split(/(@[\w.]+)/g);
    return parts.map((part, i) =>
      part.startsWith("@") ? (
        <span key={i} className="text-[#0095F6] font-medium">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const previewDmText = renderTokens(
    activeTrigger.replyMessage || "I have a long list of guide for you to know more!"
  );

  const hasValidCta = Boolean(
    activeTrigger.buttonTitle?.trim() && activeTrigger.buttonUrl?.trim()
  );

  const validVariations = (activeTrigger.publicReplyMessages || []).filter(
    (v) => v.trim().length > 0
  );
  const currentPublicReply =
    validVariations.length > 0
      ? validVariations[variationIdx % validVariations.length]
      : `{@username} Sent to your DMs! Check message requests 📥`;

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A]/60 backdrop-blur-[2px] flex justify-end animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-[980px] h-full flex flex-col shadow-2xl border-l border-[#DADDE1]">
        {/* Top Modal Header */}
        <div className="px-6 py-3 border-b border-[#DADDE1] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-sm bg-[#E7F3FF] border border-[#0866FF]/20 flex items-center justify-center text-[#0866FF] font-bold">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[14px] font-bold text-[#1C1E21]">
                  Automation Rule Studio
                </h2>
                <span
                  style={{ fontFamily: "var(--font-mono)" }}
                  className="text-[11px] px-2 py-0.5 rounded-sm bg-[#F0F2F5] text-[#65676B] border border-[#DADDE1]"
                >
                  ID: {reel.id}
                </span>
              </div>
              <p className="text-[11px] text-[#65676B] truncate max-w-[420px]">
                {reel.caption || "Untitled Instagram Reel"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 px-3 py-1 rounded-sm bg-[#F7F8FA] border border-[#DADDE1] cursor-pointer select-none">
              <span
                className={`h-2 w-2 rounded-full ${isActive ? "bg-[#31A24C]" : "bg-[#8A8D91]"
                  }`}
              />
              <span className="text-[11px] font-bold text-[#1C1E21]">
                {isActive ? "Listener Active" : "Listener Paused"}
              </span>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="sr-only"
              />
            </label>

            <button
              onClick={onClose}
              className="p-1 rounded-sm text-[#65676B] hover:bg-[#F0F2F5] hover:text-[#1C1E21] transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main 2-Column Workspace */}
        <div className="flex-1 flex overflow-hidden">
          {/* LEFT PANEL: Rule Editor (Meta Developer Sharp Inputs) */}
          <div className="w-[52%] border-r border-[#DADDE1] flex flex-col bg-[#F7F8FA]">
            <div className="px-5 py-2.5 bg-white border-b border-[#EBEDF0] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                {triggers.map((t, idx) => {
                  const active = selectedTriggerIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedTriggerIdx(idx)}
                      className={`px-3 py-1 rounded-sm text-[12px] font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0 ${active
                        ? "bg-[#0866FF] text-white shadow-2xs"
                        : "bg-[#F0F2F5] text-[#65676B] hover:bg-[#E4E6EB] hover:text-[#1C1E21]"
                        }`}
                    >
                      <span style={{ fontFamily: "var(--font-mono)" }}>
                        {t.keyword ? `#${t.keyword}` : `Rule ${idx + 1}`}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextIdx = triggers.length;
                  setTriggers([
                    ...triggers,
                    {
                      keyword: "",
                      replyMessage: "I have a long list of guide for you to know more!",
                      buttonTitle: "View Guide",
                      buttonUrl: "",
                      publicReplyMessages: [
                        "{@username} Sent to your DMs! Check message requests 📥",
                      ],
                    },
                  ]);
                  setSelectedTriggerIdx(nextIdx);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-[#E7F3FF] text-[#0866FF] hover:bg-[#D0E7FF] text-[11px] font-bold transition cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5" /> Add Keyword
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-3.5">
              {triggers.map((item, idx) => {
                if (idx !== selectedTriggerIdx) return null;
                const charCount = (item.replyMessage || "").length;
                const isCtaEnabled = Boolean(item.buttonUrl?.trim());

                return (
                  <div key={idx} className="space-y-3.5">
                    {/* Card 1: Keyword */}
                    <div className="bg-white p-3.5 rounded-sm border border-[#DADDE1] shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#65676B]">
                          1. When someone comments keyword
                        </label>
                        {triggers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = triggers.filter((_, i) => i !== idx);
                              setTriggers(next);
                              setSelectedTriggerIdx(Math.max(0, idx - 1));
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#D93025] hover:underline cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" /> Remove Rule
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        style={{ fontFamily: "var(--font-mono)" }}
                        placeholder="e.g. guide, link"
                        value={item.keyword}
                        onChange={(e) => updateTrigger(idx, "keyword", e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-sm bg-[#F7F8FA] border border-[#CCD0D5] text-[12px] font-semibold text-[#1C1E21] focus:bg-white focus:outline-none focus:border-[#0866FF] transition"
                      />
                    </div>

                    {/* Card 2: DM & CTA */}
                    <div className="bg-white p-3.5 rounded-sm border border-[#DADDE1] shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#65676B]">
                          2. Send Private Instagram DM
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            insertToken(idx, "replyMessage", "{username}");
                            setPreviewTab("dm");
                          }}
                          className="px-2 py-0.5 rounded-sm bg-[#E7F3FF] text-[#0866FF] text-[10px] font-mono font-semibold hover:bg-[#D0E7FF] transition cursor-pointer"
                        >
                          +{"{username}"}
                        </button>
                      </div>

                      <div>
                        <textarea
                          rows={2}
                          placeholder="I have a long list of guide for you to know more!"
                          value={item.replyMessage}
                          onFocus={() => setPreviewTab("dm")}
                          onChange={(e) =>
                            updateTrigger(idx, "replyMessage", e.target.value)
                          }
                          className="w-full px-2.5 py-1.5 rounded-sm bg-[#F7F8FA] border border-[#CCD0D5] text-[12px] text-[#1C1E21] focus:bg-white focus:outline-none focus:border-[#0866FF] leading-relaxed resize-none transition"
                        />
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-[#8A8D91]">
                            {isCtaEnabled ? "Renders as Meta generic template card" : "Plain text DM"}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-semibold ${isCtaEnabled && charCount > 80
                              ? "text-[#D93025]"
                              : "text-[#8A8D91]"
                              }`}
                          >
                            {charCount}
                            {isCtaEnabled ? "/80 chars" : " chars"}
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-sm bg-[#F7F8FA] border border-[#EBEDF0] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[11px] font-bold text-[#1C1E21]">
                            <LinkIcon className="h-3.5 w-3.5 text-[#0866FF]" />
                            Attach CTA Link Button
                          </span>
                          <span className="text-[10px] text-[#65676B]">Optional</span>
                        </div>

                        <div className="grid grid-cols-12 gap-2">
                          <div className="col-span-5">
                            <input
                              type="text"
                              maxLength={20}
                              placeholder="Button Title"
                              value={item.buttonTitle || ""}
                              onFocus={() => setPreviewTab("dm")}
                              onChange={(e) =>
                                updateTrigger(idx, "buttonTitle", e.target.value)
                              }
                              className="w-full px-2 py-1 rounded-sm bg-white border border-[#CCD0D5] text-[11px] focus:outline-none focus:border-[#0866FF]"
                            />
                          </div>
                          <div className="col-span-7">
                            <input
                              type="url"
                              placeholder="https://thesquirrel.tech/..."
                              value={item.buttonUrl || ""}
                              onFocus={() => setPreviewTab("dm")}
                              onChange={(e) =>
                                updateTrigger(idx, "buttonUrl", e.target.value)
                              }
                              className="w-full px-2 py-1 rounded-sm bg-white border border-[#CCD0D5] text-[11px] focus:outline-none focus:border-[#0866FF]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card 3: Public Replies */}
                    <div className="bg-white p-3.5 rounded-sm border border-[#DADDE1] shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#65676B]">
                          <Shuffle className="h-3.5 w-3.5 text-[#31A24C]" />
                          3. Public Comment Reply Variations
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            insertToken(idx, "publicReplyMessages", "{@username}");
                            setPreviewTab("comment");
                          }}
                          className="px-2 py-0.5 rounded-sm bg-[#EAF6ED] text-[#2B8A3E] text-[10px] font-mono font-semibold hover:bg-[#D3EED9] transition cursor-pointer"
                        >
                          +{"{@username}"}
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        placeholder={
                          "{@username} Sent to your DMs! Check message requests 📥\nHey {@username}, just dropped it in your inbox! 🚀"
                        }
                        value={(item.publicReplyMessages || []).join("\n")}
                        onFocus={() => setPreviewTab("comment")}
                        onChange={(e) => {
                          const lines = e.target.value.split("\n");
                          updateTrigger(idx, "publicReplyMessages", lines);
                        }}
                        className="w-full px-2.5 py-1.5 rounded-sm bg-[#F7F8FA] border border-[#CCD0D5] text-[11px] font-mono text-[#1C1E21] focus:bg-white focus:outline-none focus:border-[#0866FF] leading-relaxed resize-none transition"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT PANEL: Slimmed, Centered iPhone Mockup */}
          <div className="w-[48%] bg-[#F0F2F5] flex flex-col items-center justify-between p-4 select-none overflow-hidden">
            <div className="w-full flex items-center justify-between shrink-0 mb-2">
              <div className="flex items-center bg-white p-0.5 rounded-sm border border-[#DADDE1] shadow-2xs">
                <button
                  type="button"
                  onClick={() => setPreviewTab("dm")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold transition cursor-pointer ${previewTab === "dm"
                    ? "bg-[#1C1E21] text-white"
                    : "text-[#65676B] hover:text-[#1C1E21]"
                    }`}
                >
                  <Smartphone className="h-3 w-3" /> Direct Message
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("comment")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] font-bold transition cursor-pointer ${previewTab === "comment"
                    ? "bg-[#1C1E21] text-white"
                    : "text-[#65676B] hover:text-[#1C1E21]"
                    }`}
                >
                  <MessageCircle className="h-3 w-3" /> Comment Thread
                </button>
              </div>

              {previewTab === "comment" && validVariations.length > 1 && (
                <button
                  type="button"
                  onClick={() => setVariationIdx((prev) => prev + 1)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-white border border-[#DADDE1] text-[11px] font-semibold text-[#1C1E21] hover:bg-[#F7F8FA] shadow-2xs transition cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3 text-[#31A24C]" />
                  Variant #{(variationIdx % validVariations.length) + 1}/
                  {validVariations.length}
                </button>
              )}
            </div>

            {/* Slimmed iPhone 16 Pro Frame */}
            <div className="my-auto">
              <div className="w-[250px] h-[520px] bg-[#1C1C1E] rounded-[42px] p-[6px] shadow-[0_15px_35px_rgba(0,0,0,0.2)] border-[2px] border-[#3A3A3C] relative flex flex-col">
                <div className="w-full h-full bg-white rounded-[36px] overflow-hidden flex flex-col relative">
                  {/* Centered Notch & Status Bar */}
                  <div className="h-10 px-4 pt-2 grid grid-cols-3 items-center bg-white text-black z-20 shrink-0">
                    <span className="text-[10px] font-bold tracking-tight text-left">9:41</span>
                    <div className="flex justify-center">
                      <div className="h-[16px] w-[56px] bg-black rounded-full flex items-center justify-end pr-1">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#1a1a2e]" />
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-1 text-black">
                      <Signal className="h-2.5 w-2.5 stroke-[2.5]" />
                      <Wifi className="h-2.5 w-2.5 stroke-[2.5]" />
                      <Battery className="h-3 w-3 fill-black" />
                    </div>
                  </div>

                  {previewTab === "dm" ? (
                    <div className="flex-1 flex flex-col justify-between bg-white overflow-hidden">
                      <div className="px-2.5 py-1.5 border-b border-[#DBDBDB]/60 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <ChevronLeft className="h-4 w-4 text-black -ml-1 stroke-[2.2] shrink-0" />
                          <div className="relative shrink-0">
                            <div className="h-5.5 w-5.5 rounded-full bg-gradient-to-tr from-[#FEDA75] via-[#FA7E1E] to-[#D62976] p-[1px]">
                              <div className="h-full w-full rounded-full bg-white p-[0.5px]">
                                {reelThumb ? (
                                  <img
                                    src={reelThumb}
                                    alt=""
                                    className="h-full w-full rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full rounded-full bg-[#1C1E21] text-white text-[7px] font-bold flex items-center justify-center">
                                    TS
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-[#31A24C] ring-1 ring-white" />
                          </div>
                          <div className="leading-tight truncate">
                            <div className="flex items-center gap-0.5">
                              <span className="text-[10.5px] font-bold text-black truncate">
                                thesquirrel
                              </span>
                              <BadgeCheck className="h-3 w-3 text-[#0095F6] fill-[#0095F6] stroke-white shrink-0" />
                            </div>
                            <div className="text-[8px] text-[#8E8E8E]">Active now</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2.5 text-black pr-0.5 shrink-0">
                          <Phone className="h-3 w-3 stroke-[2]" />
                          <Video className="h-3.5 w-3.5 stroke-[2]" />
                        </div>
                      </div>

                      <div className="flex-1 px-2.5 py-2 overflow-y-auto flex flex-col justify-end space-y-2.5">
                        <div className="flex flex-col items-center text-center my-1">
                          <span className="text-[8px] text-[#8E8E8E] mb-1">Today 2:14 PM</span>

                        </div>

                        {/* Bot Outbound Message (Light Mode Template Card) */}
                        <div className="flex items-end gap-1.5">
                          <div className="h-4.5 w-4.5 rounded-full bg-[#1C1E21] overflow-hidden shrink-0 mb-0.5">
                            {reelThumb ? (
                              <img
                                src={reelThumb}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[6px] font-bold text-white">
                                TS
                              </div>
                            )}
                          </div>

                          {hasValidCta ? (
                            <div className="w-[170px] rounded-[14px] bg-[#EFEFEF] text-[#262626] border border-[#DBDBDB] overflow-hidden shadow-2xs">
                              <div className="px-2.5 py-2">
                                <div className="text-[10px] font-medium text-[#262626] leading-snug break-words">
                                  {previewDmText}
                                </div>
                              </div>
                              <div className="px-1.5 pb-1.5">
                                <div className="bg-white hover:bg-[#FAFAFA] py-1.5 px-2 rounded-full text-center border border-[#DBDBDB] transition cursor-pointer shadow-2xs">
                                  <span className="text-[10px] font-bold text-[#262626] truncate block">
                                    {activeTrigger.buttonTitle?.slice(0, 18) || "View Guide"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="max-w-[170px] px-3 py-1.5 rounded-[14px] rounded-bl-[4px] bg-[#EFEFEF] text-[#262626] text-[10px] leading-snug break-words">
                              {previewDmText}
                            </div>
                          )}
                        </div>


                      </div>

                      <div className="px-2 py-1.5 bg-white">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full border border-[#DBDBDB] bg-white">
                          <div className="h-4.5 w-4.5 rounded-full bg-[#0095F6] flex items-center justify-center text-white shrink-0">
                            <Camera className="h-2.5 w-2.5" />
                          </div>
                          <span className="text-[9.5px] text-[#8E8E8E] flex-1">Message...</span>
                          <Mic className="h-3 w-3 text-[#262626]" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col bg-black/85 relative overflow-hidden">
                      <div className="h-16 w-full relative opacity-50">
                        {reelThumb && (
                          <img src={reelThumb} alt="" className="w-full h-full object-cover blur-[1px]" />
                        )}
                      </div>

                      <div className="flex-1 bg-white rounded-t-[16px] flex flex-col justify-between overflow-hidden -mt-3 z-10 shadow-xl">
                        <div>
                          <div className="w-full flex justify-center pt-1.5 pb-1">
                            <div className="h-1 w-8 rounded-full bg-[#DBDBDB]" />
                          </div>
                          <div className="py-1.5 text-center border-b border-[#EFEFEF]">
                            <span className="text-[10.5px] font-bold text-black">Comments</span>
                          </div>
                        </div>

                        <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto">
                          <div className="flex items-start gap-2">
                            <div className="h-5.5 w-5.5 rounded-full bg-gradient-to-tr from-[#6366F1] to-[#EC4899] flex items-center justify-center text-white font-bold text-[8px] shrink-0">
                              IH
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-[#262626]">{previewUsername}</span>
                                <span className="text-[8.5px] text-[#8E8E8E]">2m</span>
                              </div>
                              <div className="text-[10px] text-[#262626] mt-0.5 break-words">
                                {activeTrigger.keyword || "guide"}
                              </div>
                            </div>
                            <Heart className="h-2.5 w-2.5 text-[#ED4956] fill-[#ED4956] shrink-0" />
                          </div>

                          <div className="flex items-start gap-1.5 pl-6 relative">
                            <div className="h-4.5 w-4.5 rounded-full bg-[#1C1E21] overflow-hidden shrink-0">
                              {reelThumb && <img src={reelThumb} alt="" className="h-full w-full object-cover" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 flex-wrap">
                                <span className="text-[10px] font-bold text-[#262626]">thesquirrel</span>
                                <BadgeCheck className="h-2.5 w-2.5 text-[#0095F6] fill-[#0095F6] stroke-white" />
                                <span className="text-[8.5px] text-[#8E8E8E]">Just now</span>
                              </div>
                              <div className="text-[10px] text-[#262626] mt-0.5 leading-snug break-words">
                                {renderFormattedComment(currentPublicReply)}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-[#EFEFEF] bg-white px-2.5 py-1.5">
                          <span className="text-[9.5px] text-[#8E8E8E]">Add a comment...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="h-3.5 bg-white w-full flex items-center justify-center shrink-0">
                    <div className="w-20 h-1 bg-black rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[10px] text-[#65676B] text-center shrink-0">
              Previewing as <span className="font-semibold text-[#1C1E21]">@{previewUsername}</span>
            </div>
          </div>
        </div>

        {/* Modal Footer (Sharp Square Corners) */}
        <div className="px-6 py-3 border-t border-[#DADDE1] bg-white flex items-center justify-between shrink-0">
          {existingRule ? (
            <div className="relative">
              {!confirmDeleteOpen ? (
                <button
                  type="button"
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[12px] font-semibold text-[#D93025] hover:bg-[#FDECEA] transition cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete All Triggers
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-[#FDECEA] px-3 py-1 rounded-sm border border-[#D93025]/30">
                  <span className="text-[11px] font-semibold text-[#D93025]">
                    Remove all triggers?
                  </span>
                  <button
                    type="button"
                    onClick={handleDeleteAll}
                    className="px-2 py-0.5 rounded-sm bg-[#D93025] text-white text-[11px] font-bold cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteOpen(false)}
                    className="text-[11px] font-semibold text-[#65676B] hover:text-[#1C1E21] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-sm bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#1C1E21] text-[12px] font-semibold transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded-sm bg-[#0866FF] hover:bg-[#075CE5] text-white text-[12px] font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50 transition cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save Automation"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}