"use client";

import React from "react";
import {
  ExternalLink,
  SlidersHorizontal,
  Heart,
  MessageCircle,
  Share2,
} from "lucide-react";
import { IgMedia, ReelRule } from "@/types/dashboard";

interface ReelCardProps {
  reel: IgMedia;
  rule?: ReelRule;
  onConfigure: (reel: IgMedia) => void;
}

export default function ReelCard({ reel, rule, onConfigure }: ReelCardProps) {
  const hasTriggers = Boolean(rule && rule.triggers && rule.triggers.length > 0);
  const thumb = reel.thumbnail_url || reel.media_url;

  return (
    <div className="bg-white rounded border border-[#DADDE1] flex flex-col justify-between overflow-hidden shadow-xs hover:border-[#BCC0C4] transition">
      <div>
        {/* Card Header: Media ID & Webhook Status */}
        <div className="px-3 py-2 border-b border-[#EBEDF0] bg-[#FAFBFC] flex items-center justify-between">
          <span
            style={{ fontFamily: "var(--font-mono)" }}
            className="text-[11px] text-[#65676B] truncate max-w-[180px]"
            title={reel.id}
          >
            ID: {reel.id}
          </span>
          {hasTriggers ? (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rule?.isActive
                  ? "bg-[#EAF6ED] text-[#2B8A3E]"
                  : "bg-[#FFF4E5] text-[#D97706]"
                }`}
            >
              {rule?.isActive ? "Active" : "Paused"}
            </span>
          ) : (
            <span className="text-[10px] text-[#8A8D91]">Unconfigured</span>
          )}
        </div>

        {/* Thumbnail & Caption */}
        <div className="p-3.5 flex gap-3">
          <div className="h-16 w-14 rounded bg-[#F0F2F5] border border-[#DADDE1] overflow-hidden shrink-0">
            {thumb ? (
              <img
                src={thumb}
                alt="Reel thumbnail"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[9px] text-[#8A8D91] text-center p-1">
                No Media
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-[#1C1E21] line-clamp-2 leading-snug">
              {reel.caption || "Untitled Reel"}
            </p>
            <a
              href={reel.permalink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[11px] text-[#0866FF] mt-1 hover:underline"
            >
              View on Instagram <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>

        {/* Engagement Metrics Strip */}
        <div className="px-3.5 pb-3">
          <div className="grid grid-cols-3 gap-2 py-2 px-2.5 rounded bg-[#F7F8FA] border border-[#EBEDF0] text-center">
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#65676B]">
                <Heart className="h-3 w-3 text-[#E41E3F]" /> Likes
              </span>
              <span
                style={{ fontFamily: "var(--font-mono)" }}
                className="text-[12px] font-bold text-[#1C1E21] mt-0.5"
              >
                {reel.like_count ?? 0}
              </span>
            </div>
            <div className="flex flex-col items-center border-x border-[#EBEDF0]">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#65676B]">
                <MessageCircle className="h-3 w-3 text-[#0866FF]" /> Comments
              </span>
              <span
                style={{ fontFamily: "var(--font-mono)" }}
                className="text-[12px] font-bold text-[#1C1E21] mt-0.5"
              >
                {reel.comments_count ?? 0}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#65676B]">
                <Share2 className="h-3 w-3 text-[#31A24C]" /> Shares
              </span>
              <span
                style={{ fontFamily: "var(--font-mono)" }}
                className="text-[12px] font-bold text-[#1C1E21] mt-0.5"
              >
                {reel.shares_count ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Configured Trigger Keywords */}
        <div className="px-3.5 pb-3.5">
          <div className="rounded bg-[#F7F8FA] border border-[#EBEDF0] p-2.5 min-h-[42px] flex items-center">
            {hasTriggers && rule ? (
              <div className="flex flex-wrap gap-1">
                {rule.triggers.map((t, idx) => {
                  const hasCta = Boolean(t.buttonTitle?.trim() && t.buttonUrl?.trim());
                  return (
                    <span
                      key={idx}
                      style={{ fontFamily: "var(--font-mono)" }}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-[#E7F3FF] text-[#0866FF] border border-[#0866FF]/15"
                      title={
                        hasCta
                          ? `CTA Button: "${t.buttonTitle}" -> ${t.buttonUrl}`
                          : `Text Reply: "${t.replyMessage}"`
                      }
                    >
                      {t.keyword}
                      {hasCta && (
                        <span className="text-[9px] font-bold text-[#0866FF]">
                          ↗
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            ) : (
              <span className="text-[11px] text-[#8A8D91]">
                No triggers bound
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Action Button */}
      <div className="p-3 border-t border-[#EBEDF0] bg-[#FAFBFC]">
        <button
          onClick={() => onConfigure(reel)}
          className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded bg-[#F0F2F5] hover:bg-[#E4E6EB] text-[#1C1E21] text-[12px] font-semibold transition cursor-pointer"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-[#65676B]" />
          {hasTriggers ? "Edit Triggers" : "Configure Triggers"}
        </button>
      </div>
    </div>
  );
}