// Boardcard Worker: question images (admin only). Static site is served by the assets binding.
const SB = 'https://qiejgpvawhxzqmxdjmbd.supabase.co';
const KEY = 'sb_publishable_rc10-toTkzah_8IN-JA0uQ_RrA2TFiv';
const MAX_BYTES = 500 * 1024;
const PATH_RE = /^q\/\d{6}\/[a-f0-9]{16}\.(webp|jpg)$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (o, s = 200) =>
  new Response(JSON.stringify(o), {
    status: s,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });

// Verifies the Supabase session token and that the caller is a non-blocked admin.
async function isAdmin(req) {
  const m = /^Bearer\s+(\S+)$/.exec(req.headers.get('Authorization') || '');
  if (!m) return false;
  const h = { apikey: KEY, Authorization: 'Bearer ' + m[1], Accept: 'application/json' };
  const u = await fetch(SB + '/auth/v1/user', { headers: h });
  if (!u.ok) return false;
  const user = await u.json();
  if (!user || !UUID_RE.test(user.id || '')) return false;
  const p = await fetch(SB + '/rest/v1/profiles?id=eq.' + user.id + '&select=role,blocked', { headers: h });
  if (!p.ok) return false;
  const rows = await p.json();
  const r = rows && rows[0];
  return !!r && r.role === 'admin' && !r.blocked;
}

function kind(b) {
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return 'webp';
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  return null;
}

function newPath(ext) {
  const d = new Date();
  const ym = d.getUTCFullYear() + String(d.getUTCMonth() + 1).padStart(2, '0');
  const r = new Uint8Array(8);
  crypto.getRandomValues(r);
  const id = Array.from(r, x => x.toString(16).padStart(2, '0')).join('');
  return 'q/' + ym + '/' + id + '.' + ext;
}

async function img(req, env, url) {
  if (req.method !== 'POST' && req.method !== 'DELETE') return json({ error: 'method' }, 405);
  if (!(await isAdmin(req))) return json({ error: 'forbidden' }, 403);

  if (req.method === 'DELETE') {
    const p = url.searchParams.get('path') || '';
    if (!PATH_RE.test(p)) return json({ error: 'bad_path' }, 400);
    await env.IMAGES.delete(p);
    return json({ ok: true });
  }

  const len = parseInt(req.headers.get('Content-Length') || '0', 10);
  if (len > MAX_BYTES) return json({ error: 'too_big' }, 413);
  const buf = await req.arrayBuffer();
  if (buf.byteLength === 0) return json({ error: 'empty' }, 400);
  if (buf.byteLength > MAX_BYTES) return json({ error: 'too_big' }, 413);
  const ext = kind(new Uint8Array(buf, 0, Math.min(16, buf.byteLength)));
  if (!ext) return json({ error: 'bad_type' }, 415);
  const path = newPath(ext);
  await env.IMAGES.put(path, buf, {
    httpMetadata: {
      contentType: ext === 'webp' ? 'image/webp' : 'image/jpeg',
      cacheControl: 'public, max-age=31536000, immutable'
    }
  });
  return json({ path });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/img') return img(req, env, url);
    if (url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404);
    return env.ASSETS.fetch(req);
  }
};
