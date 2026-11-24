// Sert le site REF CLIPS, les liens de téléchargement des installateurs et les en-têtes de sécurité.
const ENTETES = {
  "X-Frame-Options": "DENY",
  "Content-Security-Policy": "frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000",
};
const RELEASES = "https://github.com/referee-tracker-fr/ref-clips-site/releases/download/";

async function telecharger(env, u, mac) {
  // Version en cours lue dans version.json du site, installateur relayé depuis la release GitHub.
  const { version } = await (await env.ASSETS.fetch(new URL("/version.json", u))).json();
  const r = await fetch(RELEASES + "v" + version + "/REF-CLIPS-" + version + (mac ? "-mac.dmg" : "-windows.exe"));
  const h = new Headers({
    "content-type": mac ? "application/x-apple-diskimage" : "application/octet-stream",
    "content-disposition": 'attachment; filename="' + (mac ? "REF CLIPS.dmg" : "REF CLIPS Setup.exe") + '"',
  });
  const len = r.headers.get("content-length");
  if (len) h.set("content-length", len);
  return new Response(r.body, { status: r.status, headers: h });
}

export default {
  async fetch(req, env) {
    const u = new URL(req.url);
    const m = u.pathname.match(/^\/telecharger\/(mac|windows)\/?$/);
    if (m) return telecharger(env, u, m[1] === "mac");
    const chemin = u.pathname.endsWith("/") ? u.pathname + "index.html" : u.pathname;
    let r = await env.ASSETS.fetch(new URL(chemin, u), req);
    let statut = r.status;
    if (statut === 404 && !u.pathname.endsWith("/") && !u.pathname.split("/").pop().includes(".")) {
      // /en -> /en/ (comme GitHub Pages)
      const dossier = await env.ASSETS.fetch(new URL(u.pathname + "/index.html", u));
      if (dossier.ok) { u.pathname += "/"; return Response.redirect(u.toString(), 301); }
    }
    if (statut === 404) r = await env.ASSETS.fetch(new URL("/404.html", u));
    const h = new Headers(r.headers);
    for (const [k, v] of Object.entries(ENTETES)) h.set(k, v);
    if (u.pathname === "/version.json") h.set("Access-Control-Allow-Origin", "*"); // lu par l'app REF CLIPS (comme sur GitHub Pages)
    return new Response(r.body, { status: statut, headers: h });
  },
};
