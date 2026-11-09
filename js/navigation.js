import { t } from './translations.js';
import { icon } from './ui.js';

export const ROUTES = ['home', 'jobs', 'add', 'account', 'auth'];
export const currentRoute = () => { const r = location.hash.replace(/^#\/?/, '') || 'home'; return ROUTES.includes(r) ? r : 'home'; };
export function go(route, replace = false) {
  const url = route === 'home' ? '#/' : `#/${route}`;
  if (replace) history.replaceState(null, '', url); else location.hash = url;
}
export function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.dataset.view === name));
  document.querySelectorAll('.pillnav a').forEach(a => {
    const on = a.dataset.route === name || (name === 'auth' && a.dataset.route === 'account');
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  window.scrollTo({ top: 0 });
}
export function updateAccountNav(user) {
  const ico = document.getElementById('nav-account-ico'), lbl = document.getElementById('nav-account-lbl');
  if (user) {
    const ch = (user.displayName || user.email || '?').trim().charAt(0).toUpperCase();
    ico.innerHTML = `<span class="nav-avatar">${ch.replace(/[<>&]/g, '')}</span>`;
    lbl.textContent = t('nav.account');
  } else {
    ico.innerHTML = icon('user', 22);
    lbl.textContent = t('nav.login');
  }
}
