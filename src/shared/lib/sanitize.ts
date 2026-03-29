export function sanitizeText(input: string, maxLength: number): string {
    return input
        .replace(/<[^>]*>/g, "")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .trim()
        .slice(0, maxLength);
}
