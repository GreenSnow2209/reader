/**
 * Vietnamese Legacy Encoding Normalizer
 *
 * Automatically detects and decodes legacy decomposed/VNI-style 8-bit composite fonts
 * commonly produced by legacy PDF-to-EPUB converters (such as pdftohtml 0.36 or VNI-Windows).
 * In these files, Vietnamese characters are stored as Latin-1 multi-character sequences
 * (e.g., 'iïë' -> 'iế', 'lêë' -> 'lấy', 'miïëng' -> 'miếng', 'cuãa' -> 'của', 'töi' -> 'tôi').
 */

// Signature patterns unique to legacy Vietnamese composite encoding
const LEGACY_SIGNATURE_REGEX =
  /(?:iï|êë|êì|êí|êî|êå|ïë|ïì|ïí|ïî|ïå|öë|öì|öí|öî|öå|ûú|uãa|àûú|bùç|mùæ|sùæ|rùç|chùè|phùè|tñnh|chñnh|trñ|Tiïën|sô|nghô|Lúâi|giúái)/;

const LEGACY_MAP: Record<string, string> = {
  // 4-character compounds
  nghïå: 'nghệ',
  Nghïå: 'Nghệ',
  NGHÏå: 'NGHỆ',
  NGHÏÅ: 'NGHỆ',

  // 3-character compounds
  ÀÛÚÅ: 'ĐƯỢ',
  ÀÛÚ: 'ĐƯƠ',
  àûúå: 'đượ',
  àûú: 'đươ',
  ÛÚÅ: 'ƯỢ',
  ûúå: 'ượ',
  Ûúå: 'Ượ',
  ÛÚÁ: 'ƯỚ',
  ûúá: 'ướ',
  Ûúá: 'Ướ',
  ÛÚÃ: 'ƯỞ',
  ûúã: 'ưở',
  Ûúã: 'Ưở',
  ÛÚÂ: 'ƯỜ',
  ûúâ: 'ườ',
  Ûúâ: 'Ườ',
  ÛÚÄ: 'ƯỠ',
  ûúä: 'ưỡ',
  Ûúä: 'Ưỡ',
  ÛÚI: 'ƯƠI',
  ûúi: 'ươi',
  Ûúi: 'Ươi',
  ÛÚ: 'ƯƠ',
  ûú: 'ươ',
  Ûú: 'Ươ',
  uãa: 'ủa',
  Uãa: 'Ủa',
  UÃA: 'ỦA',
  uäa: 'ũa',
  Uäa: 'Ũa',
  uâa: 'ùa',
  Uâa: 'Ùa',
  uáa: 'úa',
  Uáa: 'Úa',
  QUYÏÌ: 'QUYỀ',
  quyïì: 'quyề',
  QUYÏË: 'QUYẾ',
  quyïë: 'quyế',
  CHUYÏÍ: 'CHUYỂ',
  chuyïí: 'chuyể',
  CHUYÏË: 'CHUYẾ',
  chuyïë: 'chuyế',
  CHUYÏå: 'CHUYỆ',
  CHUYÏÅ: 'CHUYỆ',
  chuyïå: 'chuyệ',
  THUÊÅ: 'THUẬ',
  thuêåt: 'thuật',
  NGUYÏÎ: 'NGUYỄ',
  nguyïîn: 'nguyễn',

  // 2-character compounds
  // â (ê in legacy)
  êë: 'ấ',
  Êë: 'Ấ',
  ÊË: 'Ấ',
  êì: 'ầ',
  Êì: 'Ầ',
  ÊÌ: 'Ầ',
  êí: 'ẩ',
  Êí: 'Ẩ',
  ÊÍ: 'Ẩ',
  êî: 'ẫ',
  Êî: 'Ẫ',
  ÊÎ: 'Ẫ',
  êå: 'ậ',
  Êå: 'Ậ',
  ÊÅ: 'Ậ',

  // ê (ï in legacy)
  ïë: 'ế',
  Ïë: 'Ế',
  ÏË: 'Ế',
  ïì: 'ề',
  Ïì: 'Ề',
  ÏÌ: 'Ề',
  ïí: 'ể',
  Ïí: 'Ể',
  ÏÍ: 'Ể',
  ïî: 'ễ',
  Ïî: 'Ễ',
  ÏÎ: 'Ễ',
  ïå: 'ệ',
  Ïå: 'Ệ',
  ÏÅ: 'Ệ',

  // ô (ö in legacy)
  öë: 'ố',
  Öë: 'Ố',
  ÖË: 'Ố',
  öì: 'ồ',
  Öì: 'Ồ',
  ÖÌ: 'Ồ',
  öí: 'ổ',
  Öí: 'Ổ',
  ÖÍ: 'Ổ',
  öî: 'ỗ',
  Öî: 'Ỗ',
  ÖÎ: 'Ỗ',
  öå: 'ộ',
  Öå: 'Ộ',
  ÖÅ: 'Ộ',

  // ư (û in legacy)
  ûá: 'ứ',
  Ûá: 'Ứ',
  ÛÁ: 'Ứ',
  ûâ: 'ừ',
  Ûâ: 'Ừ',
  ÛÂ: 'Ừ',
  ûã: 'ử',
  Ûã: 'Ử',
  ÛÃ: 'Ử',
  ûä: 'ữ',
  Ûä: 'Ữ',
  ÛÄ: 'Ữ',
  ûå: 'ự',
  Ûå: 'Ự',
  ÛÅ: 'Ự',

  // ơ (ú in legacy)
  úá: 'ớ',
  Úá: 'Ớ',
  ÚÁ: 'Ớ',
  úâ: 'ờ',
  Úâ: 'Ờ',
  ÚÂ: 'Ờ',
  úã: 'ở',
  Úã: 'Ở',
  ÚÃ: 'Ở',
  úä: 'ỡ',
  Úä: 'Ỡ',
  ÚÄ: 'Ỡ',
  úå: 'ợ',
  Úå: 'Ợ',
  ÚÅ: 'Ợ',

  // ă (ù in legacy)
  ùæ: 'ắ',
  ÙÆ: 'Ắ',
  ùé: 'ẵ',
  ÙÉ: 'Ẵ',
  ùè: 'ẳ',
  ÙÈ: 'Ẳ',
  ùç: 'ằ',
  ÙÇ: 'Ằ',
  ùå: 'ặ',
  ÙÅ: 'Ặ',

  // a
  aá: 'á',
  Aá: 'Á',
  AÁ: 'Á',
  aâ: 'à',
  Aâ: 'À',
  AÂ: 'À',
  aã: 'ả',
  Aã: 'Ả',
  AÃ: 'Ả',
  aä: 'ã',
  Aä: 'Ã',
  AÄ: 'Ã',
  aå: 'ạ',
  Aå: 'Ạ',
  AÅ: 'Ạ',

  // e
  eá: 'é',
  Eá: 'É',
  EÁ: 'É',
  eâ: 'è',
  Eâ: 'È',
  EÂ: 'È',
  eã: 'ẻ',
  Eã: 'Ẻ',
  EÃ: 'Ẻ',
  eä: 'ẽ',
  Eä: 'Ẽ',
  EÄ: 'Ẽ',
  eå: 'ẹ',
  Eå: 'Ẹ',
  EÅ: 'Ẹ',

  // o
  oá: 'ó',
  Oá: 'Ó',
  OÁ: 'Ó',
  oâ: 'ò',
  Oâ: 'Ò',
  OÂ: 'Ò',
  oã: 'ỏ',
  Oã: 'Ỏ',
  OÃ: 'Ỏ',
  oä: 'õ',
  Oä: 'Õ',
  OÄ: 'Õ',
  oå: 'ọ',
  Oå: 'Ọ',
  OÅ: 'Ọ',

  // u
  uá: 'ú',
  Uá: 'Ú',
  UÁ: 'Ú',
  uâ: 'ù',
  Uâ: 'Ù',
  UÂ: 'Ù',
  uã: 'ủ',
  Uã: 'Ủ',
  UÃ: 'Ủ',
  uä: 'ũ',
  Uä: 'Ũ',
  UÄ: 'Ũ',
  uå: 'ụ',
  Uå: 'Ụ',
  UÅ: 'Ụ',

  // y
  yá: 'ý',
  Yá: 'Ý',
  YÁ: 'Ý',
  yâ: 'ỳ',
  Yâ: 'Ỳ',
  YÂ: 'Ỳ',
  yã: 'ỷ',
  Yã: 'Ỷ',
  YÃ: 'Ỷ',
  yä: 'ỹ',
  Yä: 'Ỹ',
  YÄ: 'Ỹ',
  yå: 'ỵ',
  Yå: 'Ỵ',
  YÅ: 'Ỵ',

  // Single characters
  ñ: 'í',
  Ñ: 'Í',
  ò: 'ì',
  Ò: 'Ì',
  ó: 'ỉ',
  Ó: 'Ỉ',
  ô: 'ĩ',
  Ô: 'Ĩ',
  õ: 'ị',
  Õ: 'Ị',
  à: 'đ',
  À: 'Đ',
  ê: 'â',
  Ê: 'Â',
  ï: 'ê',
  Ï: 'Ê',
  ö: 'ô',
  Ö: 'Ô',
  û: 'ư',
  Û: 'Ư',
  ú: 'ơ',
  Ú: 'Ơ',
  ù: 'ă',
  Ù: 'Ă',
  'æ”': '“',
};

// Sort replacement keys by length descending to match longest sequences first
const ESCAPED_KEYS = Object.keys(LEGACY_MAP)
  .sort((a, b) => b.length - a.length)
  .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

const REPLACEMENT_REGEX = new RegExp(ESCAPED_KEYS.join('|'), 'g');

/**
 * Check whether a text or HTML snippet contains legacy Vietnamese font patterns.
 */
export function isLegacyVietnamese(text: string): boolean {
  if (!text || text.length === 0) return false;
  return LEGACY_SIGNATURE_REGEX.test(text);
}

/**
 * Normalizes legacy Vietnamese encoded text or HTML into standard Unicode Vietnamese.
 * If the input does not contain legacy patterns, it returns the input untouched.
 */
export function normalizeLegacyVietnamese(text: string): string {
  if (!text || !isLegacyVietnamese(text)) {
    return text;
  }
  return text.replace(REPLACEMENT_REGEX, (matched) => LEGACY_MAP[matched] ?? matched);
}
