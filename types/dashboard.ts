export interface Trigger {
    keyword: string;
    replyMessage: string;
    buttonTitle?: string;
    buttonUrl?: string;
    publicReplyMessage?: string;
}

export interface ReelRule {
    mediaId: string;
    caption: string;
    mediaType: string;
    permalink: string;
    thumbnailUrl?: string;
    isActive: boolean;
    triggers: Trigger[];
    updatedAt?: string;
}

export interface IgMedia {
    id: string;
    caption?: string;
    media_type: string;
    permalink: string;
    thumbnail_url?: string;
    media_url?: string;
    timestamp: string;
    like_count?: number;
    comments_count?: number;
    shares_count?: number;
}

export interface LogItem {
    _id: string;
    commentId: string;
    mediaId: string;
    username: string;
    commentText: string;
    matchedKeyword: string;
    replySent: string;
    status: "sent" | "failed";
    errorMessage?: string;
    createdAt: string;
}