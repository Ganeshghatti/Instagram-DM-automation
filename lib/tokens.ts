export interface TokenContext {
    username: string;
    keyword: string;
}

export function replaceTokens(template: string, ctx: TokenContext): string {
    if (!template) return "";

    const cleanUsername = ctx.username.replace(/^@/, "").trim();

    return template
        .replace(/\{@username\}/gi, `@${cleanUsername}`)
        .replace(/\{username\}/gi, cleanUsername)
        .replace(/\{keyword\}/gi, ctx.keyword.trim());
}