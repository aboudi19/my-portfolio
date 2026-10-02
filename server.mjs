import http from "node:http";
import { readFile, stat, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import {
  validateName,
  validateQuestion,
  generateReply,
  demoReply,
} from "./supabase/functions/_shared/ai.mjs";
const root = path.dirname(fileURLToPath(import.meta.url));
try {
  const source = await readFile(path.join(root, ".env"), "utf8");
  for (const raw of source.split(/\r?\n/)) {
    const match = raw.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      let value = match[2];
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      )
        value = value.slice(1, -1);
      process.env[match[1]] = value;
    }
  }
} catch (e) {
  if (e.code !== "ENOENT") throw e;
}
const port = Number(process.env.PORT || 4174),
  host = process.env.HOST || "127.0.0.1";
const sessions = new Map(),
  quotas = new Map();
const publicFiles = new Set([
  "index.html",
  "ai-lab.html",
  "login.html",
  "sources.html",
]);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};
const safeError = (message, status = 400) =>
  Object.assign(new Error(message), { status });
function json(res, status, data, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    ...headers,
  });
  res.end(JSON.stringify(data));
}
function consume(key, limit, windowMs) {
  const now = Date.now(),
    entry = quotas.get(key);
  const next =
    !entry || now >= entry.until ? { count: 0, until: now + windowMs } : entry;
  if (next.count >= limit)
    throw safeError("Trop de demandes. Patientez avant de réessayer.", 429);
  next.count++;
  quotas.set(key, next);
}
async function body(req) {
  if (!req.headers["content-type"]?.startsWith("application/json"))
    throw safeError("Un corps JSON est requis.", 415);
  let size = 0,
    chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 8192) throw safeError("La demande est trop volumineuse.", 413);
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw safeError("Le JSON envoyé est invalide.");
  }
}
function session(req) {
  const id = req.headers.cookie
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("ia_session="))
    ?.slice(11);
  const current = id ? sessions.get(id) : null;
  if (!current || current.expires < Date.now())
    throw safeError("Votre session a expiré. Reconnectez-vous.", 401);
  return current;
}
function sameOrigin(req) {
  if (!req.headers.origin) return;
  const allowed = new Set(
    [
      `http://localhost:${port}`,
      `http://127.0.0.1:${port}`,
      process.env.APP_ORIGIN,
    ].filter(Boolean),
  );
  if (!allowed.has(req.headers.origin))
    throw safeError("Origine non autorisée.", 403);
}
const cookie = (value, maxAge) =>
  `ia_session=${value}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${process.env.COOKIE_SECURE === "true" ? "; Secure" : ""}`;
