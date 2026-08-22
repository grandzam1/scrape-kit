/**
 * Repair UTF-8 that was decoded as Windows-1252 and saved again.
 *
 * Whole-string latin1 round-trips fail on mixed files: a real U+2019 maps to
 * byte 0x92 and poisons UTF-8 decode of the paragraph. Instead, walk characters
 * and only reinterpret a 2–4 char window when the first char is a UTF-8 lead
 * byte in cp1252 (â, Ã, ð, …).
 */

const BYTE_FROM_CP1252 = new Map([
  [0x20ac, 0x80],
  [0x201a, 0x82],
  [0x0192, 0x83],
  [0x201e, 0x84],
  [0x2026, 0x85],
  [0x2020, 0x86],
  [0x2021, 0x87],
  [0x02c6, 0x88],
  [0x2030, 0x89],
  [0x0160, 0x8a],
  [0x2039, 0x8b],
  [0x0152, 0x8c],
  [0x017d, 0x8e],
  [0x2018, 0x91],
  [0x2019, 0x92],
  [0x201c, 0x93],
  [0x201d, 0x94],
  [0x2022, 0x95],
  [0x2013, 0x96],
  [0x2014, 0x97],
  [0x02dc, 0x98],
  [0x2122, 0x99],
  [0x0161, 0x9a],
  [0x203a, 0x9b],
  [0x0153, 0x9c],
  [0x017e, 0x9e],
  [0x0178, 0x9f],
]);

export function stripBom(text) {
  return String(text ?? "").replace(/^\uFEFF/, "");
}

export function looksLikeMojibake(text) {
  return /â.|Ã.|ðŸ|Â[ \xa0]|â€|â†|â”/.test(text);
}

function toCp1252Byte(codePoint) {
  if (codePoint <= 0x7f || (codePoint >= 0xa0 && codePoint <= 0xff)) {
    return codePoint;
  }
  const mapped = BYTE_FROM_CP1252.get(codePoint);
  if (mapped != null) return mapped;
  if (codePoint >= 0x80 && codePoint <= 0x9f) return codePoint;
  return null;
}

function utf8SeqLen(lead) {
  if (lead >= 0xc2 && lead <= 0xdf) return 2;
  if (lead >= 0xe0 && lead <= 0xef) return 3;
  if (lead >= 0xf0 && lead <= 0xf4) return 4;
  return 0;
}

function tryDecodeWindow(chars, start, len) {
  const bytes = [];
  for (let i = 0; i < len; i += 1) {
    const ch = chars[start + i];
    if (!ch) return null;
    const byte = toCp1252Byte(ch.codePointAt(0));
    if (byte == null) return null;
    bytes.push(byte);
  }
  try {
    const decoded = new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(bytes),
    );
    if ([...decoded].length >= len) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function fixMojibake(input) {
  let text = stripBom(String(input ?? ""));
  for (let pass = 0; pass < 3; pass += 1) {
    const next = fixMojibakeOnce(text);
    if (next === text) break;
    text = next;
  }
  return text;
}

function fixMojibakeOnce(text) {
  const chars = [...text];
  let out = "";
  for (let i = 0; i < chars.length; ) {
    const lead = toCp1252Byte(chars[i].codePointAt(0));
    const seqLen = lead == null ? 0 : utf8SeqLen(lead);
    let decoded = null;
    if (seqLen >= 2) decoded = tryDecodeWindow(chars, i, seqLen);
    if (decoded != null) {
      out += decoded;
      i += seqLen;
    } else {
      out += chars[i];
      i += 1;
    }
  }
  return out;
}
