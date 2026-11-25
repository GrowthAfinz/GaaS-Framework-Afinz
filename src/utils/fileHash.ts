/** SHA-256 em hexadecimal minúsculo; null quando o navegador não oferece crypto.subtle. */
export async function sha256Hex(buffer: ArrayBuffer): Promise<string | null> {
    if (typeof crypto === 'undefined' || !crypto.subtle) return null;
    const digest = await crypto.subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
