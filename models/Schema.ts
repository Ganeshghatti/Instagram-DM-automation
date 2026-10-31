import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITrigger {
    keyword: string;
    replyMessage: string;
    buttonTitle?: string;
    buttonUrl?: string;
    publicReplyMessage?: string;
}

export interface IReelRule extends Document {
    mediaId: string;
    caption: string;
    mediaType: string;
    permalink: string;
    thumbnailUrl?: string;
    isActive: boolean;
    triggers: ITrigger[];
    updatedAt: Date;
}

export interface IProcessedComment extends Document {
    commentId: string;
    mediaId: string;
    username: string;
    commentText: string;
    matchedKeyword: string;
    replySent: string;
    status: "sent" | "failed";
    errorMessage?: string;
    createdAt: Date;
}

const TriggerSchema = new Schema<ITrigger>(
    {
        keyword: { type: String, required: true, lowercase: true, trim: true },
        replyMessage: { type: String, required: true, trim: true },
        buttonTitle: { type: String, trim: true, default: "" },
        buttonUrl: { type: String, trim: true, default: "" },
        publicReplyMessage: { type: String, trim: true, default: "" },
    },
    { _id: false }
);

const ReelRuleSchema = new Schema<IReelRule>(
    {
        mediaId: { type: String, required: true, unique: true, index: true },
        caption: { type: String, default: "" },
        mediaType: { type: String, default: "REELS" },
        permalink: { type: String, default: "" },
        thumbnailUrl: { type: String, default: "" },
        isActive: { type: Boolean, default: true },
        triggers: { type: [TriggerSchema], default: [] },
    },
    { timestamps: true }
);

const ProcessedCommentSchema = new Schema<IProcessedComment>(
    {
        commentId: { type: String, required: true, unique: true, index: true },
        mediaId: { type: String, required: true },
        username: { type: String, required: true },
        commentText: { type: String, required: true },
        matchedKeyword: { type: String, required: true },
        replySent: { type: String, required: true },
        status: { type: String, enum: ["sent", "failed"], default: "sent" },
        errorMessage: { type: String },
    },
    { timestamps: true }
);

if (process.env.NODE_ENV !== "production") {
    delete mongoose.models.ReelRule;
    delete mongoose.models.ProcessedComment;
}

export const ReelRule: Model<IReelRule> =
    mongoose.models.ReelRule || mongoose.model<IReelRule>("ReelRule", ReelRuleSchema);

export const ProcessedComment: Model<IProcessedComment> =
    mongoose.models.ProcessedComment ||
    mongoose.model<IProcessedComment>("ProcessedComment", ProcessedCommentSchema);