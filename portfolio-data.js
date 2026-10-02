// Project facts come from the existing files. Personal skills remain in index.html.
export const PROJECTS = Object.freeze({
  ai: {
    name: "IA Lab",
    category: "FEATURED PROJECT / INTERACTIVE EXHIBITION / 2026",
    image: "assets/images/project-ai.webp",
    alt: "The existing IA Lab homepage with a particle sphere and large French typography",
    description:
      "A French-language educational exhibition about artificial intelligence. The experience connects a learning pipeline, an interactive neural network, a historical timeline and model families with a conversational demonstration.",
    objective:
      "Understand, explore and experiment with artificial intelligence through an interactive learning experience.",
    technologies: [
      "HTML",
      "CSS",
      "JavaScript",
      "Canvas 2D",
      "Node.js",
      "Supabase (optional)",
    ],
    note: "Without an API key, the assistant uses clearly labelled, pre-written educational responses. The original login and backend have been preserved.",
    screenshots: [
      {
        src: "assets/images/project-ai-network.webp",
        alt: "IA Lab interactive neural network and signal control",
      },
      {
        src: "assets/images/project-ai-chat.webp",
        alt: "IA Lab educational chat interface",
      },
    ],
    links: [
      { href: "login.html", label: "ENTER THE LAB" },
      { href: "sources.html", label: "SOURCES & REFERENCES" },
    ],
  },
  portfolio: {
    name: "MyPortfolio",
    category: "PERSONAL PROJECT / PORTFOLIO / 2026",
    image: "assets/images/project-portfolio.webp",
    alt: "Abderrahmene Hamza’s redesigned personal portfolio homepage",
    description:
      "My own space on the web: competitive swimming, YouTube creation and the journey towards web development. It brings my original photographs, milestones and contact details into one personal experience.",
    objective:
      "Present my personal journey and web work, and make it easy to connect with me.",
    technologies: ["HTML", "CSS", "JavaScript"],
    screenshots: [],
    links: [{ href: "#home", label: "BACK TO THE PORTFOLIO" }],
  },
});
export const PHOTOS = Object.freeze({
  competition: {
    name: "Swimming Competition",
    caption: "National Championship 2026",
    src: "assets/images/competition-1600.webp",
    alt: "Swimming pool during a national championship",
  },
  training: {
    name: "Training Session",
    caption: "Daily Practice",
    src: "assets/images/training-1600.webp",
    alt: "Abderrahmene preparing on a swimming starting block",
  },
  bem: {
    name: "BEM 2024",
    caption: "Successful Participation",
    src: "assets/images/bem-1600.webp",
    alt: "Abderrahmene holding his academic recognition certificate",
  },
});
