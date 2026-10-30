import { NextResponse, connection } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ProcessedComment } from "@/models/Schema";

export async function GET() {
    await connection();
    try {
        await connectToDatabase();
        const logs = await ProcessedComment.find({})
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();
        return NextResponse.json({ logs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE() {
    await connection();
    try {
        await connectToDatabase();
        await ProcessedComment.deleteMany({});
        return NextResponse.json({ success: true, message: "Webhook logs cleared" });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}