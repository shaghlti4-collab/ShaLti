// Arabic/French-friendly normalization so "صيدلي", "الصيدلي", "Pharmacien" etc. match reliably.
export function norm(s) {
  return String(s || '').toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .trim();
}
export function filterJobs(jobs, { q = '', wilaya = '' } = {}) {
  const words = norm(q).split(/\s+/).filter(Boolean).map(w => (w.length > 3 && w.startsWith('ال') ? w.slice(2) : w));
  return jobs.filter(j => {
    if (wilaya && j.wilaya !== wilaya) return false;
    if (!words.length) return true;
    const hay = norm(`${j.jobTitle} ${j.description}`);
    return words.every(w => hay.includes(w));
  });
}
