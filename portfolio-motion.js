export const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const finePointer = matchMedia(
  "(hover: hover) and (pointer: fine) and (min-width: 768px)",
);
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));

export function initMotion() {
  const root = document.documentElement;
  const header = document.getElementById("site-header");
  const progress = document.querySelector(".reading-progress");
  const hero = document.getElementById("home");
  const visual = document.querySelector("[data-hero-visual]");
  const story = document.getElementById("philosophy");
  const storyLines = [...document.querySelectorAll(".story-line")];
  const darkSections = [...document.querySelectorAll("[data-dark]")];
  const navLinks = [...document.querySelectorAll(".desktop-nav a")];
  const navSections = navLinks.map((link) => document.querySelector(link.hash));
  let pending = false;
  let pointerCleanup = () => {};

  // Preserve each line's markup while animating its letters independently.
  document.querySelectorAll("[data-split]").forEach((line) => {
    const walker = document.createTreeWalker(line, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) textNodes.push(walker.currentNode);
    let index = 0;
    for (const node of textNodes) {
      const fragment = document.createDocumentFragment();
      for (const letter of node.textContent) {
        const span = document.createElement("span");
        span.className = "char";
        span.textContent = letter;
        span.style.setProperty("--char-index", index++);
        fragment.append(span);
      }
      node.replaceWith(fragment);
    }
  });

  const revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    },
    { threshold: 0, rootMargin: "0px 0px -30px 0px" },
  );
  document
    .querySelectorAll(".reveal")
    .forEach((el) => revealObserver.observe(el));

  function renderScroll() {
    pending = false;
    const y = window.scrollY;
    const distance = root.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${distance > 0 ? clamp(y / distance) : 0})`;
    header.classList.toggle("scrolled", y > 20);
    const headerY = Math.max(
      header.getBoundingClientRect().height,
      innerHeight * 0.25,
    );
    header.classList.toggle(
      "on-dark",
      darkSections.some((section) => {
        const r = section.getBoundingClientRect();
        return r.top <= headerY && r.bottom > headerY;
      }),
    );
    let active = navSections[0];
    for (const section of navSections) {
      if (
        section.getBoundingClientRect().top <= Math.max(150, innerHeight * 0.32)
      )
        active = section;
    }
    navLinks.forEach((link) => {
      if (link.hash === `#${active.id}`)
        link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    if (reducedMotion.matches) return;
    const r = story.getBoundingClientRect();
    if (r.top < innerHeight && r.bottom > 0) {
      const ratio = clamp(
        (innerHeight * 0.75 - r.top) /
          Math.max(r.height - innerHeight * 0.15, 1),
      );
      storyLines.forEach((line, index) => {
        const reveal = clamp(ratio * 3.8 - index * 0.75);
        line.style.opacity = 0.24 + reveal * 0.76;
        line.style.transform = `translateY(${(1 - reveal) * 18}px)`;
      });
    }
    // Parallax never extends the portrait beyond its original composition.
    if (
      finePointer.matches &&
      navigator.maxTouchPoints === 0 &&
      y < hero.offsetHeight
    ) {
      visual.style.setProperty(
        "--portrait-scroll",
        `${clamp(y / hero.offsetHeight) * -35}px`,
      );
    }
  }
  function scheduleScroll() {
    if (!pending) {
      pending = true;
      requestAnimationFrame(renderScroll);
    }
  }
  addEventListener("scroll", scheduleScroll, { passive: true });
  addEventListener("resize", scheduleScroll, { passive: true });

  function initPointer() {
    const cursor = document.getElementById("cursor");
    const label = cursor.querySelector("span");
    let targetX = 0,
      targetY = 0,
      x = 0,
      y = 0,
      frame = 0,
      initialized = false;
    const heroBounds = () => hero.getBoundingClientRect();
    function tick() {
      x += (targetX - x) * 0.2;
      y += (targetY - y) * 0.2;
      cursor.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;
      if (
        Math.abs(targetX - x) + Math.abs(targetY - y) > 0.1 &&
        !document.hidden
      )
        frame = requestAnimationFrame(tick);
      else frame = 0;
    }
    function move(event) {
      if (event.pointerType === "touch") return;
      targetX = event.clientX;
      targetY = event.clientY;
      if (!initialized) {
        x = targetX;
        y = targetY;
        initialized = true;
      }
      cursor.classList.add("active");
      const target = event.target.closest("a,button,summary");
      const text = target?.dataset.cursor || "";
      cursor.classList.toggle("hovering", !!target);
      cursor.classList.toggle("labelled", !!text);
      label.textContent = text;
      if (!frame) frame = requestAnimationFrame(tick);
      const r = heroBounds();
      if (r.bottom > 0 && event.clientY < r.bottom) {
        const px = (event.clientX / innerWidth - 0.5) * 12;
        const py = (event.clientY / innerHeight - 0.5) * 8;
        visual.style.setProperty("--portrait-x", `${px}px`);
        visual.style.setProperty("--portrait-y", `${py}px`);
      }
    }
    function leave() {
      cursor.classList.remove("active");
    }
    function visibility() {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
        leave();
      }
    }
    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    document.addEventListener("visibilitychange", visibility);
    const magnets = [...document.querySelectorAll(".magnetic")];
    const magneticMove = (event) => {
      const el = event.currentTarget,
        r = el.getBoundingClientRect();
      el.style.transform = `translate(${(event.clientX - r.left - r.width / 2) * 0.07}px,${(event.clientY - r.top - r.height / 2) * 0.1}px)`;
    };
    const resetMagnet = (event) =>
      event.currentTarget.style.removeProperty("transform");
    magnets.forEach((el) => {
      el.addEventListener("pointermove", magneticMove);
      el.addEventListener("pointerleave", resetMagnet);
    });
    root.classList.add("pointer-effects");
    return () => {
      root.classList.remove("pointer-effects");
      cursor.classList.remove("active");
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      document.removeEventListener("visibilitychange", visibility);
      magnets.forEach((el) => {
        el.removeEventListener("pointermove", magneticMove);
        el.removeEventListener("pointerleave", resetMagnet);
        el.style.removeProperty("transform");
      });
      ["--portrait-scroll", "--portrait-x", "--portrait-y"].forEach((key) =>
        visual.style.removeProperty(key),
      );
    };
  }
  function configureMotion() {
    root.classList.toggle("motion-enabled", !reducedMotion.matches);
    pointerCleanup();
    pointerCleanup =
      !reducedMotion.matches &&
      finePointer.matches &&
      navigator.maxTouchPoints === 0
        ? initPointer()
        : () => {};
    if (reducedMotion.matches)
      storyLines.forEach((line) => {
        line.style.removeProperty("opacity");
        line.style.removeProperty("transform");
      });
    scheduleScroll();
  }
  configureMotion();
  reducedMotion.addEventListener("change", configureMotion);
  finePointer.addEventListener("change", configureMotion);
  // Do not dismantle observers on pagehide: back-forward cache restores the page.
  addEventListener("pageshow", configureMotion);
}
