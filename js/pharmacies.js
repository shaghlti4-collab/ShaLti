// Pharmacy guide — Google Maps JavaScript API + Places API (New). No database: everything comes live from Google.
import { GOOGLE_MAPS_API_KEY } from './config.js';
import { t, getLang, WILAYAS } from './translations.js';
import { icon, esc, toast, openModal } from './ui.js';

const $ = s => document.querySelector(s);
const BOUNDS = { north: 27.4, south: 14.5, west: -17.2, east: -4.5 };
const inMR = p => p.lat >= BOUNDS.south && p.lat <= BOUNDS.north && p.lng >= BOUNDS.west && p.lng <= BOUNDS.east;
// Keep list fields small (cost): extra details are fetched only when a pharmacy is opened.
const LIST_FIELDS = ['id', 'displayName', 'formattedAddress', 'location', 'nationalPhoneNumber', 'rating', 'userRatingCount', 'businessStatus'];
const DETAIL_FIELDS = ['regularOpeningHours', 'utcOffsetMinutes', 'photos', 'reviews', 'websiteURI', 'googleMapsURI', 'internationalPhoneNumber', 'editorialSummary'];
const RADII = [2000, 5000, 15000, 30000];

const S = { map: null, inited: false, loading: false, user: null, userMk: null, places: [], mk: new Map(), sel: null, radius: 15000,
  mode: 'idle', query: '', error: null, req: 0, Marker: null, lastSearch: null, ready: false };

