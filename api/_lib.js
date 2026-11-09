/* Chilian OS · shared server code for the /api functions.
   ------------------------------------------------------------------
   Storage: one private Vercel Blob per record, at db/<collection>/<id>.json.
   Reads bypass the CDN (useCache: false) so every read sees the latest write;
   a small in-memory cache keyed by the blob's upload time saves re-downloads
   while a function instance stays warm.
   For local testing set OPS_LOCAL_DIR: records are then plain files on disk.

   Sessions: an HMAC-signed token (SESSION_SECRET) with the person's name and
   an expiry; the team password is OPS_PASSWORD. Both live in the Vercel
   project's environment variables. */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const LOCAL = process.env.OPS_LOCAL_DIR || "";
let blob = null;
async function sdk() { return (blob ??= await import("@vercel/blob")); }

// Every collection the system keeps. Anything else is refused.
export const COLLECTIONS = ["solicitudes", "cuentas", "oportunidades", "tareas", "cotizaciones", "ots", "ajustes"];
const PREFIX = { solicitudes: "SOL", cotizaciones: "COT", ots: "OT" };

const cache = new Map();   // pathname -> { t, doc }

const safeId = (id) => String(id || "").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80);
const docPath = (col, id) => `db/${col}/${safeId(id)}.json`;

async function readPath(p) {
  if (LOCAL) {
    try { return JSON.parse(await fs.readFile(path.join(LOCAL, p), "utf8")); } catch { return null; }
  }
  const { get } = await sdk();
  const r = await get(p, { access: "private", useCache: false });
  if (!r || r.statusCode !== 200) return null;
  return JSON.parse(await new Response(r.stream).text());
}
async function writePath(p, data, contentType = "application/json") {
  const body = typeof data === "string" || data instanceof Uint8Array ? data : JSON.stringify(data);
  if (LOCAL) {
    const f = path.join(LOCAL, p);
    await fs.mkdir(path.dirname(f), { recursive: true });
    await fs.writeFile(f, body);
    return;
  }
  const { put } = await sdk();
  await put(p, body, { access: "private", allowOverwrite: true, addRandomSuffix: false, contentType, cacheControlMaxAge: 60 });
  touchList(p, Date.now());
}
async function removePath(p) {
  cache.delete(p);
  if (LOCAL) { await fs.rm(path.join(LOCAL, p), { force: true }); return; }
  const { del } = await sdk();
  await del(p);
  touchList(p, 0);
}
/* list() is an "advanced operation" and the Hobby plan allows few of them a month (the store was
   suspended once for this). This instance keeps each listing for a while and patches it on its own
   writes and deletes, so the OS refreshing does not list the store every time. */
const LIST_TTL = 2 * 60_000;   // a new request written by another instance shows up within 2 minutes
const lists = new Map();   // prefix -> { at, items }
function touchList(p, t) {
  for (const [prefix, l] of lists) {
    if (!p.startsWith(prefix)) continue;
    l.items = l.items.filter((x) => x.pathname !== p);
    if (t) l.items.push({ pathname: p, t });
  }
}
// Every pathname under a prefix, with its upload time (to reuse cached reads).
async function listPaths(prefix) {
  if (LOCAL) {
    const dir = path.join(LOCAL, prefix);
    let names = [];
    try { names = await fs.readdir(dir); } catch { return []; }
    return Promise.all(names.map(async (n) => ({ pathname: prefix + n, t: (await fs.stat(path.join(dir, n))).mtimeMs })));
  }
  const hit = lists.get(prefix);
  if (hit && Date.now() - hit.at < LIST_TTL) return hit.items.slice();
  const { list } = await sdk();
  const out = []; let cursor;
  do {
    const r = await list({ prefix, cursor, limit: 1000 });
    for (const b of r.blobs) out.push({ pathname: b.pathname, t: new Date(b.uploadedAt).getTime() });
    cursor = r.hasMore ? r.cursor : undefined;
  } while (cursor);
  lists.set(prefix, { at: Date.now(), items: out.slice() });
  return out;
}

export async function getDoc(col, id) { return readPath(docPath(col, id)); }

