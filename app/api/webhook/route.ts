import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ReelRule, ProcessedComment, ITrigger } from "@/models/Schema";
import { replaceTokens } from "@/lib/tokens";

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
    const username = commentData?.from?.username || "friend";
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
    const matchedTrigger = reelRule.triggers.find((t: ITrigger) =>
        lowerComment.includes(t.keyword.toLowerCase())
    );

    if (!matchedTrigger) return;

    const token = process.env.IG_ACCESS_TOKEN;

    // 1. Resolve Dynamic Tokens
    const tokenCtx = {
        username,
        keyword: matchedTrigger.keyword,
    };

    const finalDmText = replaceTokens(matchedTrigger.replyMessage, tokenCtx);

    const hasCtaButton = Boolean(
        matchedTrigger.buttonTitle?.trim() && matchedTrigger.buttonUrl?.trim()
    );

    // 2. Build DM Payload
    const dmPayload = hasCtaButton
        ? {
            recipient: { comment_id: commentId },
            message: {
                attachment: {
                    type: "template",
                    payload: {
                        template_type: "generic",
                        elements: [
                            {
                                title: finalDmText.slice(0, 80),
                                buttons: [
                                    {
                                        type: "web_url",
                                        url: matchedTrigger.buttonUrl!.trim(),
                                        title: matchedTrigger.buttonTitle!.trim().slice(0, 20),
                                    },
                                ],
                            },
                        ],
                    },
                },
            },
        }
        : {
            recipient: { comment_id: commentId },
            message: { text: finalDmText },
        };

    let logReplySummary = hasCtaButton
        ? `${finalDmText} [CTA: ${matchedTrigger.buttonTitle}]`
        : finalDmText;

    try {
        // 3. Send Private DM
        const dmRes = await fetch("https://graph.instagram.com/v25.0/me/messages", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(dmPayload),
        });

        const dmData = await dmRes.json();
        if (!dmRes.ok) {
            throw new Error(dmData?.error?.message || "Graph API DM error");
        }

        // 4. Send Public Comment Reply (with token replacement)
        const variations = matchedTrigger.publicReplyMessages || [];
        if (variations.length > 0) {
            const rawVariation = variations[Math.floor(Math.random() * variations.length)];
            const finalPublicReply = replaceTokens(rawVariation, tokenCtx);

            try {
                const publicRes = await fetch(
                    `https://graph.instagram.com/v25.0/${commentId}/replies`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ message: finalPublicReply }),
                    }
                );

                if (publicRes.ok) {
                    logReplySummary += ` | Public: "${finalPublicReply}"`;
                }
            } catch (publicErr: any) {
                console.warn("Public reply dispatch warning:", publicErr.message);
            }
        }

        await ProcessedComment.create({
            commentId,
            mediaId,
            username,
            commentText,
            matchedKeyword: matchedTrigger.keyword,
            replySent: logReplySummary,
            status: "sent",
        });
    } catch (err: any) {
        console.error(`Failed to dispatch for @${username}:`, err.message);
        await ProcessedComment.create({
            commentId,
            mediaId,
            username,
            commentText,
            matchedKeyword: matchedTrigger.keyword,
            replySent: logReplySummary,
            status: "failed",
            errorMessage: err.message,
        });
    }
}