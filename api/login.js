// POST { password, name } -> { token, name } · signs in a team member for 14 days.
import { passwordOk, sign, json, fail, body } from "./_lib.js";

export async function POST(req) {
  try {
    const { password, name } = await body(req, 2000);
    const who = String(name || "").trim().slice(0, 60);
    if (!who) return json({ error: "Escribe tu nombre." }, 400);
    if (!passwordOk(password)) {
      await new Promise((r) => setTimeout(r, 700));   // slow down guessing
      return json({ error: "Contraseña incorrecta." }, 401);
    }
    return json({ token: sign({ name: who, exp: Date.now() + 14 * 864e5 }), name: who });
  } catch (e) { return fail(e); }
}