export async function listDocs(col) {
  const items = await listPaths(`db/${col}/`);
  const docs = [];
  // read in small batches; reuse what this instance already has
  for (let i = 0; i < items.length; i += 24) {
    const batch = await Promise.all(items.slice(i, i + 24).map(async ({ pathname, t }) => {
      const hit = cache.get(pathname);
      if (hit && hit.t === t) return hit.doc;
      const doc = await readPath(pathname);
      if (doc) cache.set(pathname, { t, doc });
      return doc;
    }));
    docs.push(...batch.filter(Boolean));
  }
  return docs;
}

// Next folio for collections with a human number: OT-2611-007.
async function nextFolio(col) {
  const d = new Date(), ym = String(d.getUTCFullYear()).slice(2) + String(d.getUTCMonth() + 1).padStart(2, "0");
  const pre = `${PREFIX[col]}-${ym}-`;
  const items = await listPaths(`db/${col}/`);
  let max = 0;
  for (const { pathname } of items) {
    const m = pathname.match(new RegExp(`${pre}(\\d+)\\.json$`));
    if (m) max = Math.max(max, +m[1]);
  }
  for (let n = max + 1; n < max + 50; n++) {
    const id = pre + String(n).padStart(3, "0");
    if (!(await getDoc(col, id))) return id;
  }
  return pre + crypto.randomBytes(3).toString("hex");
}

/* Save a record. `base` is the updatedAt the editor started from: if someone
   saved in between, the save is refused with the newer record (409). */
export async function saveDoc(col, doc, by, { base } = {}) {
  if (!COLLECTIONS.includes(col)) throw Object.assign(new Error("Colección no válida"), { status: 400 });
  const now = new Date().toISOString();
  let id = safeId(doc.id);
  if (!id) id = PREFIX[col] ? await nextFolio(col) : `${col.slice(0, 3)}_${Date.now().toString(36)}${crypto.randomBytes(3).toString("hex")}`;
  const current = await getDoc(col, id);
  if (base && current && current.updatedAt && current.updatedAt !== base) {
    throw Object.assign(new Error("Alguien más guardó este registro mientras lo editabas."), { status: 409, current });
  }
  const saved = { ...doc, id, createdAt: current?.createdAt || doc.createdAt || now, createdBy: current?.createdBy || doc.createdBy || by || "", updatedAt: now, updatedBy: by || "" };
  await writePath(docPath(col, id), saved);
  // Client links (art approval and order tracking) are found by their token.
  if (col === "ots" && saved.tokenCliente) await writePath(`idx/token/${safeId(saved.tokenCliente)}.json`, { ot: id });
  return saved;
}
export async function deleteDoc(col, id) {
  const doc = await getDoc(col, id);
  if (col === "ots" && doc?.tokenCliente) await removePath(`idx/token/${safeId(doc.tokenCliente)}.json`).catch(() => {});
  await removePath(docPath(col, id));
  // An OT's artwork goes with it, so a folio used again never inherits old files.
  if (col === "ots") for (const { pathname } of await listPaths(`files/${safeId(id)}/`)) await removePath(pathname).catch(() => {});
}
// Small lookups (e.g. an Instagram conversation -> its request): idx/<kind>/<key>.json
export const getIndex = (kind, key) => readPath(`idx/${safeId(kind)}/${safeId(key)}.json`);
export const setIndex = (kind, key, value) => writePath(`idx/${safeId(kind)}/${safeId(key)}.json`, value);
export async function otByToken(token) {
  const idx = await readPath(`idx/token/${safeId(token)}.json`);
  if (!idx) return null;
  const ot = await getDoc("ots", idx.ot);
  // The index can outlive a change of token; the order itself must still carry it.
  return ot && ot.tokenCliente && ot.tokenCliente === String(token) ? ot : null;
}

