// Automatic AR <-> FR translation of job posts, done once at publish time (MyMemory free API).
// Optional: put a real email here to raise MyMemory's free daily limit (documented "de" parameter).
export const CONTACT_EMAIL = '';

const ENDPOINT = 'https://api.mymemory.translated.net/get';
const MAX_CHUNK = 400; // MyMemory accepts at most ~500 bytes per request

export function detectLang(text) {
  const letters = (text.match(/\p{L}/gu) || []).length;
  const arabic = (text.match(/[\u0600-\u06FF]/g) || []).length;
  return letters && arabic / letters >= 0.3 ? 'ar' : 'fr';
}

// Split into chunks <= MAX_CHUNK, keeping line breaks; remember the separator before each chunk.
function toChunks(text) {
  const units = [];
  text.split('\n').forEach((line, i) => {
    const sep = i === 0 ? '' : '\n';
    if (line.length <= MAX_CHUNK) { units.push({ t: line, sep }); return; }
    let cur = '', first = true;
    for (const w of line.split(' ')) {
      if (cur && (cur + ' ' + w).length > MAX_CHUNK) { units.push({ t: cur, sep: first ? sep : ' ' }); first = false; cur = w; }
      else cur = cur ? cur + ' ' + w : w;
    }
    if (cur) units.push({ t: cur, sep: first ? sep : ' ' });
  });
  const chunks = [];
  for (const u of units) {
    const last = chunks[chunks.length - 1];
    if (last && (last.text + u.sep + u.t).length <= MAX_CHUNK) last.text += u.sep + u.t;
    else chunks.push({ text: u.t, sep: u.sep });
  }
  return chunks;
}

async function translateChunk(q, from, to) {
  if (!q.trim()) return q;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 9000);
  try {
    const url = `${ENDPOINT}?q=${encodeURIComponent(q)}&langpair=${from}|${to}${CONTACT_EMAIL ? `&de=${encodeURIComponent(CONTACT_EMAIL)}` : ''}`;
    const res = await fetch(url, { signal: ctl.signal });
    if (!res.ok) throw new Error('translate http ' + res.status);
    const j = await res.json();
    const out = j?.responseData?.translatedText;
    // MyMemory reports quota problems inside a normal-looking response: never store those.
    if (Number(j?.responseStatus) !== 200 || !out || /MYMEMORY WARNING|INVALID LANGUAGE|QUERY LENGTH LIMIT/i.test(out)) throw new Error('translate rejected');
    return out;
  } finally { clearTimeout(timer); }
}

export async function translateText(text, from, to) {
  const chunks = toChunks(text);
  const out = await Promise.all(chunks.map(c => translateChunk(c.text, from, to)));
  return out.map((o, i) => (i ? chunks[i].sep : '') + o).join('');
}

// Returns { srcLang, tr } where tr is null if translation was unavailable (the post is then published as-is).
export async function translateJob({ jobTitle, description }) {
  const srcLang = detectLang(`${jobTitle} ${description}`);
  const to = srcLang === 'ar' ? 'fr' : 'ar';
  try {
    const [tt, td] = await Promise.all([translateText(jobTitle, srcLang, to), translateText(description, srcLang, to)]);
    return { srcLang, tr: { jobTitle: tt.slice(0, 300), description: td.slice(0, 6000) } };
  } catch (e) {
    console.warn('translation unavailable', e);
    return { srcLang, tr: null };
  }
}
