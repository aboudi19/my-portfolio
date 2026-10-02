# MyPortfolio — Abderrahmene Hamza

A monochrome personal portfolio built directly in the existing project. HTML, CSS and JavaScript ES modules, with no added production dependencies. The existing Node server, IA Lab, login, chat, Supabase functions and database setup are preserved.

## Run

```bash
npm start
```

Open **http://localhost:4174/**. The personal portfolio opens without a login. If that port is busy, use `PORT=4186 npm start` and open **http://localhost:4186/**.

Open **login.html** to enter the existing educational IA Lab. Successful login now opens **ai-lab.html**. The existing classroom access code and AI configuration are documented in **README-IA-LAB.md** and **SUPABASE_SETUP.md**. No API key is needed for the portfolio.

## What changed

- Full-screen typography, letter entrance, a short cinematic introduction and the original portrait.
- Editorial About layout, original achievements and an animated philosophy chapter.
- Two documented projects: the existing IA Lab and MyPortfolio itself. Real IA Lab screenshots accompany its case study.
- Native accessible project/photo dialogs, Escape handling, focus restoration and background scroll locking.
- Full-screen mobile navigation with staggered links and scrolling after closing.
- Tap/keyboard skill disclosures for HTML, CSS and JavaScript. Original self-assessment values are retained as captions, without progress bars.
- Journey, all three original highlights, Facebook, phone and the WhatsApp link from the earlier personal copy.
- Fine-pointer-only cursor inertia, portrait response and magnetic contact CTA. Touch devices disable these effects.
- Reduced-motion support, semantic headings, image alternatives, visible focus and current year.
- Responsive WebP variants, image dimensions, lazy loading and local assets. No remote fonts, icon libraries or scripts are loaded by the portfolio.

## Content provenance

Personal information was recovered from the original files saved before the IA Lab replaced the homepage:

- `/Users/abderrahmenehamza/Documents/Codex/2026-10-02/u/work/myportfolio-original/index.html`
- The original `profile.jpg`, `img1.jpg` and `img2.jpg`, now preserved in the external cleanup backup; their responsive WebP versions remain in `assets/images/`.
- The missing BEM photograph was restored from `/Users/abderrahmenehamza/Documents/projects/Myportfolio copy/img3.jpg`.
- The existing Facebook profile and phone number are unchanged. The earlier copy already included the WhatsApp link.

The preserved values are 10+ years swimming, 3 national competitions, 50 YouTube videos, 10 web projects, and self-assessments of HTML 85%, CSS 75%, JavaScript 40%. These are the owner's original portfolio statements, not newly verified claims. Only two projects have enough existing files to be presented individually; no project names, client work, results or repository URLs have been fabricated. AI, Canvas, Node and optional Supabase are project technologies, not additional claimed personal skills.

## Frontend files

```text
index.html                    Personal portfolio, public entry point
css/portfolio.css             Responsive visual system and motion styles
js/portfolio.js               Navigation, dialogs, intro, contact interactions
js/portfolio-motion.js        Scroll, reveals and pointer enhancements
js/portfolio-data.js          Existing project facts and highlight metadata
assets/images/                Original-image WebP variants and project screenshots
assets/logos/portfolio-mark.svg
ai-lab.html                   Preserved IA Lab homepage
login.html / sources.html     Existing lab pages, updated navigation
css/style.css / js/app.js      Preserved lab styles and application modules
server.mjs / supabase/        Existing backend and integrations
```

Unused original JPEGs, generated verification reports, placeholder README files and macOS metadata have been removed from this working project after being archived outside it. All displayed photographs remain available as responsive WebP images. `README-IA-LAB.md` preserves the original lab documentation. Supabase secrets belong only in the backend as before.

## Validation

```bash
npm run check
npm test
```

The redesign passed browser checks at 375, 390, 430, 768, 1024, 1280, 1440 and 1920px. Verification reports are retained in the external deliverables and cleanup backup. The portfolio can be served statically with `index.html`, `css/`, `js/` and `assets/`. To include the lab on static hosting, also publish `ai-lab.html`, `login.html` and `sources.html`, and configure its existing Supabase backend. Never publish `.env` or server secrets.
