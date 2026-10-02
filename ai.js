import { getConfig, readResponse, invokeFunction } from './supabase.js';
import { reducedMotion } from './animations.js';
export async function initChat() {
  const form = document.getElementById('chat-form'),
    input = document.getElementById('chat-input'),
    log = document.getElementById('chat-messages'),
    error = document.getElementById('chat-error'),
    send = document.getElementById('chat-send'),
    stop = document.getElementById('chat-stop'),
    suggestions = document.getElementById('chat-suggestions');
  let busy = false,
    controller = null,
    conversationId = null;
  const mode = document.getElementById('chat-mode');
  try {
    const config = await getConfig();
    mode.textContent =
      config.backend === 'supabase'
        ? 'Connecté au laboratoire'
        : config.aiEnabled
          ? 'Assistant IA connecté'
          : 'Mode pédagogique · réponses de démonstration';
  } catch (e) {
    mode.textContent = 'Laboratoire hors ligne';
    error.textContent = e.message;
  }
  const scroll = () => {
    log.scrollTop = log.scrollHeight;
  };
  function addMessage(role, text) {
    const article = document.createElement('article');
    article.className = `message ${role}`;
    const label = document.createElement('span');
    label.className = 'message-label';
    label.textContent = role === 'user' ? 'VOUS / EXPLORATEUR' : 'ASSISTANT / IA';
    const p = document.createElement('p');
    p.textContent = text;
    article.append(label, p);
    log.append(article);
    scroll();
    return { article, p };
  }
  async function typeText(element, text, signal) {
    if (reducedMotion.matches) {
      element.textContent = text;
      scroll();
      return;
    }
    const chars = Array.from(text);
    for (let i = 0; i < chars.length; i += 14) {
      if (signal.aborted) {
        element.textContent = text;
        break;
      }
      element.textContent += chars.slice(i, i + 14).join('');
      scroll();
      await new Promise((r) => setTimeout(r, 12));
    }
  }
  function setBusy(value) {
    busy = value;
    send.hidden = value;
    stop.hidden = !value;
    input.disabled = value;
    document.getElementById('new-conversation').disabled = value;
    suggestions.querySelectorAll('button').forEach((b) => (b.disabled = value));
    form.setAttribute('aria-busy', String(value));
  }
  input.addEventListener('input', () => {
    document.getElementById('chat-count').textContent = `${input.value.length} / 1500`;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 110)}px`;
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  stop.addEventListener('click', () => controller?.abort());
  suggestions.querySelectorAll('button').forEach((button) =>
    button.addEventListener('click', () => {
      if (busy) return;
      input.value = button.textContent;
      input.dispatchEvent(new Event('input'));
      form.requestSubmit();
    }),
  );
  document.getElementById('new-conversation').addEventListener('click', () => {
    if (busy) return;
    conversationId = null;
    while (log.children.length > 1) log.lastElementChild.remove();
    suggestions.hidden = false;
    error.textContent = '';
    input.focus();
  });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (busy || !message) return;
    if (message.length > 1500) {
      error.textContent = 'Votre question doit contenir au maximum 1 500 caractères.';
      return;
    }
    error.textContent = '';
    setBusy(true);
    controller = new AbortController();
    addMessage('user', message);
    input.value = '';
    input.dispatchEvent(new Event('input'));
    suggestions.hidden = true;
    const indicator = document.createElement('div');
    indicator.className = 'message assistant typing';
    indicator.setAttribute('role', 'status');
    indicator.setAttribute('aria-label', 'Réponse en préparation');
    for (let i = 0; i < 3; i++) indicator.append(document.createElement('i'));
    log.append(indicator);
    scroll();
    try {
      const config = await getConfig();
      const body = { message, conversation_id: conversationId };
      const data =
        config.backend === 'supabase'
          ? await invokeFunction('ai-chat', body, controller.signal)
          : await readResponse(
              await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal,
              }),
            );
      conversationId = data.conversation_id;
      mode.textContent =
        data.mode === 'demo' ? 'Mode pédagogique · réponses de démonstration' : 'Assistant IA connecté';
      indicator.remove();
      const result = addMessage('assistant', '');
      result.article.setAttribute('aria-live', 'off');
      await typeText(result.p, data.reply, controller.signal);
      result.article.removeAttribute('aria-live');
      const announcement = document.createElement('span');
      announcement.className = 'sr-only';
      announcement.textContent = 'La réponse de l’assistant est disponible.';
      result.article.append(announcement);
    } catch (e) {
      indicator.remove();
      error.textContent =
        e.name === 'AbortError' ? 'Demande annulée. Vous pouvez poser une autre question.' : e.message;
      if (e.status === 401)
        error.textContent += ' Utilisez Déconnexion puis entrez à nouveau dans le laboratoire.';
      input.value = message;
      input.dispatchEvent(new Event('input'));
    } finally {
      setBusy(false);
      controller = null;
      input.focus();
    }
  });
  window.addEventListener('pagehide', () => controller?.abort(), { once: true });
}