/* ---------- loader (script is loaded only when the guide is first opened: map loads are billed) ---------- */
let gmPromise = null;
function loadGoogle() {
  if (gmPromise) return gmPromise;
  gmPromise = new Promise((resolve, reject) => {
    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.startsWith('YOUR')) return reject(new Error('missing key'));
    window.__gmReady = () => resolve();
    window.gm_authFailure = () => { S.error = 'key'; showMapError(); renderResults(); };
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&v=weekly&loading=async&libraries=places&language=${getLang()}&region=MR&callback=__gmReady`;
    s.async = true; s.onerror = () => reject(new Error('script failed'));
    document.head.appendChild(s);
  });
  gmPromise.catch(() => { gmPromise = null; });
  return gmPromise;
}

/* ---------- helpers ---------- */
const coord = (o, k) => (typeof o[k] === 'function' ? o[k]() : o[k]);   // LatLng objects use lat()/lng()
const pos = p => ({ lat: coord(p.location, 'lat'), lng: coord(p.location, 'lng') });
const nameOf = p => p.displayName || t('ph.unnamed');
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
const dirHref = p => { const q = pos(p); return `https://www.google.com/maps/dir/?api=1&destination=${q.lat},${q.lng}&destination_place_id=${encodeURIComponent(p.id)}&travelmode=driving`; };
const mapsHref = p => p.googleMapsURI || `https://www.google.com/maps/search/?api=1&query=${pos(p).lat},${pos(p).lng}&query_place_id=${encodeURIComponent(p.id)}`;
const stars = r => `<span class="stars" style="--p:${Math.max(0, Math.min(100, (r / 5) * 100))}%" role="img" aria-label="${r}/5"></span>`;
const distOf = p => (S.user ? distKm(S.user, pos(p)) : null);
const statusChip = p => (p.businessStatus === 'CLOSED_PERMANENTLY' ? `<span class="badge no">${esc(t('ph.closedPerm'))}</span>`
  : p.businessStatus === 'CLOSED_TEMPORARILY' ? `<span class="badge no">${esc(t('ph.closedTemp'))}</span>` : '');

/* ---------- map styling (follows the site theme) ---------- */
const DARK = [{ elementType: 'geometry', stylers: [{ color: '#1b2230' }] }, { elementType: 'labels.text.stroke', stylers: [{ color: '#0d111a' }] }, { elementType: 'labels.text.fill', stylers: [{ color: '#8f99ad' }] },
  { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#3d8bff' }] }, { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2a3448' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1b2230' }] }, { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a4863' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b1220' }] }, { featureType: 'poi', stylers: [{ visibility: 'off' }] }, { featureType: 'transit', stylers: [{ visibility: 'off' }] }];
const LIGHT = [{ featureType: 'poi.business', stylers: [{ visibility: 'off' }] }, { featureType: 'transit', stylers: [{ visibility: 'off' }] }];
const styleFor = () => (document.documentElement.dataset.theme === 'dark' ? DARK : LIGHT);

/* ---------- custom HTML markers (OverlayView: no deprecated Marker, no Map ID needed) ---------- */
function makeMarkerClass() {
  return class extends google.maps.OverlayView {
    constructor(position, el) { super(); this.position = position; this.el = el; }
    onAdd() { this.getPanes().overlayMouseTarget.appendChild(this.el); google.maps.OverlayView.preventMapHitsAndGesturesFrom(this.el); }
    draw() { const pt = this.getProjection()?.fromLatLngToDivPixel(new google.maps.LatLng(this.position)); if (pt) { this.el.style.left = pt.x + 'px'; this.el.style.top = pt.y + 'px'; } }
    onRemove() { this.el.remove(); }
  };
}
function addPin(p, i) {
  const el = document.createElement('button');
  el.type = 'button'; el.className = 'ph-mk'; el.style.setProperty('--i', i); el.setAttribute('aria-label', nameOf(p));
  el.innerHTML = `<span class="ph-pin"><span>${icon('plus', 15)}</span></span>`;
  el.addEventListener('click', () => select(p.id, { pan: false }));
  const m = new S.Marker(pos(p), el); m.setMap(S.map); S.mk.set(p.id, m);
}
function clearPins() { S.mk.forEach(m => m.setMap(null)); S.mk.clear(); }
function placeMe() {
  if (S.userMk) S.userMk.setMap(null);
  const el = document.createElement('div'); el.className = 'ph-me'; el.title = t('ph.you');
  S.userMk = new S.Marker(S.user, el); S.userMk.setMap(S.map);
}

/* ---------- searching ---------- */
async function run(fetcher, mode, title) {
  const id = ++S.req;
  S.loading = true; S.error = null; S.mode = mode; S.query = title || ''; $('#ph-loading').hidden = false; $('#ph-area').hidden = true; renderResults();
  try {
    let places = await fetcher();
    if (id !== S.req) return;
    places = (places || []).filter(p => p.location && inMR(pos(p)));
    if (S.user) places.sort((a, b) => distOf(a) - distOf(b));
    S.places = places; S.sel = null;
  } catch (e) { console.error(e); if (id === S.req) { S.places = []; S.error = 'search'; } }
  if (id !== S.req) return;
  S.loading = false; $('#ph-loading').hidden = true;
  renderResults(); drawPins(true);
}
async function nearby(center, radius, mode) {
  const { Place } = await google.maps.importLibrary('places');
  S.lastSearch = { center, radius };
  return run(async () => (await Place.searchNearby({ fields: LIST_FIELDS, locationRestriction: { center, radius }, includedTypes: ['pharmacy'], maxResultCount: 20, rankPreference: 'DISTANCE', language: getLang(), region: 'MR' })).places, mode);
}
async function textSearch(text, title) {
  const { Place } = await google.maps.importLibrary('places');
  const q = /pharmacie|pharmacy|صيدلي|صيدليات/i.test(text) ? text : `${text} pharmacie`;
  const where = S.user ? { locationBias: { center: S.user, radius: 30000 } } : { locationRestriction: new google.maps.LatLngBounds({ lat: BOUNDS.south, lng: BOUNDS.west }, { lat: BOUNDS.north, lng: BOUNDS.east }) };
  return run(async () => (await Place.searchByText({ textQuery: q, fields: LIST_FIELDS, includedType: 'pharmacy', maxResultCount: 20, language: getLang(), region: 'MR', ...where })).places, 'search', title);
}
function doSearch() {
  const q = $('#ph-q').value.trim();
  if (!q) return $('#ph-q').focus();
  $('#ph-wilaya').value = '';
  textSearch(q, q);
}
function onWilaya() {
  const id = $('#ph-wilaya').value; if (!id) return;
  const w = WILAYAS.find(x => x.id === id);
  $('#ph-q').value = '';
  textSearch(`pharmacie ${w.fr}`, w[getLang()]);
}
function searchArea() {
  const b = S.map.getBounds(), c = S.map.getCenter(); if (!b) return;
  const center = { lat: c.lat(), lng: c.lng() }, ne = b.getNorthEast();
  const radius = Math.max(500, Math.min(50000, distKm(center, { lat: ne.lat(), lng: ne.lng() }) * 1000));
  nearby(center, radius, 'area');
}

/* ---------- rendering ---------- */
function fillSelects() {
  const w = $('#ph-wilaya'), v = w.value;
  w.innerHTML = `<option value="">${esc(t('jobs.allWilayas'))}</option>` + WILAYAS.map(x => `<option value="${x.id}">${esc(x[getLang()])}</option>`).join('');
  w.value = v;
  $('#ph-radius').innerHTML = RADII.map(r => `<button type="button" data-r="${r}" class="${r === S.radius ? 'on' : ''}">${r / 1000} ${esc(t('ph.km'))}</button>`).join('');
}
const skeleton = n => Array.from({ length: n }, () => '<div class="ph-card skeleton"><div class="sk" style="height:18px;width:50%"></div><div class="sk" style="height:12px;margin:12px 0 8px"></div><div class="sk" style="height:32px;margin-top:14px"></div></div>').join('');
const box = (ico, title, sub, extra = '') => `<div class="empty"><div class="ei">${icon(ico, 28)}</div><b>${esc(title)}</b><span>${esc(sub)}</span>${extra}</div>`;

function card(p) {
  const d = distOf(p), ph = p.nationalPhoneNumber;
  return `<article class="ph-card ${S.sel === p.id ? 'sel' : ''}" data-pid="${esc(p.id)}" tabindex="0" role="button">
    <div class="ph-card-top"><span class="ph-av">${icon('pill', 20)}</span><div style="flex:1;min-width:0"><h3>${esc(nameOf(p))}</h3><p class="ph-addr">${esc(p.formattedAddress || t('ph.noAddress'))}</p></div>
    ${d != null ? `<span class="chip">${icon('locate', 13)}≈ ${esc(fmtDist(d))}</span>` : ''}</div>
    <div class="ph-meta">${p.rating ? `${stars(p.rating)}<span>${p.rating.toFixed(1)} · ${esc(t('ph.ratings', { n: p.userRatingCount || 0 }))}</span>` : ''}${statusChip(p)}</div>
    <div class="jc-foot ph-foot"><a class="btn btn-primary btn-sm" href="${esc(dirHref(p))}" target="_blank" rel="noopener">${icon('nav', 15)}${esc(t('ph.directions'))}</a>
      ${ph ? `<a class="btn btn-ghost btn-sm" href="${esc(telHref(ph))}">${icon('phone', 15)}${esc(t('ph.call'))}</a>` : ''}</div></article>`;
}
function renderResults() {
  const list = $('#ph-list'), title = $('#ph-title'), count = $('#ph-count');
  title.textContent = S.mode === 'nearby' ? t('ph.titleNearby') : S.mode === 'search' ? t('ph.titleSearch', { q: S.query }) : S.mode === 'area' ? t('ph.titleArea') : t('ph.titleIdle');
  count.textContent = S.places.length && !S.loading ? t('ph.count', { n: S.places.length }) : '';
  if (S.error === 'key') { list.innerHTML = box('alert', t('ph.error'), t('ph.keyError')); return; }
  if (S.loading) { list.innerHTML = skeleton(3); return; }
  if (S.error) { list.innerHTML = box('alert', t('ph.error'), t('ph.errorSub'), `<button class="btn btn-ghost btn-sm" data-ph-retry>${esc(t('jobs.retry'))}</button>`); return; }
  if (S.mode === 'idle') { list.innerHTML = box('locate', t('ph.startTitle'), t('ph.startSub'), `<button class="btn btn-primary btn-sm" data-ph-locate>${icon('locate', 16)}${esc(t('ph.locate'))}</button>`); return; }
  list.innerHTML = S.places.length ? S.places.map(card).join('') : box('search', t('ph.emptyTitle'), t('ph.emptySub'));
  renderPeek();
}
function drawPins(fit) {
  if (!S.map) return;
  clearPins();
  const b = new google.maps.LatLngBounds();
  S.places.forEach((p, i) => { addPin(p, i); b.extend(pos(p)); });
  if (S.user) b.extend(S.user);
  if (fit && S.places.length) {
    S.progr = true;
    if (S.places.length === 1) { S.map.setCenter(pos(S.places[0])); S.map.setZoom(16); } else S.map.fitBounds(b, { top: 60, bottom: 90, left: 70, right: 30 });
    setTimeout(() => { S.progr = false; }, 800);
  }
}
function renderPeek() {
  const el = $('#ph-peek'), p = S.sel && S.places.find(x => x.id === S.sel);
  if (!p) { el.hidden = true; return; }
  const d = distOf(p);
  el.hidden = false;
  el.innerHTML = `<button class="peek-x" type="button" data-ph-peek-x aria-label="${esc(t('common.close'))}">${icon('x', 14)}</button>
    <div class="ph-peek-body" data-ph-detail="${esc(p.id)}"><b>${esc(nameOf(p))}</b><small>${esc(p.formattedAddress || '')}</small>
    <div class="ph-meta">${p.rating ? `${stars(p.rating)}<span>${p.rating.toFixed(1)}</span>` : ''}${d != null ? `<span>≈ ${esc(fmtDist(d))}</span>` : ''}${statusChip(p)}</div></div>
    <div class="ph-peek-actions"><a class="btn btn-primary btn-sm" href="${esc(dirHref(p))}" target="_blank" rel="noopener">${icon('nav', 15)}${esc(t('ph.directions'))}</a>
    <button class="btn btn-ghost btn-sm" type="button" data-ph-detail="${esc(p.id)}">${esc(t('ph.details'))}</button></div>`;
}
function select(id, { pan = true } = {}) {
  S.sel = id;
  S.mk.forEach((m, k) => m.el.classList.toggle('sel', k === id));
  document.querySelectorAll('.ph-card').forEach(c => c.classList.toggle('sel', c.dataset.pid === id));
  const p = S.places.find(x => x.id === id);
  if (p && pan && S.map) { S.progr = true; S.map.panTo(pos(p)); if (S.map.getZoom() < 15) S.map.setZoom(16); setTimeout(() => { S.progr = false; }, 800); }
  renderPeek();
}

/* ---------- details sheet ---------- */
async function openSheet(id) {
  const p = S.places.find(x => x.id === id); if (!p) return;
  select(id, { pan: true });
  const d = distOf(p), ph = p.nationalPhoneNumber;
  const row = (ico, label, v) => (v ? `<div>${icon(ico, 18)}<span><small>${esc(label)}</small>${v}</span></div>` : '');
  const m = openModal({
    title: nameOf(p),
    html: `<div class="ph-hero" id="ph-hero">${icon('pill', 56)}</div>
      <div class="ph-badges" id="ph-badges">${p.rating ? `<span class="rate">${stars(p.rating)}<b>${p.rating.toFixed(1)}</b> (${esc(t('ph.ratings', { n: p.userRatingCount || 0 }))})</span>` : ''}${statusChip(p)}${d != null ? `<span class="chip">${icon('locate', 13)}≈ ${esc(fmtDist(d))}</span>` : ''}</div>
      <div class="detail-grid">${row('pin', t('ph.address'), esc(p.formattedAddress || t('ph.noAddress')))}${row('phone', t('ph.phone'), ph ? `<a dir="ltr" href="${esc(telHref(ph))}">${esc(ph)}</a>` : '')}</div>
      <div class="modal-actions"><a class="btn btn-primary" href="${esc(dirHref(p))}" target="_blank" rel="noopener">${icon('nav', 18)}${esc(t('ph.directions'))}</a>
        ${ph ? `<a class="btn btn-ghost" href="${esc(telHref(ph))}">${icon('phone', 16)}${esc(t('ph.call'))}</a>` : ''}</div>
      <div id="ph-more"><div class="sk" style="height:14px;margin:18px 0 8px;width:40%"></div><div class="sk" style="height:60px"></div><p class="ph-note">${esc(t('ph.loadingDetails'))}</p></div>`
  });
  m.el.querySelector('.modal').classList.add('ph-sheet');
  try {
    await p.fetchFields({ fields: DETAIL_FIELDS });
    if (!document.body.contains(m.el)) return;
    let open;
    try { open = await p.isOpen(); } catch { open = undefined; }
    fillSheet(m.el, p, open);
  } catch (e) {
    console.warn(e);
    const more = m.el.querySelector('#ph-more'); if (more) more.innerHTML = `<p class="ph-note">${esc(t('ph.detailsFail'))}</p>`;
  }
}
function fillSheet(el, p, open) {
  const hero = el.querySelector('#ph-hero'), badges = el.querySelector('#ph-badges'), more = el.querySelector('#ph-more');
  const photo = p.photos && p.photos[0];
  if (photo && hero) {
    const img = new Image(); img.alt = nameOf(p); img.loading = 'lazy';
    img.onload = () => { hero.innerHTML = ''; hero.appendChild(img); const by = photo.authorAttributions?.[0]?.displayName; if (by) hero.insertAdjacentHTML('beforeend', `<span class="ph-credit">${esc(t('ph.photoBy', { name: by }))}</span>`); };
    img.src = photo.getURI({ maxWidth: 900 });
  }
  if (open !== undefined && badges && p.businessStatus !== 'CLOSED_PERMANENTLY' && p.businessStatus !== 'CLOSED_TEMPORARILY')
    badges.insertAdjacentHTML('afterbegin', `<span class="badge ${open ? 'ok' : 'no'}">${esc(t(open ? 'ph.openNow' : 'ph.closedNow'))}</span>`);
  const today = (new Date().getDay() + 6) % 7;   // Google lists Monday first
  const hrs = p.regularOpeningHours?.weekdayDescriptions;
  const revs = (p.reviews || []).slice(0, 3);
  const share = `<button type="button" class="btn btn-ghost" data-ph-share>${icon('mail', 16)}${esc(t('ph.share'))}</button>`;
  more.innerHTML = `${p.editorialSummary ? `<p class="ph-sum">${esc(String(p.editorialSummary))}</p>` : ''}
    ${hrs?.length ? `<div class="ph-sec"><h4>${esc(t('ph.hours'))}</h4><ul class="ph-hours">${hrs.map((h, i) => { const k = h.indexOf(':'); return `<li class="${i === today ? 'today' : ''}"><span>${esc(h.slice(0, k))}</span><span dir="ltr">${esc(h.slice(k + 1).trim())}</span></li>`; }).join('')}</ul></div>` : ''}
    ${revs.length ? `<div class="ph-sec"><h4>${esc(t('ph.reviews'))}</h4>${revs.map(r => `<div class="ph-rev"><header><b>${esc(r.authorAttribution?.displayName || '')}</b><span>${stars(r.rating || 0)} ${esc(r.relativePublishTimeDescription || '')}</span></header>${r.text ? `<p>${esc(String(r.text))}</p>` : ''}</div>`).join('')}</div>` : ''}
    <div class="modal-actions sec"><a class="btn btn-ghost" href="${esc(mapsHref(p))}" target="_blank" rel="noopener">${icon('map', 16)}${esc(t('ph.openMaps'))}</a>
      ${p.websiteURI ? `<a class="btn btn-ghost" href="${esc(p.websiteURI)}" target="_blank" rel="noopener">${icon('globe', 16)}${esc(t('ph.website'))}</a>` : ''}${share}</div>`;
  more.querySelector('[data-ph-share]').onclick = async () => {
    const url = mapsHref(p);
    try { if (navigator.share) await navigator.share({ title: nameOf(p), url }); else { await navigator.clipboard.writeText(url); toast(t('ph.copied'), 'success'); } } catch (e) { /* cancelled */ }
  };
}

/* ---------- geolocation ---------- */
function locate(silent = false) {
  if (!S.map) return;
  if (!navigator.geolocation) return silent || toast(t('ph.geoUnsupported'), 'error');
  const b = $('#ph-locate'); b.disabled = true; b.classList.add('on');
  navigator.geolocation.getCurrentPosition(async g => {
    b.disabled = false; b.classList.remove('on');
    const u = { lat: g.coords.latitude, lng: g.coords.longitude };
    if (!inMR(u)) { toast(t('ph.outside'), 'info'); return showCountry(); }
    S.user = u; placeMe(); S.progr = true; S.map.setCenter(u); S.map.setZoom(14); setTimeout(() => { S.progr = false; }, 800);
    $('#ph-wilaya').value = ''; $('#ph-q').value = '';
    nearby(u, S.radius, 'nearby');
  }, err => { b.disabled = false; b.classList.remove('on'); if (!silent) toast(t(err.code === 1 ? 'ph.geoDenied' : 'ph.geoFail'), 'info'); },
  { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 });
}
function showCountry() {
  if (!S.map) return;
  S.progr = true;
  S.map.fitBounds({ south: BOUNDS.south, west: BOUNDS.west, north: BOUNDS.north, east: BOUNDS.east });
  setTimeout(() => { S.progr = false; }, 800);
}
function showMapError() { const e = $('#ph-maperr'); e.textContent = t('ph.keyError'); e.hidden = false; }

/* ---------- init ---------- */
function toggleExpand(on) {
  const w = $('#ph-mapwrap'); const next = on ?? !w.classList.contains('full');
  w.classList.toggle('full', next); document.body.style.overflow = next ? 'hidden' : '';
  $('#ph-expand').innerHTML = icon(next ? 'shrink' : 'expand', 20);
  $('#ph-expand').setAttribute('aria-label', t(next ? 'ph.collapse' : 'ph.expand'));
  if (S.map) setTimeout(() => google.maps.event.trigger(S.map, 'resize'), 80);
}
function bind() {
  $('#ph-go').onclick = doSearch;
  $('#ph-q').addEventListener('keydown', e => { if (e.key === 'Enter') doSearch(); });
  $('#ph-wilaya').addEventListener('change', onWilaya);
  $('#ph-radius').addEventListener('click', e => {
    const b = e.target.closest('[data-r]'); if (!b) return;
    S.radius = +b.dataset.r; fillSelects();
    if (S.user && S.mode === 'nearby') nearby(S.user, S.radius, 'nearby');
  });
  $('#ph-locate').onclick = () => locate(false);
  $('#ph-country').onclick = showCountry;
  $('#ph-expand').onclick = () => toggleExpand();
  $('#ph-area').onclick = searchArea;
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#ph-mapwrap').classList.contains('full') && !document.querySelector('.overlay')) toggleExpand(false); });
  document.addEventListener('click', e => {
    if (e.target.closest('[data-ph-retry]')) return S.lastSearch ? nearby(S.lastSearch.center, S.lastSearch.radius, S.mode === 'area' ? 'area' : 'nearby') : doSearch();
    if (e.target.closest('[data-ph-locate]')) return locate(false);
    if (e.target.closest('[data-ph-peek-x]')) { S.sel = null; S.mk.forEach(m => m.el.classList.remove('sel')); return renderPeek(); }
    const d = e.target.closest('[data-ph-detail]'); if (d) return openSheet(d.dataset.phDetail);
    if (e.target.closest('a')) return;
    const c = e.target.closest('.ph-card[data-pid]'); if (c) openSheet(c.dataset.pid);
  });
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('.ph-card[data-pid]')) { e.preventDefault(); openSheet(e.target.dataset.pid); } });
  new MutationObserver(() => S.map && S.map.setOptions({ styles: styleFor() })).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}
async function initMap() {
  await loadGoogle();
  const { Map } = await google.maps.importLibrary('maps');
  await google.maps.importLibrary('places');
  S.map = new Map($('#ph-map'), { center: { lat: 20.5, lng: -10.5 }, zoom: 5, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, zoomControl: true,
    clickableIcons: false, gestureHandling: 'greedy', restriction: { latLngBounds: BOUNDS, strictBounds: false }, styles: styleFor() });
  S.Marker = makeMarkerClass();
  const reveal = () => { if (!S.progr && S.mode !== 'idle' && !S.loading) $('#ph-area').hidden = false; };
  S.map.addListener('dragend', reveal); S.map.addListener('zoom_changed', reveal);
  S.map.addListener('click', () => { if (S.sel) { S.sel = null; S.mk.forEach(m => m.el.classList.remove('sel')); renderPeek(); } });
}
export async function renderPharmacies() {
  fillSelects();
  if (!S.inited) {
    S.inited = true; bind(); renderResults();
    try { await initMap(); } catch (e) { console.error(e); S.error = 'key'; showMapError(); renderResults(); return; }
    // Ask for the location automatically only if the user already granted it; otherwise show a clear call-to-action.
    try { const st = await navigator.permissions?.query({ name: 'geolocation' }); if (st && st.state === 'granted') locate(true); } catch (e) { /* unsupported */ }
  } else { renderResults(); renderPeek(); }
  setTimeout(() => S.map && google.maps.event.trigger(S.map, 'resize'), 80);
}
