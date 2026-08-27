export function encodeUtf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = "";
  for (const byte of bytes) bin += String.fromCharCode(byte);
  return btoa(bin);
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function slugFromUrl(url: string): string {
  const u = new URL(url);
  const hash = u.hash.replace(/^#/, "").toLowerCase();
  const raw = `${u.hostname}${u.pathname}${hash ? "-" + hash : ""}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
  return raw.replace(/^-|-$/g, "") || "page";
}

export function stripBom(text: string): string {
  return text.replace(/^\uFEFF/, "");
}

/** UTF-8 that was decoded as Windows-1252 and saved again (â€™, â†’, ðŸ…). */
export function toCp1252Byte(codePoint: number): number | null {
  if (codePoint <= 0x7f || (codePoint >= 0xa0 && codePoint <= 0xff)) return codePoint;
  const extra: Record<number, number> = {
    0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85,
    0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
    0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92,
    0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
    0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c,
    0x017e: 0x9e, 0x0178: 0x9f,
  };
  return extra[codePoint] ?? (codePoint >= 0x80 && codePoint <= 0x9f ? codePoint : null);
}

export function utf8SeqLen(lead: number): number {
  if (lead >= 0xc2 && lead <= 0xdf) return 2;
  if (lead >= 0xe0 && lead <= 0xef) return 3;
  if (lead >= 0xf0 && lead <= 0xf4) return 4;
  return 0;
}

export function tryDecodeWindow(chars: string[], start: number, len: number): string | null {
  const bytes: number[] = [];
  for (let i = 0; i < len; i++) {
    const ch = chars[start + i];
    if (!ch) return null;
    const byte = toCp1252Byte(ch.codePointAt(0)!);
    if (byte == null) return null;
    bytes.push(byte);
  }
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(bytes));
    if ([...decoded].length >= len) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function fixMojibake(input: string): string {
  let text = stripBom(input);
  for (let pass = 0; pass < 3; pass++) {
    const chars = [...text];
    let out = "";
    for (let i = 0; i < chars.length; ) {
      const lead = toCp1252Byte(chars[i].codePointAt(0)!);
      const seqLen = lead == null ? 0 : utf8SeqLen(lead);
      const decoded = seqLen >= 2 ? tryDecodeWindow(chars, i, seqLen) : null;
      if (decoded != null) {
        out += decoded;
        i += seqLen;
      } else {
        out += chars[i];
        i += 1;
      }
    }
    if (out === text) break;
    text = out;
  }
  return text;
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function extractJsonObject(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error("Groq response was not valid JSON");
  }
}
