import { auth } from './firebase-config.js';
import { t, getLang, wName, dName, WILAYAS, DAYS } from './translations.js';
import { icon, esc, toast, openModal, setButtonLoading } from './ui.js';
import { fetchJobs, fetchMyJobs, addJob, removeJob, ensureUserDoc } from './database.js';
import { filterJobs } from './search.js';
import { resendVerification, refreshUser, errorMessage } from './auth.js';

const $ = s => document.querySelector(s);
const state = { jobs: [], status: 'idle', q: '', wilaya: '', mine: [], mineStatus: 'idle' };

/* ---------- helpers ---------- */
const fmtDate = ts => {
  const d = ts?.toDate ? ts.toDate() : null;
  if (!d) return '';
  return new Intl.DateTimeFormat(getLang() === 'ar' ? 'ar-u-nu-latn' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
};
const salaryText = n => `${Number(n).toLocaleString('en-US')} ${t('job.currency')}`;
const daysText = days => (days?.[0] === 'daily' ? t('job.daily') : (days || []).map(dName).join(getLang() === 'ar' ? '، ' : ', '));
const periodText = p => t(`job.period.${p}`);
const waLink = j => `https://wa.me/222${j.phoneNumber}?text=${encodeURIComponent(t('job.waText', { title: j.jobTitle }))}`;
export function normalizePhone(v) {
  let d = String(v).replace(/[\s\-().]/g, '').replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c));
  if (d.length > 8) d = d.replace(/^(\+|00)?222/, '');
  return d;
}

/* ---------- rendering ---------- */
const skeletons = n => Array.from({ length: n }, () => `<div class="job-card skeleton"><div class="sk" style="height:18px;width:55%"></div><div class="sk" style="height:12px;margin:12px 0 8px"></div><div class="sk" style="height:12px;width:70%"></div><div class="sk" style="height:34px;margin-top:16px"></div></div>`).join('');
const emptyBox = (ico, title, sub, extra = '') => `<div class="empty"><div class="ei">${icon(ico, 28)}</div><b>${esc(title)}</b><span>${esc(sub)}</span>${extra}</div>`;

function jobCard(j, mine = false) {
  return `<article class="job-card" data-id="${esc(j.id)}" tabindex="0" role="button">
    <div class="jc-top"><h3>${esc(j.jobTitle)}</h3><span class="chip">${icon('pin', 13)}${esc(wName(j.wilaya))}</span></div>
    <p class="jc-desc">${esc(j.description)}</p>
    <ul class="jc-meta"><li>${icon('clock', 15)}${esc(periodText(j.workPeriod))}</li><li>${icon('calendar', 15)}${esc(daysText(j.workDays))}</li><li class="salary">${icon('wallet', 15)}${esc(salaryText(j.salary))}</li></ul>
    <div class="jc-foot"><span class="jc-date">${esc(fmtDate(j.createdAt))}</span>
      ${mine ? `<button type="button" class="btn btn-ghost btn-sm" data-del="${esc(j.id)}">${icon('trash', 15)}${esc(t('job.delete'))}</button>`
             : `<a class="btn btn-wa btn-sm" href="${esc(waLink(j))}" target="_blank" rel="noopener">${icon('whatsapp', 16)}${esc(t('job.contact'))}</a>`}</div>
  </article>`;
}

export function renderHome() {
  const list = $('#home-list'), stat = $('#home-count');
  if (state.status === 'loading' || state.status === 'idle') { list.innerHTML = skeletons(2); stat.textContent = ''; return; }
  if (state.status === 'error') { list.innerHTML = emptyBox('alert', t('jobs.loadError'), t('jobs.loadErrorSub'), `<button class="btn btn-ghost btn-sm" data-retry>${esc(t('jobs.retry'))}</button>`); stat.textContent = ''; return; }
  stat.innerHTML = state.jobs.length ? t('home.count', { n: `<b>${state.jobs.length}</b>` }) : esc(t('home.countNone'));
  list.innerHTML = state.jobs.length ? state.jobs.slice(0, 3).map(j => jobCard(j)).join('') : emptyBox('briefcase', t('jobs.noneTitle'), t('jobs.noneSub'));
}

