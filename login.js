import { login } from './auth.js';
import { createScene, loadLogos, initAnimations, disposeAnimations, reducedMotion } from './animations.js';
loadLogos();
initAnimations();
createScene(document.querySelector('canvas'));
const form = document.getElementById('login-form'),
  password = document.getElementById('password'),
  button = document.getElementById('login-submit'),
  error = document.getElementById('login-error'),
  wrap = document.querySelector('.login-form-wrap');
document.getElementById('toggle-password').addEventListener('click', (event) => {
  const show = password.type === 'password';
  password.type = show ? 'text' : 'password';
  event.currentTarget.setAttribute('aria-pressed', String(show));
  event.currentTarget.setAttribute(
    'aria-label',
    show ? 'Masquer le mot de passe' : 'Afficher le mot de passe',
  );
});
document.querySelectorAll('.input-wrap').forEach((el) =>
  el.addEventListener('pointermove', (e) => {
    if (reducedMotion.matches) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--x', `${e.clientX - r.left}px`);
    el.style.setProperty('--y', `${e.clientY - r.top}px`);
  }),
);
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (button.disabled) return;
  error.textContent = '';
  button.disabled = true;
  button.firstChild.textContent = 'Ouverture du laboratoire ';
  form.setAttribute('aria-busy', 'true');
  try {
    const name = document.getElementById('display-name').value.trim();
    const profile = await login(name, password.value);
    wrap.classList.add('success');
    document.getElementById('transition-greeting').textContent =
      `BIENVENUE, ${profile.display_name.toLocaleUpperCase('fr')}.`;
    document.querySelector('.page-transition').classList.add('active');
    sessionStorage.setItem('ia-arrival', '1');
    setTimeout(() => location.assign('ai-lab.html'), reducedMotion.matches ? 0 : 950);
  } catch (err) {
    error.textContent = err.message;
    wrap.classList.remove('reject');
    void wrap.offsetWidth;
    wrap.classList.add('reject');
    password.focus();
    button.disabled = false;
    button.firstChild.textContent = 'Entrer dans l’expérience ';
  } finally {
    form.setAttribute('aria-busy', 'false');
  }
});
window.addEventListener('pagehide', disposeAnimations, { once: true });
