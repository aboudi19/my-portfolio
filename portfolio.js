import { PROJECTS, PHOTOS } from "./portfolio-data.js";
import { initMotion, reducedMotion } from "./portfolio-motion.js";

const menu = document.getElementById("mobile-menu");
const menuToggle = document.getElementById("menu-toggle");
const details = document.getElementById("detail-dialog");
const content = document.getElementById("detail-content");
const closing = new WeakMap();
let savedScroll = 0;
let activeDialog = null;
let lastTrigger = null;

document
  .querySelectorAll("[data-year]")
  .forEach((el) => (el.textContent = new Date().getFullYear()));
initMotion();

const intro = document.getElementById("intro");
const words = ["INITIALIZING", "DESIGN", "CODE", "AI", "IDEAS", "CREATION"];
if (reducedMotion.matches) intro.classList.add("finished");
else {
  const started = performance.now();
  const timer = setInterval(() => {
    const elapsed = performance.now() - started;
    document.getElementById("intro-progress").textContent = String(
      Math.min(100, Math.round(elapsed / 20)),
    ).padStart(3, "0");
    document.getElementById("intro-word").textContent =
      words[Math.min(words.length - 1, Math.floor(elapsed / 215))];
    if (elapsed > 1300) {
      document.getElementById("intro-word").style.opacity = "0";
    }
    if (elapsed >= 2000) clearInterval(timer);
  }, 80);
  setTimeout(() => {
    intro.classList.add("finished");
  }, 2850);
}

function lockScroll() {
  savedScroll = window.scrollY;
  document.body.classList.add("scroll-locked");
  document.body.style.position = "fixed";
  document.body.style.top = `-${savedScroll}px`;
  document.body.style.width = "100%";
}
function unlockScroll() {
  document.body.classList.remove("scroll-locked");
  ["position", "top", "width"].forEach((key) =>
    document.body.style.removeProperty(key),
  );
  window.scrollTo({ top: savedScroll, behavior: "instant" });
}
function openDialog(dialog, trigger) {
  if (activeDialog) return;
  lastTrigger = trigger;
  activeDialog = dialog;
  lockScroll();
  dialog.showModal();
  dialog.scrollTop = 0;
  requestAnimationFrame(() => dialog.classList.add("is-open"));
  if (dialog === menu) {
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Close menu");
  }
}
function closeDialog(dialog) {
  if (closing.has(dialog)) return closing.get(dialog);
  if (!dialog.open) return Promise.resolve();
  const promise = new Promise((resolve) => {
    dialog.classList.remove("is-open");
    if (dialog === menu) {
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open menu");
    }
    setTimeout(
      () => {
        dialog.close();
        unlockScroll();
        activeDialog = null;
        lastTrigger?.focus({ preventScroll: true });
        closing.delete(dialog);
        resolve();
      },
      reducedMotion.matches ? 0 : 280,
    );
  });
  closing.set(dialog, promise);
  return promise;
}
function scrollToSection(hash) {
  const target = document.getElementById(hash.slice(1));
  if (!target) return;
  history.replaceState(null, "", hash);
  target.tabIndex = -1;
  target.focus({ preventScroll: true });
  target.scrollIntoView({
    behavior: reducedMotion.matches ? "instant" : "smooth",
    block: "start",
  });
}
menuToggle.addEventListener("click", () =>
  menu.open ? closeDialog(menu) : openDialog(menu, menuToggle),
);
menu
  .querySelector(".menu-close")
  .addEventListener("click", () => closeDialog(menu));
details
  .querySelector(".detail-close")
  .addEventListener("click", () => closeDialog(details));
