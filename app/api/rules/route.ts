import { NextRequest, NextResponse, connection } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ReelRule } from "@/models/Schema";

export async function GET() {
    await connection();
    try {
        await connectToDatabase();

        const token = process.env.IG_ACCESS_TOKEN;
        const igRes = await fetch(
            `https://graph.instagram.com/v25.0/me/media?fields=id&limit=50&access_token=${token}`,
            { cache: "no-store" }
        );

        if (igRes.ok) {
            const igData = await igRes.json();
            const liveMediaIds = new Set((igData.data || []).map((m: any) => m.id));
            const storedRules = await ReelRule.find({}).lean();
            const staleMediaIds = storedRules
                .map((r) => r.mediaId)
                .filter((mediaId) => !liveMediaIds.has(mediaId));

            if (staleMediaIds.length > 0) {
                await ReelRule.deleteMany({ mediaId: { $in: staleMediaIds } });
            }
        }

        const rules = await ReelRule.find({}).sort({ updatedAt: -1 }).lean();
        return NextResponse.json({ rules });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    await connection();
    try {
        await connectToDatabase();
        const body = await req.json();
        const { mediaId, caption, mediaType, permalink, thumbnailUrl, isActive, triggers } = body;

        if (!mediaId || !Array.isArray(triggers)) {
            return NextResponse.json({ error: "mediaId and triggers array required" }, { status: 400 });
        }

        const sanitizedTriggers = triggers
            .filter((t: any) => t.keyword?.trim() && t.replyMessage?.trim())
            .map((t: any) => ({
                keyword: t.keyword.trim().toLowerCase(),
                replyMessage: t.replyMessage.trim(),
                buttonTitle: t.buttonTitle ? t.buttonTitle.trim() : "",
                buttonUrl: t.buttonUrl ? t.buttonUrl.trim() : "",
                publicReplyMessage: t.publicReplyMessage ? t.publicReplyMessage.trim() : "",
            }));

        const updated = await ReelRule.findOneAndUpdate(
            { mediaId },
            {
                $set: {
                    caption: caption || "",
                    mediaType: mediaType || "REELS",
                    permalink: permalink || "",
                    thumbnailUrl: thumbnailUrl || "",
                    isActive: isActive ?? true,
                    triggers: sanitizedTriggers,
                },
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ success: true, rule: updated });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    await connection();
    try {
        await connectToDatabase();
        const mediaId = req.nextUrl.searchParams.get("mediaId");
        if (!mediaId) {
            return NextResponse.json({ error: "Missing mediaId" }, { status: 400 });
        }
        await ReelRule.deleteOne({ mediaId });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}