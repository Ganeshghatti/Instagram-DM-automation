"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, X, Check } from "lucide-react";
import { IgMedia, ReelRule, Trigger } from "@/types/dashboard";

interface TriggerModalProps {
  reel: IgMedia | null;
  existingRule?: ReelRule;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

export default function TriggerModal({ reel, existingRule, onClose, onSaved }: TriggerModalProps) {
  const [triggers, setTriggers] = useState<Trigger[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!reel) return;
    if (existingRule && existingRule.triggers.length > 0) {
      setTriggers([...existingRule.triggers]);
      setIsActive(existingRule.isActive);
    } else {
      setTriggers([{ keyword: "link", replyMessage: "Hey! Here is the link: " }]);
      setIsActive(true);
    }
  }, [reel, existingRule]);

  if (!reel) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
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

      if (res.ok) {
        await onSaved();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1C2B33]/40 backdrop-blur-[1px] flex justify-end">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-[#DADDE1]">
        <div className="px-5 py-3 border-b border-[#DADDE1] flex items-center justify-between bg-[#FAFBFC]">
          <span className="text-[14px] font-bold text-[#1C1E21]">Configure Trigger Mappings</span>
          <button onClick={onClose} className="p-1 rounded text-[#65676B] hover:bg-[#E4E6EB]">
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
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#65676B]">Keywords & Replies</span>
              <button
                type="button"
                onClick={() => setTriggers([...triggers, { keyword: "", replyMessage: "" }])}
                className="text-[12px] font-semibold text-[#0866FF] hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Add Rule
              </button>
            </div>

            {triggers.map((item, idx) => (
              <div key={idx} className="bg-white p-3 rounded border border-[#DADDE1] space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <input
                    type="text"
                    style={{ fontFamily: "var(--font-mono)" }}
                    placeholder="Keyword (e.g. guide)"
                    value={item.keyword}
                    onChange={(e) => {
                      const updated = [...triggers];
                      updated[idx].keyword = e.target.value;
                      setTriggers(updated);
                    }}
                    className="w-full px-2.5 py-1 rounded border border-[#CCD0D5] text-[12px] focus:outline-none focus:border-[#0866FF]"
                  />
                  <button
                    type="button"
                    onClick={() => setTriggers(triggers.filter((_, i) => i !== idx))}
                    className="text-[#65676B] hover:text-[#E41E3F]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="Private Reply DM message..."
                  value={item.replyMessage}
                  onChange={(e) => {
                    const updated = [...triggers];
                    updated[idx].replyMessage = e.target.value;
                    setTriggers(updated);
                  }}
                  className="w-full px-2.5 py-1.5 rounded border border-[#CCD0D5] text-[12px] focus:outline-none focus:border-[#0866FF] resize-none"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-[#DADDE1] bg-white flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 rounded bg-[#E4E6EB] text-[#1C1E21] text-[12px] font-semibold">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 rounded bg-[#0866FF] text-white text-[12px] font-semibold flex items-center gap-1 shadow-xs disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" /> {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
