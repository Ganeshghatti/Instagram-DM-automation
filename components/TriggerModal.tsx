"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, X, Check, Link as LinkIcon, Shuffle } from "lucide-react";
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
          keyword: "link",
          replyMessage: "Hey! Tap below to open the link from my Reel:",
          buttonTitle: "Open Link",
          buttonUrl: "",
          publicReplyMessages: [
            "Sent to your DMs! Check requests 📥",
            "Delivered to your inbox! Check message requests 🚀",
            "Sent over! Check your direct messages ✨",
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
      if (!res.ok) {
        throw new Error(data.error || "Failed to save rules");
      }

      await onSaved();
      onClose();
    } catch (err: any) {
      alert(`Error saving rules: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("Remove all triggers for this Reel?")) return;
    await fetch(`/api/rules?mediaId=${reel.id}`, { method: "DELETE" });
    await onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1C2B33]/40 backdrop-blur-[1px] flex justify-end">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-[#DADDE1]">
        <div className="px-5 py-3 border-b border-[#DADDE1] flex items-center justify-between bg-[#FAFBFC]">
          <div>
            <span className="text-[14px] font-bold text-[#1C1E21]">
              Configure Trigger Mappings
            </span>
            <p className="text-[11px] text-[#65676B] truncate max-w-[300px]">
              ID: {reel.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#65676B] hover:bg-[#E4E6EB] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-[#F7F8FA]">
          <div className="bg-white p-3 rounded border border-[#DADDE1] flex items-center justify-between">
            <span className="text-[12px] font-bold">Enable Webhook Listener</span>
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 accent-[#0866FF] cursor-pointer"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#65676B]">
                Keywords & Reply Actions ({triggers.length})
              </span>
              <button
                type="button"
                onClick={() =>
                  setTriggers([
                    ...triggers,
                    {
                      keyword: "",
                      replyMessage: "",
                      buttonTitle: "",
                      buttonUrl: "",
                      publicReplyMessages: [],
                    },
                  ])
                }
                className="text-[12px] font-semibold text-[#0866FF] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Add Rule
              </button>
            </div>

            {triggers.map((item, idx) => (
              <div
                key={idx}
                className="bg-white p-3.5 rounded border border-[#DADDE1] space-y-2.5 shadow-2xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold uppercase text-[#65676B] block mb-1">
                      Trigger Keyword
                    </label>
                    <input
                      type="text"
                      style={{ fontFamily: "var(--font-mono)" }}
                      placeholder="e.g. link, guide"
                      value={item.keyword}
                      onChange={(e) =>
                        updateTrigger(idx, "keyword", e.target.value)
                      }
                      className="w-full px-2.5 py-1 rounded border border-[#CCD0D5] text-[12px] focus:outline-none focus:border-[#0866FF]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setTriggers(triggers.filter((_, i) => i !== idx))
                    }
                    className="mt-4 p-1 text-[#65676B] hover:text-[#E41E3F] cursor-pointer"
                    title="Remove rule"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* 1. Private DM Copy */}
                <div>
                  <label className="text-[10px] font-bold uppercase text-[#65676B] block mb-1">
                    1. Private DM Text (Max 80 chars if using button)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Direct Message reply text..."
                    value={item.replyMessage}
                    onChange={(e) =>
                      updateTrigger(idx, "replyMessage", e.target.value)
                    }
                    className="w-full px-2.5 py-1.5 rounded border border-[#CCD0D5] text-[12px] focus:outline-none focus:border-[#0866FF] resize-none"
                  />
                </div>

                {/* 2. Optional CTA Button */}
                <div className="p-2.5 rounded bg-[#F7F8FA] border border-[#EBEDF0] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#65676B]">
                      <LinkIcon className="h-3 w-3 text-[#0866FF]" /> 2. CTA Button Card (Optional)
                    </span>
                    <span className="text-[10px] text-[#8A8D91]">
                      Leave URL blank for text-only DM
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <input
                        type="text"
                        maxLength={20}
                        placeholder="Button Text"
                        value={item.buttonTitle || ""}
                        onChange={(e) =>
                          updateTrigger(idx, "buttonTitle", e.target.value)
                        }
                        className="w-full px-2 py-1 rounded bg-white border border-[#CCD0D5] text-[11px] focus:outline-none focus:border-[#0866FF]"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="url"
                        placeholder="https://example.com"
                        value={item.buttonUrl || ""}
                        onChange={(e) =>
                          updateTrigger(idx, "buttonUrl", e.target.value)
                        }
                        className="w-full px-2 py-1 rounded bg-white border border-[#CCD0D5] text-[11px] focus:outline-none focus:border-[#0866FF]"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Rotating Public Comment Replies (Spintax) */}
                <div className="p-2.5 rounded bg-[#F7F8FA] border border-[#EBEDF0] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#65676B]">
                      <Shuffle className="h-3 w-3 text-[#31A24C]" /> 3. Rotating Public Replies (1 per line)
                    </span>
                    <span className="text-[10px] font-bold text-[#31A24C]">
                      {item.publicReplyMessages?.length || 0} variations
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    placeholder={"Sent to your DMs! Check requests 📥\nDelivered! Check your inbox 🚀\nSent over! Check requests ✨"}
                    value={(item.publicReplyMessages || []).join("\n")}
                    onChange={(e) => {
                      const lines = e.target.value.split("\n");
                      updateTrigger(idx, "publicReplyMessages", lines);
                    }}
                    className="w-full px-2.5 py-1.5 rounded bg-white border border-[#CCD0D5] text-[11px] focus:outline-none focus:border-[#0866FF] font-mono leading-relaxed resize-none"
                  />
                  <p className="text-[10px] text-[#8A8D91]">
                    Randomly picks one variation per comment to avoid Meta spam detection.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[#DADDE1] bg-white flex items-center justify-between">
          {existingRule ? (
            <button
              type="button"
              onClick={handleDeleteAll}
              className="text-[12px] font-semibold text-[#D93025] hover:underline cursor-pointer"
            >
              Delete All
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-[#E4E6EB] text-[#1C1E21] text-[12px] font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-1.5 rounded bg-[#0866FF] text-white text-[12px] font-semibold flex items-center gap-1 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <Check className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}