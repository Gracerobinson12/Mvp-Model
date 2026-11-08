// lib/canary.ts — zero-width character canary marks for Idea Vault
// Encodes a payload (e.g. seal ID) as invisible Unicode characters woven into visible text.
// Works in plain text, Notion, Google Docs, GitHub, most email clients.
// Twitter/X strips zero-width chars — canary is a bonus, not the primary proof.

const ZW0 = '​'; // zero-width space      = bit 0
const ZW1 = '‌'; // zero-width non-joiner = bit 1
const SEP = '‍'; // zero-width joiner     = byte separator

/** Encode a string (e.g. seal ID "GC-A1B2C3D4") as invisible zero-width characters */
export function encodeCanary(payload: string): string {
  return payload
    .split('')
    .map(char => {
      const byte = char.charCodeAt(0);
      const bits = byte.toString(2).padStart(8, '0');
      return bits.split('').map(b => b === '0' ? ZW0 : ZW1).join('') + SEP;
    })
    .join('');
}

/** Decode zero-width characters back to the original string. Returns null if none found. */
export function decodeCanary(text: string): string | null {
  const hidden = [...text].filter(c => c === ZW0 || c === ZW1 || c === SEP).join('');
  if (!hidden) return null;
  const bytes = hidden.split(SEP).filter(Boolean);
  try {
    const decoded = bytes.map(b => {
      const bits = [...b].map(c => c === ZW1 ? '1' : '0').join('');
      return String.fromCharCode(parseInt(bits, 2));
    }).join('');
    return decoded || null;
  } catch {
    return null;
  }
}

/**
 * Weave invisible canary marks through visible text at every ~5 words.
 * The mark encodes the sealId so copy-paste can be traced back to the vault entry.
 */
export function watermarkText(visibleText: string, sealId: string): string {
  const mark = encodeCanary(sealId);
  const words = visibleText.split(' ');
  const result: string[] = [];
  for (let i = 0; i < words.length; i++) {
    result.push(words[i]);
    if ((i + 1) % 5 === 0) result.push(mark);
  }
  if (words.length % 5 !== 0) result.push(mark);
  return result.join(' ');
}

/** Check text for a canary mark and return the decoded payload (or null). */
export function readCanary(text: string): string | null {
  return decodeCanary(text);
}