// POST { usuario, password } -> { token, usuario, name, role } · signs in one team account for 14 days.
// The main account is admin1. The first time it signs in it uses the original team password
// (OPS_PASSWORD); from then on it has its own, changeable in "Mi cuenta".
import { ADMIN, safeUser, getUser, putUser, hashPass, checkPass, passwordOk, sessionToken, publicUser, json, fail, body } from "./_lib.js";

const slow = () => new Promise((r) => setTimeout(r, 700));   // slows down guessing

export async function POST(req) {
  try {
    const d = await body(req, 2000);
    const u = safeUser(d.usuario), pw = String(d.password || "");
    if (!u || !pw) return json({ error: "Escribe tu usuario y tu contraseña." }, 400);
    let user = await getUser(u);
    if (!user && u === ADMIN && passwordOk(pw)) {
      user = { username: ADMIN, name: "Administrador", role: "admin", puesto: "Cuenta principal", active: true, v: 0, pass: hashPass(pw), createdAt: new Date().toISOString() };
      await putUser(user);
    }
    if (!user || !checkPass(pw, user.pass)) { await slow(); return json({ error: "Usuario o contraseña incorrectos." }, 401); }
    if (user.active === false) { await slow(); return json({ error: "Esta cuenta está desactivada. Pide al administrador que la active." }, 403); }
    user.lastLogin = new Date().toISOString();
    await putUser(user);
    return json({ token: sessionToken(user), ...publicUser(user), usuario: user.username });
  } catch (e) { return fail(e); }
}