for (const dialog of [menu, details]) {
  dialog.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusable = [
      ...dialog.querySelectorAll(
        'a[href],button:not([disabled]),summary,[tabindex="0"]',
      ),
    ].filter((el) => el.getClientRects().length > 0);
    const first = focusable[0],
      last = focusable.at(-1);
    if (!first) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeDialog(dialog);
  });
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (
      event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom
    )
      closeDialog(dialog);
  });
}
menu.querySelectorAll("nav a").forEach((link) =>
  link.addEventListener("click", async (event) => {
    event.preventDefault();
    await closeDialog(menu);
    scrollToSection(link.hash);
  }),
);
matchMedia("(min-width: 768px)").addEventListener("change", (event) => {
  if (event.matches && menu.open) closeDialog(menu);
});
document
  .querySelectorAll('a[href^="#"]:not([data-project])')
  .forEach((link) => {
    if (link.closest(".mobile-menu")) return;
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      event.preventDefault();
      scrollToSection(link.hash);
      if (link.classList.contains("skip-link")) {
        const main = document.getElementById("main");
        main.tabIndex = -1;
        main.focus({ preventScroll: true });
      }
    });
  });

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}
function heading(name) {
  const h = element("h2", "detail-title", name);
  h.id = "detail-title";
  return h;
}
function image(src, alt, className = "", lazy = false) {
  const img = element("img", className);
  img.src = src;
  img.alt = alt;
  img.decoding = "async";
  if (lazy) img.loading = "lazy";
  return img;
}
function openProject(key, trigger) {
  const project = PROJECTS[key];
  if (!project) return;
  content.replaceChildren();
  details.classList.remove("photo-dialog");
  details
    .querySelector(".detail-close")
    .setAttribute("aria-label", "Close project details");
  document.getElementById("detail-kicker").textContent = project.category;
  content.append(
    heading(project.name),
    image(project.image, project.alt, "detail-hero"),
  );
  const columns = element("div", "detail-columns");
  for (const [label, text] of [
    ["THE EXPERIENCE", project.description],
    ["THE OBJECTIVE", project.objective],
  ]) {
    const column = element("div");
    column.append(element("h3", "", label), element("p", "", text));
    columns.append(column);
  }
  const techs = element("div", "detail-technologies");
  project.technologies.forEach((tech) =>
    techs.append(element("span", "", tech)),
  );
  columns.lastElementChild.append(techs);
  content.append(columns);
  const links = element("div", "detail-links");
  project.links.forEach((data) => {
    const link = element("a", "text-link", data.label);
    link.href = data.href;
    link.append(element("span", "", "↗"));
    if (data.href.startsWith("#"))
      link.addEventListener("click", async (event) => {
        event.preventDefault();
        await closeDialog(details);
        scrollToSection(data.href);
      });
    links.append(link);
  });
  content.append(links);
  if (project.screenshots.length) {
    const gallery = element("div", "detail-gallery");
    project.screenshots.forEach((photo) =>
      gallery.append(image(photo.src, photo.alt, "", true)),
    );
    content.append(gallery);
  }
  if (project.note)
    content.append(element("p", "detail-caption", project.note));
  openDialog(details, trigger);
}
document.querySelectorAll("[data-project]").forEach((link) =>
  link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    openProject(link.dataset.project, link);
  }),
);
document.querySelectorAll("[data-photo]").forEach((link) =>
  link.addEventListener("click", (event) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    const photo = PHOTOS[link.dataset.photo];
    content.replaceChildren(
      heading(photo.name),
      image(photo.src, photo.alt, "detail-hero"),
      element("p", "detail-caption", photo.caption),
    );
    details.classList.add("photo-dialog");
    document.getElementById("detail-kicker").textContent =
      "HIGHLIGHTS / ORIGINAL PHOTOGRAPH";
    details
      .querySelector(".detail-close")
      .setAttribute("aria-label", "Close photograph");
    openDialog(details, link);
  }),
);
document.getElementById("copy-phone").addEventListener("click", async () => {
  const status = document.getElementById("copy-status");
  try {
    await navigator.clipboard.writeText("+213697961789");
    status.textContent = "PHONE NUMBER COPIED.";
  } catch {
    status.textContent = "COPY THIS NUMBER: +213 697 961 789";
  }
});
