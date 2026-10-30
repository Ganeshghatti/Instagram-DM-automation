import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ReelRule, ProcessedComment } from "@/models/Schema";

// 1. WEBHOOK VERIFICATION (GET)
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === process.env.VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 });
    }
    return new NextResponse("Forbidden", { status: 403 });
}

// 2. COMMENT EVENT LISTENER (POST)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        if (body.object !== "instagram") {
            return new NextResponse("Not an Instagram event", { status: 200 });
        }

        await connectToDatabase();

        for (const entry of body.entry || []) {
            for (const change of entry.changes || []) {
                if (change.field === "comments") {
                    await processCommentEvent(change.value);
                }
            }
        }

        return new NextResponse("EVENT_RECEIVED", { status: 200 });
    } catch (error) {
        console.error("Webhook POST Error:", error);
        return new NextResponse("EVENT_RECEIVED", { status: 200 });
    }
}

async function processCommentEvent(commentData: any) {
    const commentId = commentData?.id;
    const commentText = (commentData?.text || "").trim();
    const commenterId = commentData?.from?.id;
    const username = commentData?.from?.username || "instagram_user";
    const mediaId = commentData?.media?.id;

    if (!commentId || !mediaId || commenterId === process.env.IG_USER_ID) {
        return;
    }

    const alreadyProcessed = await ProcessedComment.findOne({ commentId }).lean();
    if (alreadyProcessed) return;

    const reelRule = await ReelRule.findOne({ mediaId, isActive: true }).lean();
    if (!reelRule || !reelRule.triggers || reelRule.triggers.length === 0) {
        return;
    }

    const lowerComment = commentText.toLowerCase();
    const matchedTrigger = reelRule.triggers.find((t) =>
        lowerComment.includes(t.keyword.toLowerCase())
    );

    if (!matchedTrigger) return;

    const url = "https://graph.instagram.com/v25.0/me/messages";
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.IG_ACCESS_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                recipient: { comment_id: commentId },
                message: { text: matchedTrigger.replyMessage },
            }),
        });

        const resData = await response.json();

        if (!response.ok) {
            throw new Error(resData?.error?.message || "Graph API error");
        }

        await ProcessedComment.create({
            commentId,
            mediaId,
            username,
            commentText,
            matchedKeyword: matchedTrigger.keyword,
            replySent: matchedTrigger.replyMessage,
            status: "sent",
        });
    } catch (err: any) {
        console.error(`Failed DM to @${username}:`, err.message);
        await ProcessedComment.create({
            commentId,
            mediaId,
            username,
            commentText,
            matchedKeyword: matchedTrigger.keyword,
            replySent: matchedTrigger.replyMessage,
            status: "failed",
            errorMessage: err.message,
        });
    }
}