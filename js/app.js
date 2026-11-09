import { auth } from './firebase-config.js';
import { t, getLang, setLang, applyI18n } from './translations.js';
import { hydrateIcons, initTheme, toast } from './ui.js';
import { watchAuth, initAuthView, logout, syncAuthLang, authState } from './auth.js';
import { currentRoute, go, showView, updateAccountNav } from './navigation.js';
import { loadJobs, renderHome, renderJobs, renderAdd, renderAccount, fillSelects, initAddForm, initJobsEvents, resetMine } from './jobs.js';

let user = null, ready = false;

function handleRoute() {
  if (!ready || authState.registering) return;
  let r = currentRoute();
  if ((r === 'add' || r === 'account') && !user) {
    if (r === 'add') toast(t('auth.loginFirst'), 'info');
    sessionStorage.setItem('sh-return', r); r = 'auth'; go('auth', true);
  } else if (r === 'auth' && user) {
    r = sessionStorage.getItem('sh-return') || 'account'; sessionStorage.removeItem('sh-return'); go(r, true);
  }
  showView(r);
  if (r === 'home') renderHome();
  if (r === 'jobs') renderJobs();
  if (r === 'add') renderAdd(user);
  if (r === 'account') renderAccount(user, handleRoute);
}

function paintLang() {
  applyI18n(); hydrateIcons();
  document.getElementById('lang-label').textContent = getLang() === 'ar' ? 'Français' : 'العربية';
  fillSelects(); updateAccountNav(user); syncAuthLang();
  document.getElementById('btn-theme').setAttribute('aria-label', t('common.theme'));
  if (ready) handleRoute();
}

function boot() {
  initTheme(); applyI18n(); hydrateIcons(); fillSelects(); initJobsEvents(); initAuthView();
  initAddForm(() => go('jobs'));
  paintLang();
  document.getElementById('btn-lang').onclick = () => { setLang(getLang() === 'ar' ? 'fr' : 'ar'); paintLang(); };
  document.getElementById('btn-logout').onclick = async () => { await logout(); toast(t('auth.loggedOut'), 'success'); go('home'); };
  window.addEventListener('hashchange', handleRoute);
  document.addEventListener('auth:changed', () => { user = auth.currentUser; updateAccountNav(user); handleRoute(); });
  loadJobs();
  watchAuth(u => {
    if (!u) resetMine();
    user = u; ready = true;
    document.getElementById('splash').classList.add('hide');
    updateAccountNav(user); handleRoute();
  });
}
boot();
