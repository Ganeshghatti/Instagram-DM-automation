import { NextRequest, NextResponse, connection } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ProcessedComment, ReelRule } from "@/models/Schema";

export async function GET(req: NextRequest) {
    await connection();
    try {
        await connectToDatabase();

        const mediaId = req.nextUrl.searchParams.get("mediaId");
        const query = mediaId ? { mediaId } : {};

        // 1. Fetch logs & current rules map
        const [logs, rules] = await Promise.all([
            ProcessedComment.find(query).sort({ createdAt: -1 }).limit(2000).lean(),
            ReelRule.find({}).lean(),
        ]);

        const rulesMap: Record<string, any> = {};
        for (const rule of rules) {
            rulesMap[rule.mediaId] = rule;
        }

        // 2. CSV Headers matching the Table columns
        const headers = [
            "Timestamp (UTC)",
            "Status",
            "Username",
            "Reel Link",
            "Media ID",
            "Comment ID",
            "Comment Text",
            "Matched Keyword",
            "Private DM Sent",
            "CTA Button Title",
            "CTA Destination URL",
            "Public Comment Reply",
            "Error Message",
        ];

        const escapeCsv = (str: any) => {
            if (str === null || str === undefined) return '""';
            const val = String(str).replace(/"/g, '""');
            return `"${val}"`;
        };

        // Forces Excel / Sheets to render long numeric IDs strictly as plain text
        const escapeTextId = (id: any) => {
            if (!id) return '""';
            const cleanId = String(id).trim().replace(/"/g, '""');
            return `"=""${cleanId}"""`;
        };

        const csvRows = [headers.join(",")];

        // 3. Process every log row
        for (const log of logs) {
            let displayDm = log.replySent || "";
            let displayCtaTitle = "";
            let displayCtaUrl = log.ctaUrl || "";
            let displayPublic = log.publicReplySent || "";

            // Match with active ReelRule trigger configuration
            const activeRule = rulesMap[log.mediaId];
            const matchedTrigger = activeRule?.triggers?.find(
                (t: any) => t.keyword?.toLowerCase() === log.matchedKeyword?.toLowerCase()
            );

            if (matchedTrigger?.buttonTitle) {
                displayCtaTitle = matchedTrigger.buttonTitle;
            }
            if (matchedTrigger?.buttonUrl && !displayCtaUrl) {
                displayCtaUrl = matchedTrigger.buttonUrl;
            }

            // Historical fallback parsing for [CTA: Title -> URL] or [CTA: Title]
            if (displayDm.includes(" [CTA:")) {
                const ctaMatch = displayDm.match(/\[CTA:\s*(.*?)(?:\s*->\s*(https?:\/\/[^\s\]]+))?\]/);
                if (ctaMatch) {
                    if (!displayCtaTitle) displayCtaTitle = ctaMatch[1] || "";
                    if (ctaMatch[2] && !displayCtaUrl) displayCtaUrl = ctaMatch[2];
                }
            }

            // Handle cases where ctaUrl only stored the title string (e.g. "View Guide")
            if (!displayCtaTitle && displayCtaUrl && !displayCtaUrl.startsWith("http")) {
                displayCtaTitle = displayCtaUrl;
                displayCtaUrl = matchedTrigger?.buttonUrl || "";
            }

            if (displayCtaUrl && !displayCtaTitle) {
                displayCtaTitle = "View Link";
            }

            // Historical fallback parsing for public comment replies
            if (displayDm.includes(" | Public:") && !displayPublic) {
                const publicMatch = displayDm.match(/\|\s*Public:\s*"(.*?)"/);
                if (publicMatch) displayPublic = publicMatch[1];
            }

            // Clean DM copy
            if (displayDm) {
                displayDm = displayDm
                    .replace(/\s*\[CTA:.*?\]/g, "")
                    .replace(/\s*\|\s*Public:.*$/g, "")
                    .trim();
            }

            csvRows.push(
                [
                    escapeCsv(new Date(log.createdAt).toISOString()),
                    escapeCsv(log.status === "sent" ? "200 OK" : "Failed"),
                    escapeCsv(`@${log.username}`),
                    escapeCsv(log.mediaPermalink || `https://www.instagram.com/p/${log.mediaId}`),
                    escapeTextId(log.mediaId),      // Fixes scientific notation E+17
                    escapeTextId(log.commentId),    // Fixes scientific notation E+17
                    escapeCsv(log.commentText),
                    escapeCsv(log.matchedKeyword),
                    escapeCsv(displayDm),
                    escapeCsv(displayCtaTitle || (displayCtaUrl ? "View Link" : "None")),
                    escapeCsv(displayCtaUrl || "None"),
                    escapeCsv(displayPublic || "None configured"),
                    escapeCsv(log.errorMessage || ""),
                ].join(",")
            );
        }

        // Add UTF-8 BOM (\uFEFF) so Excel respects UTF-8 emojis and special characters
        const csvContent = "\uFEFF" + csvRows.join("\n");
        const fileName = mediaId
            ? `squirrelsync-logs-${mediaId}.csv`
            : `squirrelsync-all-logs-${Date.now()}.csv`;

        return new NextResponse(csvContent, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="${fileName}"`,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}