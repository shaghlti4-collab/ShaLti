import { db } from './firebase-config.js';
import { collection, query, where, limit, startAfter, getDocs } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { t, getLang, WILAYAS, wName } from './translations.js';
import { icon, esc, toast, openModal } from './ui.js';
import { norm } from './search.js';

const $ = s => document.querySelector(s);
const PAGE = 50;
const S = { items: [], cursor: null, hasMore: false, loading: false, error: false, user: null, mgh: new Set(),
  map: null, layer: null, markers: new Map(), me: null, inited: false, req: 0 };

/* ---------- helpers ---------- */
const hasPos = p => Number.isFinite(p.latitude) && Number.isFinite(p.longitude);
const splitWords = s => norm(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean).map(w => (w.length > 3 && w.startsWith('ال') ? w.slice(2) : w));
const firstWord = q => (splitWords(q).find(w => w.length >= 2) || '').slice(0, 20);
const locText = p => [p.wilaya ? wName(p.wilaya) : '', p.moughataa, p.neighborhood].filter(Boolean).join(' · ');
function distKm(a, b) {
  const R = 6371, r = x => x * Math.PI / 180, dLa = r(b.lat - a.lat), dLn = r(b.lng - a.lng);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLn / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
const fmtDist = d => (d < 1 ? `${Math.max(10, Math.round(d * 100) * 10)} ${t('ph.m')}` : `${d.toFixed(d < 10 ? 1 : 0)} ${t('ph.km')}`);
function telHref(phone) {
  let d = String(phone).replace(/[^\d+]/g, '');
  if (d.startsWith('00')) d = '+' + d.slice(2);
  else if (!d.startsWith('+') && d.startsWith('222') && d.length >= 11) d = '+' + d;
  else if (!d.startsWith('+') && d.length === 8) d = '+222' + d;
  return 'tel:' + d;
}
const dirHref = p => (/iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document
  ? `https://maps.apple.com/?daddr=${p.latitude},${p.longitude}`
  : `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}&travelmode=driving`);
const fmtDate = ts => (ts?.toDate ? new Intl.DateTimeFormat(getLang() === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(ts.toDate()) : '');

/* ---------- filters ---------- */
const readF = () => ({ q: $('#ph-q').value, wilaya: $('#ph-wilaya').value, mgh: $('#ph-mgh').value, status: $('#ph-status').value });
function match(p, f) {
  if (f.wilaya && p.wilaya !== f.wilaya) return false;
  if (f.mgh && p.moughataa !== f.mgh) return false;
  if (f.status && p.status !== f.status) return false;
  const words = splitWords(f.q);
  if (!words.length) return true;
  const w = WILAYAS.find(x => x.id === p.wilaya);
  const hay = norm([p.name, p.moughataa, p.neighborhood, p.address, w?.ar, w?.fr].filter(Boolean).join(' '));
  return words.every(x => hay.includes(x));
}
function constraints(f) {
  const w = firstWord(f.q);
  if (w) return [where('keywords', 'array-contains', w)];   // server-side text search (word prefixes stored at import)
  const c = [];
  if (f.wilaya) c.push(where('wilaya', '==', f.wilaya));
  if (f.status) c.push(where('status', '==', f.status));
  if (f.mgh) c.push(where('moughataa', '==', f.mgh));
  return c;
}
function shown() {
  const f = readF();
  const l = S.items.filter(p => hasPos(p) && match(p, f));
  return S.user ? l.sort((a, b) => a.dist - b.dist).slice(0, 100) : l.sort((a, b) => String(a.name).localeCompare(String(b.name), getLang()));
}

/* ---------- data (paginated, never the whole collection) ---------- */
async function fetchBrowse(id, f, want) {
  for (let pages = 0; pages < 6; pages++) {
    const q = query(collection(db, 'pharmacies'), ...constraints(f), ...(S.cursor ? [startAfter(S.cursor)] : []), limit(PAGE));
    const snap = await getDocs(q);
    if (id !== S.req) return;
    snap.docs.forEach(d => S.items.push({ id: d.id, ...d.data() }));
    if (snap.docs.length) S.cursor = snap.docs[snap.docs.length - 1];
    S.hasMore = snap.size === PAGE;
    if (!S.hasMore || S.items.filter(p => match(p, f)).length >= want) break;
  }
}
async function fetchNearby(id, f) {
  const { lat, lng } = S.user;
  let res = [];
  for (const r of [0.3, 1, 3]) {   // latitude band ≈ 33 km, 111 km, 333 km
    const snap = await getDocs(query(collection(db, 'pharmacies'), where('latitude', '>=', lat - r), where('latitude', '<=', lat + r), limit(400)));
    if (id !== S.req) return;
    res = snap.docs.map(d => ({ id: d.id, ...d.data() })).filter(hasPos).map(p => ({ ...p, dist: distKm(S.user, { lat: p.latitude, lng: p.longitude }) }));
    if (res.filter(p => p.dist <= r * 111 && match(p, f)).length >= 10) break;
  }
  S.items = res; S.hasMore = false;
}
async function load(reset) {
  const id = ++S.req, f = readF();
  if (reset) { S.items = []; S.cursor = null; S.hasMore = false; }
  S.error = false; S.loading = true; renderList();
  const want = (reset ? 0 : S.items.filter(p => match(p, f)).length) + PAGE;
  try { if (S.user) await fetchNearby(id, f); else await fetchBrowse(id, f, want); }
  catch (e) { console.error(e); if (id === S.req) S.error = true; }
  if (id !== S.req) return;
  S.loading = false;
  S.items.forEach(p => { if (p.moughataa && (!f.wilaya || p.wilaya === f.wilaya)) S.mgh.add(p.moughataa); });
  fillSelects(); renderList(); updateMap(reset);
}

/* ---------- UI ---------- */
export function fillSelects() {
  const w = $('#ph-wilaya'), m = $('#ph-mgh'), s = $('#ph-status');
  const wv = w.value, mv = m.value, sv = s.value;
  w.innerHTML = `<option value="">${esc(t('jobs.allWilayas'))}</option>` + WILAYAS.map(x => `<option value="${x.id}">${esc(x[getLang()])}</option>`).join('');
  w.value = wv;
  m.innerHTML = `<option value="">${esc(t('ph.allMoughataa'))}</option>` + [...S.mgh].sort((a, b) => a.localeCompare(b, getLang())).map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('');
  m.value = mv;
  s.innerHTML = `<option value="">${esc(t('ph.allStatus'))}</option>` + ['active', 'closed'].map(x => `<option value="${x}">${esc(t('ph.status.' + x))}</option>`).join('');
  s.value = sv;
}
function paintLocate() {
  const b = $('#ph-locate-t'); if (b) b.textContent = t(S.user ? 'ph.locateOff' : 'ph.locate');
}
const skeleton = n => Array.from({ length: n }, () => '<div class="ph-card skeleton"><div class="sk" style="height:18px;width:50%"></div><div class="sk" style="height:12px;margin:12px 0 8px"></div><div class="sk" style="height:32px;margin-top:14px"></div></div>').join('');
const empty = (ico, title, sub, extra = '') => `<div class="empty"><div class="ei">${icon(ico, 28)}</div><b>${esc(title)}</b><span>${esc(sub)}</span>${extra}</div>`;

function card(p) {
  return `<article class="ph-card" data-pid="${esc(p.id)}" tabindex="0" role="button">
    <div class="jc-top"><h3>${esc(p.name)}</h3>${p.dist != null ? `<span class="chip">${icon('locate', 13)}≈ ${esc(fmtDist(p.dist))}</span>` : ''}</div>
    ${locText(p) ? `<p class="ph-loc">${icon('pin', 14)}<span>${esc(locText(p))}</span></p>` : ''}
    ${p.phone ? `<p class="ph-loc">${icon('phone', 14)}<span dir="ltr">${esc(p.phone)}</span></p>` : ''}
    <div class="jc-foot ph-foot">
      <button type="button" class="btn btn-ghost btn-sm" data-ph-map="${esc(p.id)}">${icon('map', 15)}${esc(t('ph.showOnMap'))}</button>
      <button type="button" class="btn btn-ghost btn-sm" data-ph-detail="${esc(p.id)}">${esc(t('ph.details'))}</button>
      ${p.phone ? `<a class="btn btn-primary btn-sm" href="${esc(telHref(p.phone))}">${icon('phone', 15)}${esc(t('ph.call'))}</a>` : ''}
    </div></article>`;
}
function renderList() {
  const list = $('#ph-list'), count = $('#ph-count'), more = $('#ph-more');
  more.hidden = true;
  if (S.loading && !S.items.length) { count.textContent = t('common.loading'); list.innerHTML = skeleton(3); return; }
  if (S.error) { count.textContent = ''; list.innerHTML = empty('alert', t('ph.loadError'), t('jobs.loadErrorSub'), `<button class="btn btn-ghost btn-sm" data-ph-retry>${esc(t('jobs.retry'))}</button>`); return; }
  const l = shown(), f = readF();
  const filtered = f.q.trim() || f.wilaya || f.mgh || f.status;
  count.textContent = l.length ? t('ph.count', { n: l.length + (S.hasMore ? '+' : '') }) : '';
  list.innerHTML = l.length ? l.map(card).join('') : (!S.items.length && !filtered && !S.user ? empty('pill', t('ph.noneTitle'), t('ph.noneSub')) : empty('search', t('ph.emptyTitle'), t('ph.emptySub')));
  more.hidden = !S.hasMore; more.disabled = S.loading;
}

/* ---------- map ---------- */
function initMap() {
  if (S.map) return;
  if (typeof L === 'undefined') { $('#ph-map').hidden = true; $('#ph-map-err').hidden = false; return; }
  S.map = L.map('ph-map').setView([20.3, -10.5], 5);
  let failed = 0;
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' })
    .on('tileerror', () => { if (++failed === 6) toast(t('ph.mapError'), 'error'); }).addTo(S.map);
  S.layer = L.layerGroup().addTo(S.map);
}
const pinIcon = () => L.divIcon({ className: 'ph-pin-wrap', iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28],
  html: `<div class="ph-pin"><span>${icon('plus', 16)}</span></div>` });
function updateMap(fit = true) {
  if (!S.map) return;
  S.layer.clearLayers(); S.markers.clear();
  const pts = [];
  shown().slice(0, 400).forEach(p => {
    const m = L.marker([p.latitude, p.longitude], { icon: pinIcon(), title: p.name })
      .bindPopup(`<div class="ph-pop"><b>${esc(p.name)}</b>${locText(p) ? `<div>${esc(locText(p))}</div>` : ''}${p.phone ? `<div dir="ltr">${esc(p.phone)}</div>` : ''}<button type="button" class="btn btn-primary btn-sm" data-ph-detail="${esc(p.id)}">${esc(t('ph.details'))}</button></div>`)
      .addTo(S.layer);
    S.markers.set(p.id, m); pts.push([p.latitude, p.longitude]);
  });
  if (S.user) pts.push([S.user.lat, S.user.lng]);
  if (fit && pts.length) S.map.fitBounds(pts, { padding: [30, 30], maxZoom: 15 });
}
function placeMe() {
  if (!S.map) return;
  if (S.me) S.me.remove();
  S.me = L.circleMarker([S.user.lat, S.user.lng], { radius: 9, color: '#fff', weight: 3, fillColor: '#3d8bff', fillOpacity: 1 }).addTo(S.map).bindTooltip(t('ph.you'));
}
function showOnMap(id) {
  const p = S.items.find(x => x.id === id), m = S.markers.get(id);
  if (!p || !S.map || !m) return;
  $('#ph-map').scrollIntoView({ behavior: 'smooth', block: 'center' });
  S.map.flyTo([p.latitude, p.longitude], 16, { duration: 0.8 });
  setTimeout(() => m.openPopup(), 850);
}

/* ---------- details ---------- */
function openDetail(id) {
  const p = S.items.find(x => x.id === id); if (!p) return;
  const row = (ico, label, val) => (val ? `<div>${icon(ico, 18)}<span><small>${esc(label)}</small>${val}</span></div>` : '');
  const ver = p.verificationStatus ? `<span class="badge ${p.verificationStatus === 'verified' ? 'ok' : 'no'}">${esc(t('ph.ver.' + p.verificationStatus))}</span>` : '';
  const st = p.status && p.status !== 'unknown' ? `<span class="badge ${p.status === 'active' ? 'ok' : 'no'}">${esc(t('ph.status.' + p.status))}</span>` : '';
  openModal({
    title: p.name,
    html: `<div class="detail-grid">
      ${row('phone', t('ph.phone'), p.phone ? `<a dir="ltr" href="${esc(telHref(p.phone))}">${esc(p.phone)}</a>` : '')}
      ${row('pin', t('job.wilaya'), p.wilaya ? esc(wName(p.wilaya)) : '')}
      ${row('pin', t('ph.moughataa'), esc(p.moughataa))}${row('pin', t('ph.neighborhood'), esc(p.neighborhood))}${row('map', t('ph.address'), esc(p.address))}
      ${row('locate', t('ph.coords'), `<span dir="ltr">${p.latitude.toFixed(5)}, ${p.longitude.toFixed(5)}</span>`)}
      ${row('clock', t('ph.hours'), esc(p.openingHours))}
      ${row('check', t('ph.statusL') + ' / ' + t('ph.verL'), `${st} ${ver}`.trim())}
      ${row('mail', t('ph.sourceL'), esc(p.source))}${row('calendar', t('ph.updated'), esc(fmtDate(p.updatedAt)))}</div>
      <div class="modal-actions"><a class="btn btn-primary" href="${esc(dirHref(p))}" target="_blank" rel="noopener">${icon('nav', 18)}${esc(t('ph.directions'))}</a>
      ${p.phone ? `<a class="btn btn-ghost" href="${esc(telHref(p.phone))}">${icon('phone', 16)}${esc(t('ph.call'))}</a>` : ''}</div>`
  });
}

/* ---------- geolocation ---------- */
function locate() {
  if (S.user) { S.user = null; if (S.me) { S.me.remove(); S.me = null; } paintLocate(); return load(true); }
  if (!navigator.geolocation) return toast(t('ph.geoUnsupported'), 'error');
  const btn = $('#ph-locate'); btn.disabled = true; $('#ph-locate-t').textContent = t('ph.locating');
  navigator.geolocation.getCurrentPosition(pos => {
    S.user = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    btn.disabled = false; paintLocate(); placeMe(); load(true);
  }, err => {
    btn.disabled = false; paintLocate();
    toast(t(err.code === 1 ? 'ph.geoDenied' : 'ph.geoFail'), 'info');   // manual search keeps working
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
}

/* ---------- init ---------- */
function bind() {
  let timer;
  $('#ph-q').addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => load(true), 350); });
  $('#ph-wilaya').addEventListener('change', () => { S.mgh = new Set(); $('#ph-mgh').value = ''; load(true); });
  $('#ph-mgh').addEventListener('change', () => load(true));
  $('#ph-status').addEventListener('change', () => load(true));
  $('#ph-locate').addEventListener('click', locate);
  $('#ph-more').addEventListener('click', () => load(false));
  document.addEventListener('click', e => {
    if (e.target.closest('[data-ph-retry]')) return load(true);
    const d = e.target.closest('[data-ph-detail]'); if (d) return openDetail(d.dataset.phDetail);
    const m = e.target.closest('[data-ph-map]'); if (m) return showOnMap(m.dataset.phMap);
    if (e.target.closest('a')) return;
    const c = e.target.closest('.ph-card[data-pid]'); if (c) showOnMap(c.dataset.pid);
  });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('.ph-card[data-pid]')) { e.preventDefault(); showOnMap(e.target.dataset.pid); }
  });
}
export function renderPharmacies() {
  fillSelects(); paintLocate();
  if (!S.inited) { S.inited = true; bind(); initMap(); load(true); }
  else { renderList(); updateMap(false); }
  setTimeout(() => S.map && S.map.invalidateSize(), 60);
}