export function renderJobs() {
  const list = $('#jobs-list'), count = $('#jobs-count');
  if (state.status === 'loading' || state.status === 'idle') { list.innerHTML = skeletons(3); count.textContent = t('common.loading'); return; }
  if (state.status === 'error') { count.textContent = ''; list.innerHTML = emptyBox('alert', t('jobs.loadError'), t('jobs.loadErrorSub'), `<button class="btn btn-ghost btn-sm" data-retry>${esc(t('jobs.retry'))}</button>`); return; }
  if (!state.jobs.length) { count.textContent = ''; list.innerHTML = emptyBox('briefcase', t('jobs.noneTitle'), t('jobs.noneSub'), `<a class="btn btn-primary btn-sm" href="#/add">${esc(t('jobs.add'))}</a>`); return; }
  const res = filterJobs(state.jobs, state);
  count.textContent = t('jobs.count', { n: res.length });
  list.innerHTML = res.length ? res.map(j => jobCard(j)).join('') : emptyBox('search', t('jobs.emptyTitle'), t('jobs.emptySub'));
}

function renderMine() {
  const list = $('#my-list');
  if (state.mineStatus === 'loading') { list.innerHTML = skeletons(1); return; }
  if (state.mineStatus === 'error') { list.innerHTML = emptyBox('alert', t('jobs.loadError'), t('jobs.loadErrorSub')); return; }
  list.innerHTML = state.mine.length ? state.mine.map(j => jobCard(j, true)).join('') : emptyBox('briefcase', t('account.noJobs'), t('account.noJobsSub'), `<a class="btn btn-primary btn-sm" href="#/add">${esc(t('jobs.add'))}</a>`);
}

export function renderAll() { renderHome(); renderJobs(); }

export async function loadJobs(force = false) {
  if (state.status === 'loading' || (state.status === 'ready' && !force)) return;
  state.status = 'loading'; renderAll();
  try { state.jobs = await fetchJobs(); state.status = 'ready'; }
  catch (e) { console.error(e); state.status = 'error'; }
  renderAll();
}

/* ---------- selects ---------- */
export function fillSelects() {
  const f = $('#flt-wilaya'), a = $('#f-wilaya');
  const fv = f.value, av = a.value;
  const opts = WILAYAS.map(w => `<option value="${w.id}">${esc(w[getLang()])}</option>`).join('');
  f.innerHTML = `<option value="">${esc(t('jobs.allWilayas'))}</option>${opts}`; f.value = fv;
  a.innerHTML = `<option value="">${esc(t('add.wilayaPh'))}</option>${opts}`; a.value = av;
  const chips = $('#days-chips'), checked = new Set([...chips.querySelectorAll('input:checked')].map(i => i.value));
  chips.innerHTML = DAYS.map(d => `<label><input type="checkbox" value="${d.id}" ${checked.has(d.id) ? 'checked' : ''}><span>${esc(d[getLang()])}</span></label>`).join('');
  chips.className = 'chips seg';
}

/* ---------- detail & delete ---------- */
function confirmDelete(job) {
  openModal({
    title: t('job.deleteTitle'), html: `<p class="text">${esc(t('job.deleteText'))}</p>`,
    actions: [
      { label: t('common.cancel'), onClick: ({ close }) => close() },
      { label: t('job.delete'), cls: 'btn-danger', onClick: async ({ close }) => {
          try {
            await removeJob(job.id);
            state.jobs = state.jobs.filter(j => j.id !== job.id); state.mine = state.mine.filter(j => j.id !== job.id);
            renderAll(); renderMine(); close(); document.querySelectorAll('.overlay').forEach(o => o.remove());
            toast(t('job.deleted'), 'success');
          } catch (e) { toast(errorMessage(e), 'error'); }
      } }
    ]
  });
}