const server = http.createServer(async (req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  const supabaseOrigin = process.env.SUPABASE_URL
    ? new URL(process.env.SUPABASE_URL).origin
    : "";
  res.setHeader(
    "Content-Security-Policy",
    `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ${supabaseOrigin}; font-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`,
  );
  try {
    const url = new URL(req.url, "http://localhost");
    const ip = req.socket.remoteAddress || "local";
    if (url.pathname === "/api/config" && req.method === "GET") {
      return json(res, 200, {
        backend:
          process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY
            ? "supabase"
            : "local",
        supabaseUrl: process.env.SUPABASE_URL || "",
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
        teamName: process.env.TEAM_NAME || "L’équipe du laboratoire",
        aiEnabled: !!(process.env.AI_API_KEY && process.env.AI_MODEL),
      });
    }
    if (url.pathname.startsWith("/api/") && req.method === "POST")
      sameOrigin(req);
    if (url.pathname === "/api/login" && req.method === "POST") {
      consume(`login:${ip}`, 10, 600000);
      const input = await body(req),
        display_name = validateName(input.display_name);
      if (typeof input.password !== "string" || input.password.length > 100)
        throw safeError("Mot de passe incorrect.", 401);
      const expected = Buffer.from(process.env.DEMO_PASSWORD || "project ai"),
        actual = Buffer.from(input.password);
      if (
        actual.length !== expected.length ||
        !timingSafeEqual(expected, actual)
      )
        throw safeError("Ce code n’ouvre pas le laboratoire. Réessayez.", 401);
      if (sessions.size >= 1000)
        throw safeError(
          "Le laboratoire est complet. Réessayez plus tard.",
          503,
        );
      const id = randomBytes(32).toString("hex"),
        current = {
          id: randomUUID(),
          display_name,
          expires: Date.now() + 43200000,
          conversations: new Map(),
        };
      sessions.set(id, current);
      return json(
        res,
        200,
        { id: current.id, display_name },
        { "Set-Cookie": cookie(id, 43200) },
      );
    }
    if (url.pathname === "/api/session" && req.method === "GET") {
      const current = session(req);
      return json(res, 200, {
        id: current.id,
        display_name: current.display_name,
      });
    }
    if (url.pathname === "/api/logout" && req.method === "POST") {
      const token = req.headers.cookie
        ?.split(";")
        .map((s) => s.trim())
        .find((s) => s.startsWith("ia_session="))
        ?.slice(11);
      if (token) sessions.delete(token);
      return json(res, 200, { ok: true }, { "Set-Cookie": cookie("", 0) });
    }
    if (url.pathname === "/api/ai-chat" && req.method === "POST") {
      const current = session(req),
        input = await body(req),
        message = validateQuestion(input);
      consume(`chat-minute:${current.id}`, 10, 60000);
      consume(`chat-day:${ip}`, 100, 86400000);
      consume("chat-global", 1000, 3600000);
      const id = input.conversation_id || randomUUID();
      let history = current.conversations.get(id);
      if (input.conversation_id && !history)
        throw safeError("Conversation introuvable.", 404);
      if (!history) {
        if (current.conversations.size >= 30)
          throw safeError(
            "La limite de conversations de cette session est atteinte.",
            429,
          );
        history = [];
      }
      if (current.inflight)
        throw safeError("Une réponse est déjà en préparation.", 429);
      current.inflight = true;
      try {
        const messages = [
            ...history.slice(-12),
            { role: "user", content: message },
          ],
          configured = !!(process.env.AI_API_KEY || process.env.AI_MODEL);
        const reply = configured
          ? await generateReply(messages, (name) => process.env[name])
          : demoReply(message);
        history.push(
          { role: "user", content: message },
          { role: "assistant", content: reply },
        );
        current.conversations.set(id, history.slice(-40));
        return json(res, 200, {
          reply,
          conversation_id: id,
          mode: configured ? "live" : "demo",
        });
      } finally {
        current.inflight = false;
      }
    }
    if (url.pathname.startsWith("/api/"))
      throw safeError("Route inconnue.", 404);
    if (req.method !== "GET" && req.method !== "HEAD")
      throw safeError("Méthode non autorisée.", 405);
    let relative =
      decodeURIComponent(url.pathname).replace(/^\/+/, "") || "index.html";
    if (!publicFiles.has(relative) && !/^((css|js|assets)\/)/.test(relative))
      throw safeError("Fichier introuvable.", 404);
    const candidate = path.resolve(root, relative);
    if (!candidate.startsWith(root + path.sep))
      throw safeError("Fichier introuvable.", 404);
    let resolved;
    try {
      resolved = await realpath(candidate);
    } catch {
      throw safeError("Fichier introuvable.", 404);
    }
    if (
      !resolved.startsWith(root + path.sep) ||
      !(await stat(resolved)).isFile()
    )
      throw safeError("Fichier introuvable.", 404);
    const extension = path.extname(resolved);
    if (!mime[extension]) throw safeError("Fichier introuvable.", 404);
    const bytes = await readFile(resolved);
    res.writeHead(200, {
      "Content-Type": mime[extension],
      "Cache-Control": "no-cache",
      "Content-Length": bytes.length,
    });
    res.end(req.method === "HEAD" ? undefined : bytes);
  } catch (error) {
    if (!res.headersSent)
      json(res, error.status || 500, {
        error: error.status
          ? error.message
          : "Le laboratoire a rencontré un problème. Réessayez.",
      });
    else res.end();
  }
});
setInterval(() => {
  const now = Date.now();
  for (const [id, value] of sessions)
    if (value.expires < now) sessions.delete(id);
  for (const [id, value] of quotas) if (value.until < now) quotas.delete(id);
}, 60000).unref();
server.listen(port, host, () =>
  console.log(
    `MyPortfolio prêt : http://localhost:${port}/\nMode : ${process.env.SUPABASE_URL ? "Supabase" : process.env.AI_API_KEY && process.env.AI_MODEL ? "API IA locale" : "pédagogique local"}`,
  ),
);
server.on("error", (error) => {
  console.error(
    error.code === "EADDRINUSE"
      ? `Le port ${port} est déjà utilisé. Essayez PORT=4175 npm start.`
      : "Impossible de démarrer le serveur.",
  );
  process.exitCode = 1;
});
