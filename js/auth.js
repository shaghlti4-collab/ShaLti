import { auth } from './firebase-config.js';
import {
  onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider,
  sendEmailVerification, sendPasswordResetEmail, updateProfile, signOut, reload
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { ensureUserDoc } from './database.js';
import { t, getLang } from './translations.js';
import { toast, openModal, esc, setButtonLoading } from './ui.js';

export const authState = { registering: false };
export const watchAuth = cb => onAuthStateChanged(auth, cb);
export const syncAuthLang = () => { auth.languageCode = getLang(); };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const strongPass = p => p.length >= 8 && /[A-Za-z\u0600-\u06FF]/.test(p) && /\d/.test(p);

export function errorMessage(e) {
  const c = e?.code || '';
  if (/invalid-credential|user-not-found|wrong-password|invalid-login/.test(c)) return t('e.invalid');
  if (c === 'auth/email-already-in-use') return t('e.exists');
  if (c === 'auth/weak-password') return t('e.weak');
  if (c === 'auth/invalid-email') return t('val.email');
  if (c === 'auth/network-request-failed') return t('e.network');
  if (c === 'auth/too-many-requests') return t('e.many');
  if (/popup-closed|cancelled-popup/.test(c)) return t('e.popup');
  if (c === 'auth/unauthorized-domain') return t('e.domain');
  if (/error-code:-26|operation-not-supported|popup-blocked|web-storage-unsupported/.test(c)) return t('e.inapp');
  if (c === 'auth/user-disabled') return t('e.disabled');
  if (c === 'permission-denied') return t('e.permission');
  console.error(e);
  return t('e.generic');
}

export const logout = () => signOut(auth);
export async function resendVerification() { if (auth.currentUser) { syncAuthLang(); await sendEmailVerification(auth.currentUser); } }
export async function refreshUser() {
  const u = auth.currentUser;
  if (!u) return null;
  await reload(u);
  if (u.emailVerified) await u.getIdToken(true); // refresh the token so Firestore rules see email_verified = true
  return u;
}

async function registerUser(name, email, pass) {
  authState.registering = true;
  try {
    syncAuthLang();
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(cred.user, { displayName: name });
    await ensureUserDoc(cred.user, name);
    await sendEmailVerification(cred.user).catch(e => console.warn(e));
  } finally {
    authState.registering = false;
    document.dispatchEvent(new Event('auth:changed'));
  }
}

async function googleSignIn() {
  const cred = await signInWithPopup(auth, new GoogleAuthProvider());
  await ensureUserDoc(cred.user);
}

function setErr(form, name, msg) {
  const p = form.querySelector(`[data-err="${name}"]`);
  if (!p) return;
  p.textContent = msg || '';
  p.closest('.field')?.classList.toggle('invalid', !!msg);
}
const clearErrs = form => form.querySelectorAll('[data-err]').forEach(p => setErr(form, p.dataset.err, ''));

export function initAuthView() {
  const view = document.querySelector('[data-view="auth"]');
  const fLogin = view.querySelector('#form-login'), fReg = view.querySelector('#form-register');

  view.querySelectorAll('.tab').forEach(tab => tab.onclick = () => {
    view.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x === tab));
    fLogin.hidden = tab.dataset.tab !== 'login'; fReg.hidden = tab.dataset.tab !== 'register';
  });

  fLogin.addEventListener('submit', async e => {
    e.preventDefault(); clearErrs(fLogin);
    const email = fLogin.querySelector('#l-email').value.trim(), pass = fLogin.querySelector('#l-pass').value;
    let ok = true;
    if (!EMAIL_RE.test(email)) { setErr(fLogin, 'email', t('val.email')); ok = false; }
    if (!pass) { setErr(fLogin, 'pass', t('val.passReq')); ok = false; }
    if (!ok) return;
    const btn = fLogin.querySelector('button[type=submit]');
    setButtonLoading(btn, true);
    try { syncAuthLang(); await signInWithEmailAndPassword(auth, email, pass); fLogin.reset(); }
    catch (err) { toast(errorMessage(err), 'error'); }
    finally { setButtonLoading(btn, false); }
  });

  fReg.addEventListener('submit', async e => {
    e.preventDefault(); clearErrs(fReg);
    const name = fReg.querySelector('#r-name').value.trim(), email = fReg.querySelector('#r-email').value.trim();
    const p1 = fReg.querySelector('#r-pass').value, p2 = fReg.querySelector('#r-pass2').value;
    let ok = true;
    if (name.length < 2) { setErr(fReg, 'name', t('val.name')); ok = false; }
    if (!EMAIL_RE.test(email)) { setErr(fReg, 'email', t('val.email')); ok = false; }
    if (!strongPass(p1)) { setErr(fReg, 'pass', t('val.pass')); ok = false; }
    if (p1 !== p2) { setErr(fReg, 'pass2', t('val.pass2')); ok = false; }
    if (!ok) return;
    const btn = fReg.querySelector('button[type=submit]');
    setButtonLoading(btn, true);
    try { await registerUser(name, email, p1); fReg.reset(); toast(t('auth.created'), 'success'); }
    catch (err) { toast(errorMessage(err), 'error'); }
    finally { setButtonLoading(btn, false); }
  });

  view.querySelector('#btn-google').onclick = async ev => {
    const btn = ev.currentTarget; setButtonLoading(btn, true);
    try { await googleSignIn(); } catch (err) { toast(errorMessage(err), 'error'); } finally { setButtonLoading(btn, false); }
  };

  view.querySelector('#btn-forgot').onclick = () => {
    const pre = fLogin.querySelector('#l-email').value.trim();
    openModal({
      title: t('auth.resetTitle'),
      html: `<p class="text">${esc(t('auth.resetText'))}</p><div class="field" style="margin-top:14px"><label for="rs-email">${esc(t('auth.email'))}</label><input id="rs-email" type="email" dir="ltr" autocomplete="email" value="${esc(pre)}"><p class="field-error" data-err="email"></p></div>`,
      actions: [
        { label: t('common.cancel'), onClick: ({ close }) => close() },
        { label: t('auth.resetSend'), cls: 'btn-primary', onClick: async ({ close }) => {
            const box = document.getElementById('rs-email'), email = box.value.trim();
            const wrap = box.closest('.field');
            if (!EMAIL_RE.test(email)) { setErr(wrap, 'email', t('val.email')); return; }
            try { syncAuthLang(); await sendPasswordResetEmail(auth, email); toast(t('auth.resetSent'), 'success'); close(); }
            catch (err) { toast(errorMessage(err), 'error'); }
        } }
      ]
    });
  };
}
