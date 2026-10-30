import { NextResponse } from "next/server";

export async function GET() {
    try {
        const token = process.env.IG_ACCESS_TOKEN;
        // 1. Request media basic fields including like_count and comments_count
        const url = `https://graph.instagram.com/v25.0/me/media?fields=id,caption,media_type,permalink,thumbnail_url,media_url,timestamp,like_count,comments_count&limit=24&access_token=${token}`;

        const response = await fetch(url, { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
            return NextResponse.json({ error: data?.error?.message || "Failed to fetch media" }, { status: 500 });
        }

        // 2. Optionally fetch shares for each reel (or map them smoothly)
        const reelsWithMetrics = await Promise.all(
            (data.data || []).map(async (reel: any) => {
                let sharesCount = 0;
                try {
                    // Meta Media Insights endpoint for shares (specifically for Reels/Posts)
                    const insightsRes = await fetch(
                        `https://graph.instagram.com/v25.0/${reel.id}/insights?metric=shares&access_token=${token}`,
                        { cache: "no-store" }
                    );
                    if (insightsRes.ok) {
                        const insightsData = await insightsRes.json();
                        sharesCount = insightsData.data?.[0]?.values?.[0]?.value || 0;
                    }
                } catch {
                    // Fallback if insights are unavailable for standard image posts
                    sharesCount = 0;
                }

                return {
                    ...reel,
                    like_count: reel.like_count || 0,
                    comments_count: reel.comments_count || 0,
                    shares_count: sharesCount,
                };
            })
        );

        return NextResponse.json({ reels: reelsWithMetrics });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}