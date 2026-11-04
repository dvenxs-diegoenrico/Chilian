/* Team accounts.
   GET                                   (signed in)  -> { users: [...] }   names and roles, never passwords
   POST { accion: "guardar", username, name, role, puesto, active, password? }   (admin)  -> { user }
   POST { accion: "mi-clave", actual, nueva }    (anyone, for their own account)  -> { token }
   DELETE ?u=usuario                     (admin)  -> { ok }
   admin1 is the main account: it cannot be deactivated, demoted or deleted. */
import { ADMIN, safeUser, sessionOf, getUser, listUsers, putUser, deleteUser, hashPass, checkPass, sessionToken, publicUser, json, fail, body } from "./_lib.js";

const need = async (req, admin) => {
  const s = await sessionOf(req);
  if (!s) throw Object.assign(new Error("Tu sesión terminó. Vuelve a entrar."), { status: 401 });
  if (admin && s.role !== "admin") throw Object.assign(new Error("Solo la cuenta principal administra cuentas."), { status: 403 });
  return s;
};
const strong = (pw) => String(pw || "").length >= 8;

export async function GET(req) {
  try {
    await need(req);
    const users = (await listUsers()).map(publicUser).sort((a, b) => (a.username === ADMIN ? -1 : b.username === ADMIN ? 1 : a.name.localeCompare(b.name)));
    return json({ users });
  } catch (e) { return fail(e); }
}

export async function POST(req) {
  try {
    const d = await body(req, 4000);
    if (d.accion === "mi-clave") {
      const s = await need(req);
      const user = await getUser(s.u);
      if (!user || !checkPass(d.actual, user.pass)) return json({ error: "Tu contraseña actual no coincide." }, 400);
      if (!strong(d.nueva)) return json({ error: "La nueva contraseña necesita al menos 8 caracteres." }, 400);
      user.pass = hashPass(d.nueva); user.v = (user.v || 0) + 1;   // other devices sign in again
      await putUser(user);
      return json({ token: sessionToken(user) });
    }
    if (d.accion !== "guardar") return json({ error: "Acción no válida." }, 400);
    const s = await need(req, true);
    const u = safeUser(d.username);
    if (u.length < 3) return json({ error: "El usuario necesita al menos 3 letras o números (sin espacios)." }, 400);
    const name = String(d.name || "").trim().slice(0, 60);
    if (!name) return json({ error: "Escribe el nombre de la persona." }, 400);
    const prev = await getUser(u);
    if (!prev && !d.nuevo) return json({ error: "Esa cuenta ya no existe." }, 404);
    if (prev && d.nuevo) return json({ error: `El usuario «${u}» ya existe. Elige otro.` }, 409);
    if (!prev && !strong(d.password)) return json({ error: "La contraseña necesita al menos 8 caracteres." }, 400);
    if (d.password && !strong(d.password)) return json({ error: "La contraseña necesita al menos 8 caracteres." }, 400);
    const isMain = u === ADMIN;
    const user = { ...(prev || { username: u, createdAt: new Date().toISOString(), createdBy: s.name, v: 0 }) };
    user.name = name;
    user.puesto = String(d.puesto || "").trim().slice(0, 60);
    user.role = isMain ? "admin" : d.role === "admin" ? "admin" : "equipo";
    const active = isMain ? true : d.active !== false;
    if (prev && (prev.active !== false) !== active) user.v = (user.v || 0) + 1;   // deactivating closes its sessions
    user.active = active;
    if (d.password) { user.pass = hashPass(d.password); if (prev) user.v = (user.v || 0) + 1; }
    user.updatedAt = new Date().toISOString(); user.updatedBy = s.name;
    await putUser(user);
    return json({ user: publicUser(user) });
  } catch (e) { return fail(e); }
}

export async function DELETE(req) {
  try {
    await need(req, true);
    const u = safeUser(new URL(req.url).searchParams.get("u"));
    if (!u || u === ADMIN) return json({ error: "La cuenta principal no se puede borrar." }, 400);
    await deleteUser(u);
    return json({ ok: true });
  } catch (e) { return fail(e); }
}
