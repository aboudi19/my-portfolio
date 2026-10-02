import { getSession, logout } from './auth.js';
import { MODELS, TIMELINE, STAGES, MODALITIES } from './data.js';
import { initAnimations, createScene, loadLogos, disposeAnimations, reducedMotion } from './animations.js';
import { initChat } from './ai.js';
import { getConfig } from './supabase.js';
initAnimations();
loadLogos();
const scenes = [...document.querySelectorAll('canvas[data-scene]')].map((canvas) => ({
  canvas,
  scene: createScene(canvas),
}));
const menu = document.querySelector('.menu-toggle'),
  nav = document.querySelector('.main-nav');
function closeMenu() {
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-label', 'Ouvrir la navigation');
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  nav.classList.toggle('open', open);
  menu.setAttribute('aria-expanded', String(open));
  menu.setAttribute('aria-label', open ? 'Fermer la navigation' : 'Ouvrir la navigation');
});
nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMenu));
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMenu();
    menu.focus();
  }
});
const track = document.getElementById('timeline-track');
for (const event of TIMELINE) {
  const article = document.createElement('article');
  article.className = 'timeline-event';
  const year = document.createElement('div');
  year.className = 'timeline-year';
  year.textContent = event.year;
  const title = document.createElement('h3');
  title.textContent = event.title;
  const text = document.createElement('p');
  text.textContent = event.text;
  const source = document.createElement('a');
  source.href = event.source;
  source.textContent = 'Source ↗';
  source.target = '_blank';
  source.rel = 'noopener noreferrer';
  article.append(year, title, text, source);
  track.append(article);
}
function selectModel(key) {
  const model = MODELS[key];
  document.querySelectorAll('[data-model]').forEach((b) => {
    const active = b.dataset.model === key;
    b.setAttribute('aria-selected', String(active));
    b.tabIndex = active ? 0 : -1;
  });
  document.getElementById('model-panel').setAttribute('aria-labelledby', `tab-${key}`);
  document.getElementById('model-company').textContent = model.company;
  document.getElementById('model-name').textContent = model.name;
  document.getElementById('model-description').textContent = model.description;
  document.getElementById('model-source').href = model.source;
  document.getElementById('model-symbol').className = `model-symbol ${key}`;
  const details = document.getElementById('model-details');
  details.replaceChildren();
  for (const [name, value] of Object.entries(model.details)) {
    const row = document.createElement('div'),
      dt = document.createElement('dt'),
      dd = document.createElement('dd');
    dt.textContent = name;
    dd.textContent = value;
    row.append(dt, dd);
    details.append(row);
  }
  if (!reducedMotion.matches)
    document.querySelector('.model-copy').animate(
      [
        { opacity: 0.1, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ],
      { duration: 450, easing: 'ease-out' },
    );
}
const tabs = [...document.querySelectorAll('[data-model]')];
tabs.forEach((button, index) => {
  button.addEventListener('click', () => selectModel(button.dataset.model));
  button.addEventListener('keydown', (e) => {
    let next;
    if (e.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (e.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = tabs.length - 1;
    if (next !== undefined) {
      e.preventDefault();
      tabs[next].focus();
      selectModel(tabs[next].dataset.model);
    }
  });
});
selectModel('gpt');
document.querySelectorAll('[data-stage]').forEach((button) =>
  button.addEventListener('click', () => {
    const stage = Number(button.dataset.stage);
    document.querySelectorAll('[data-stage]').forEach((b) => {
      const selected = b === button;
      b.classList.toggle('active', selected);
      b.setAttribute('aria-pressed', String(selected));
    });
    document.getElementById('pipeline-caption').textContent = STAGES[stage];
    document.querySelector('.pipeline').style.setProperty('--pipeline-progress', (stage + 1) / 4);
  }),
);
document.querySelectorAll('[data-modality]').forEach((button) =>
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-modality]').forEach((b) => {
      b.classList.toggle('active', b === button);
      b.setAttribute('aria-pressed', String(b === button));
    });
    document.getElementById('modality-description').textContent = MODALITIES[button.dataset.modality];
  }),
);
const signal = document.getElementById('signal-strength');
signal.addEventListener(
  'input',
  () => (document.getElementById('signal-value').textContent = `${signal.value} %`),
);
document.getElementById('send-signal').addEventListener('click', () => {
  scenes.find((s) => s.canvas.dataset.scene === 'network')?.scene.pulse(Number(signal.value) / 100);
  document.getElementById('network-status').textContent = `SIGNAL PROPAGÉ · INTENSITÉ ${signal.value} %`;
});
document.getElementById('logout').addEventListener('click', async () => {
  try {
    await logout();
  } catch {
    location.assign('login.html');
  }
});
try {
  const session = await getSession();
  if (!session) {
    location.replace('login.html');
  } else {
    document.getElementById('welcome').textContent = `Bienvenue, ${session.display_name.split(/\s+/)[0]}.`;
    document.getElementById('team-name').textContent = (await getConfig()).teamName;
    if (sessionStorage.getItem('ia-arrival')) {
      sessionStorage.removeItem('ia-arrival');
      const transition = document.querySelector('.page-transition');
      transition.classList.add('active');
      setTimeout(() => transition.classList.remove('active'), 80);
    }
    await initChat();
  }
} catch (error) {
  document.getElementById('welcome').textContent = error.message;
  document.getElementById('chat-error').textContent = error.message;
  document.getElementById('chat-mode').textContent = 'Connexion indisponible';
}
window.addEventListener('pagehide', disposeAnimations, { once: true });