/* Files (artwork, mockups): files/<OT>/<time>-<name>. */
export async function saveFile(ot, name, bytes, contentType) {
  const clean = String(name || "archivo").normalize("NFD").replace(/[^\w.-]+/g, "-").slice(-80);
  const p = `files/${safeId(ot)}/${Date.now().toString(36)}-${clean}`;
  await writePath(p, bytes, contentType || "application/octet-stream");
  return p;
}
export async function readFile(p) {
  if (!/^files\/[A-Za-z0-9_-]+\/[\w.-]+$/.test(p)) return null;
  if (LOCAL) {
    try { return { bytes: await fs.readFile(path.join(LOCAL, p)), type: guessType(p) }; } catch { return null; }
  }
  const { get } = await sdk();
  const r = await get(p, { access: "private" });
  if (!r || r.statusCode !== 200) return null;
  return { stream: r.stream, type: r.blob.contentType || guessType(p) };
}
const guessType = (p) => ({ png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", svg: "image/svg+xml", pdf: "application/pdf" })[p.split(".").pop().toLowerCase()] || "application/octet-stream";

/* ---------- sessions ---------- */
const secret = () => process.env.SESSION_SECRET || (LOCAL ? "local-dev-secret" : "");
const b64 = (s) => Buffer.from(s).toString("base64url");
export function sign(payload) {
  const body = b64(JSON.stringify(payload));
  const mac = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${mac}`;
}
export function verify(token) {
  if (!token || !secret()) return null;
  const [body, mac] = String(token).split(".");
  if (!body || !mac) return null;
  const good = crypto.createHmac("sha256", secret()).update(body).digest("base64url");
  if (mac.length !== good.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(good))) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString());
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
}
// A session is valid while its account exists, is active and has not been reset since
// (resetting a password or deactivating bumps the account's version, closing its sessions).
export async function sessionOf(req) {
  const h = req.headers.get("authorization") || "";
  const p = verify(h.startsWith("Bearer ") ? h.slice(7) : new URL(req.url).searchParams.get("s"));
  if (!p || !p.u) return null;
  const user = await userCached(p.u);
  if (!user || user.active === false || (user.v || 0) !== (p.v || 0)) return null;
  return { u: user.username, name: user.name, role: user.role };
}
export const sessionToken = (user) => sign({ u: user.username, v: user.v || 0, exp: Date.now() + 14 * 864e5 });

/* ---------- accounts: users/<username>.json, never exposed through /api/db ---------- */
export const ADMIN = "admin1";
export const safeUser = (u) => String(u || "").trim().toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 40);
const userPath = (u) => `users/${safeUser(u)}.json`;
const ucache = new Map();   // username -> { at, user }
async function userCached(u) {
  const c = ucache.get(u);
  if (c && Date.now() - c.at < 15000) return c.user;
  const user = await readPath(userPath(u));
  ucache.set(u, { at: Date.now(), user });
  return user;
}
export const getUser = (u) => readPath(userPath(u));
export async function listUsers() {
  const items = await listPaths("users/");
  return (await Promise.all(items.map((i) => readPath(i.pathname)))).filter(Boolean);
}
export async function putUser(user) { await writePath(userPath(user.username), user); ucache.delete(user.username); }
export async function deleteUser(u) { await removePath(userPath(u)); ucache.delete(safeUser(u)); }
export const publicUser = (u) => ({ username: u.username, name: u.name, role: u.role, puesto: u.puesto || "", active: u.active !== false, createdAt: u.createdAt, lastLogin: u.lastLogin || "" });
export function hashPass(pw) {
  const salt = crypto.randomBytes(16), hash = crypto.scryptSync(String(pw), salt, 32);
  return "scrypt$" + salt.toString("base64url") + "$" + hash.toString("base64url");
}
export function checkPass(pw, stored) {
  try {
    const [kind, salt, hash] = String(stored || "").split("$");
    if (kind !== "scrypt") return false;
    const want = Buffer.from(hash, "base64url"), got = crypto.scryptSync(String(pw || ""), Buffer.from(salt, "base64url"), want.length);
    return crypto.timingSafeEqual(got, want);
  } catch { return false; }
}
export function passwordOk(given) {
  const want = process.env.OPS_PASSWORD || (LOCAL ? "local" : "");
  if (!want || !given) return false;
  const a = crypto.createHash("sha256").update(String(given)).digest(), b = crypto.createHash("sha256").update(want).digest();
  return crypto.timingSafeEqual(a, b);
}

export const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } });
export const fail = (e) => json({ error: e.message || "Error del servidor", current: e.current }, e.status || 500);
export async function body(req, limit = 200_000) {
  const text = await req.text();
  if (text.length > limit) throw Object.assign(new Error("Solicitud demasiado grande"), { status: 413 });
  try { return JSON.parse(text || "{}"); } catch { throw Object.assign(new Error("JSON no válido"), { status: 400 }); }
}
export const token = () => crypto.randomBytes(18).toString("base64url");

// Raw storage for small helpers (push subscriptions).
export { readPath, writePath, removePath, listPaths };