function openDetail(id) {
  const job = state.jobs.find(j => j.id === id) || state.mine.find(j => j.id === id);
  if (!job) return;
  const owner = auth.currentUser && auth.currentUser.uid === job.userId;
  const row = (ico, label, val) => `<div>${icon(ico, 18)}<span><small>${esc(label)}</small>${esc(val)}</span></div>`;
  openModal({
    title: job.jobTitle,
    html: `<p class="desc">${esc(job.description)}</p><div class="detail-grid">
      ${row('pin', t('job.wilaya'), wName(job.wilaya))}${row('clock', t('job.workPeriod'), periodText(job.workPeriod))}
      ${row('calendar', t('job.workDays'), daysText(job.workDays))}${row('wallet', t('job.salary'), salaryText(job.salary))}
      ${row('mail', t('job.posted'), fmtDate(job.createdAt))}</div>
      <div class="modal-actions"><a class="btn btn-wa" href="${esc(waLink(job))}" target="_blank" rel="noopener">${icon('whatsapp', 18)}${esc(t('job.contact'))}</a>
      ${owner ? `<button type="button" class="btn btn-ghost" data-del-modal>${icon('trash', 16)}${esc(t('job.delete'))}</button>` : ''}</div>`,
    onOpen: el => { const b = el.querySelector('[data-del-modal]'); if (b) b.onclick = () => confirmDelete(job); }
  });
}

/* ---------- verify card ---------- */
let lastSend = 0;
export function verifyCard(user, onVerified) {
  const box = document.createElement('div');
  box.className = 'verify';
  box.innerHTML = `<h3>${icon('mail', 20)}${esc(t('verify.title'))}</h3><p>${esc(t('verify.text', { email: user.email }))}</p>
    <div class="row"><button type="button" class="btn btn-ghost btn-sm" data-resend>${esc(t('verify.resend'))}</button><button type="button" class="btn btn-primary btn-sm" data-done>${esc(t('verify.done'))}</button></div>`;
  const bResend = box.querySelector('[data-resend]'), bDone = box.querySelector('[data-done]');
  bResend.onclick = async () => {
    if (Date.now() - lastSend < 60000) return toast(t('verify.wait'), 'info');
    setButtonLoading(bResend, true);
    try { await resendVerification(); lastSend = Date.now(); toast(t('verify.sent'), 'success'); }
    catch (err) { toast(errorMessage(err), 'error'); } finally { setButtonLoading(bResend, false); }
  };
  bDone.onclick = async () => {
    setButtonLoading(bDone, true);
    try { const u = await refreshUser(); if (u?.emailVerified) { toast(t('verify.ok'), 'success'); onVerified(); } else toast(t('verify.notYet'), 'info'); }
    catch (err) { toast(errorMessage(err), 'error'); } finally { setButtonLoading(bDone, false); }
  };
  return box;
}

/* ---------- add form ---------- */
export function renderAdd(user) {
  const holder = $('#add-verify'), form = $('#job-form');
  holder.innerHTML = '';
  const verified = !!user?.emailVerified;
  form.hidden = !verified;
  if (user && !verified) holder.appendChild(verifyCard(user, () => renderAdd(auth.currentUser)));
}

const setErr = (name, msg) => { const p = $(`#job-form [data-err="${name}"]`); p.textContent = msg || ''; p.closest('.field').classList.toggle('invalid', !!msg); };

export function initAddForm(onPublished) {
  const form = $('#job-form');
  form.querySelectorAll('input[name="daysMode"]').forEach(r => r.onchange = () => { $('#days-chips').hidden = form.daysMode.value !== 'custom'; });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !user.emailVerified) return toast(t('e.permission'), 'error');
    ['title', 'desc', 'period', 'days', 'salary', 'wilaya', 'phone'].forEach(n => setErr(n, ''));
    const title = $('#f-title').value.trim(), desc = $('#f-desc').value.trim();
    const period = form.period.value, daily = form.daysMode.value === 'daily';
    const days = daily ? ['daily'] : [...$('#days-chips').querySelectorAll('input:checked')].map(i => i.value);
    const salaryRaw = $('#f-salary').value, salary = Number(salaryRaw);
    const wilaya = $('#f-wilaya').value, phone = normalizePhone($('#f-phone').value);
    let ok = true; const bad = (n, k) => { setErr(n, t(k)); ok = false; };
    if (title.length < 2 || title.length > 80) bad('title', 'val.title');
    if (desc.length < 20 || desc.length > 2000) bad('desc', 'val.desc');
    if (!period) bad('period', 'val.period');
    if (!days.length) bad('days', 'val.days');
    if (!salaryRaw || !Number.isInteger(salary) || salary < 1 || salary > 100000000) bad('salary', 'val.salary');
    if (!WILAYAS.some(w => w.id === wilaya)) bad('wilaya', 'val.wilaya');
    if (!/^[234]\d{7}$/.test(phone)) bad('phone', 'val.phone');
    if (!ok) { form.querySelector('.invalid')?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    const btn = $('#btn-publish'); setButtonLoading(btn, true);
    try {
      const job = await addJob(user, { jobTitle: title, description: desc, workPeriod: period, workDays: days, salary, wilaya, phoneNumber: phone });
      state.jobs.unshift(job); state.mine.unshift(job);
      form.reset(); $('#days-chips').hidden = true; $('#days-chips').querySelectorAll('input').forEach(i => i.checked = false);
      renderAll(); toast(t('add.success'), 'success'); onPublished();
    } catch (err) { toast(errorMessage(err), 'error'); }
    finally { setButtonLoading(btn, false); }
  });
}

/* ---------- account ---------- */
export async function renderAccount(user, onVerified) {
  const box = $('#account-box');
  ensureUserDoc(user);
  const initial = (user.displayName || user.email || '?').trim().charAt(0).toUpperCase();
  box.innerHTML = `<div class="card profile"><div class="avatar">${user.photoURL ? `<img src="${esc(user.photoURL)}" alt="" referrerpolicy="no-referrer">` : esc(initial)}</div>
    <div class="meta"><b>${esc(user.displayName || '')}</b><small dir="ltr">${esc(user.email)}</small>
    <span class="badge ${user.emailVerified ? 'ok' : 'no'}">${icon(user.emailVerified ? 'check' : 'alert', 13)}${esc(t(user.emailVerified ? 'account.verified' : 'account.unverified'))}</span></div></div>`;
  if (!user.emailVerified) { const v = verifyCard(user, onVerified); v.style.marginTop = '14px'; box.appendChild(v); }
  state.mineStatus = 'loading'; renderMine();
  try { state.mine = await fetchMyJobs(user.uid); state.mineStatus = 'ready'; } catch (e) { console.error(e); state.mineStatus = 'error'; }
  renderMine();
}

/* ---------- events ---------- */
export function initJobsEvents() {
  $('#flt-q').addEventListener('input', e => { state.q = e.target.value; renderJobs(); });
  $('#flt-wilaya').addEventListener('change', e => { state.wilaya = e.target.value; renderJobs(); });
  document.addEventListener('click', e => {
    if (e.target.closest('[data-retry]')) return loadJobs(true);
    const del = e.target.closest('[data-del]');
    if (del) { e.stopPropagation(); const j = state.mine.find(x => x.id === del.dataset.del); if (j) confirmDelete(j); return; }
    if (e.target.closest('a')) return;
    const card = e.target.closest('.job-card[data-id]');
    if (card) openDetail(card.dataset.id);
  });
  document.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('.job-card[data-id]')) { e.preventDefault(); openDetail(e.target.dataset.id); }
  });
}

export function resetMine() { state.mine = []; state.mineStatus = 'idle'; }
