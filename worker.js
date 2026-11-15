// Boardcard Worker: question images (admin only). Static site is served by the assets binding.
const SB = 'https://qiejgpvawhxzqmxdjmbd.supabase.co';
const KEY = 'sb_publishable_rc10-toTkzah_8IN-JA0uQ_RrA2TFiv';
const MAX_BYTES = 500 * 1024;
const PATH_RE = /^q\/\d{6}\/[a-f0-9]{16}\.(webp|jpg)$/;
// Student data (gzip JSON), private bucket. Limits are measured on the gzip bytes.
const KINDS = {
  notes: { file: 'notes.json.gz', max: 1800000 },
  pq: { file: 'questions.json.gz', max: 1500000 }
};
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (o, s = 200) =>
  new Response(JSON.stringify(o), {
    status: s,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });

// Verifies the Supabase session token; returns {id, h} for any signed-in user.
async function whoami(req) {
  try {
    const m = /^Bearer\s+(\S+)$/.exec(req.headers.get('Authorization') || '');
    if (!m) return null;
    const h = { apikey: KEY, Authorization: 'Bearer ' + m[1], Accept: 'application/json' };
    const u = await fetch(SB + '/auth/v1/user', { headers: h });
    if (!u.ok) return null;
    const user = await u.json();
    if (!user || !UUID_RE.test(user.id || '')) return null;
    return { id: user.id, h: h };
  } catch (e) {
    return null;
  }
}

// Same, and the caller must be a non-blocked admin.
async function isAdmin(req) {
  const me = await whoami(req);
  if (!me) return false;
  try {
    const p = await fetch(SB + '/rest/v1/profiles?id=eq.' + me.id + '&select=role,blocked', { headers: me.h });
    if (!p.ok) return false;
    const rows = await p.json();
    const r = rows && rows[0];
    return !!r && r.role === 'admin' && !r.blocked;
  } catch (e) {
    return false;
  }
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


async function data(req, env, url) {
  const m = /^\/api\/data\/(notes|pq)$/.exec(url.pathname);
  if (m) {
    const k = KINDS[m[1]];
    const me = await whoami(req);
    if (!me) return json({ error: 'forbidden' }, 403);
    const key = 'users/' + me.id + '/' + k.file;
    if (req.method === 'GET') {
      const o = await env.USERDATA.get(key);
      if (!o) return json({ error: 'none' }, 404);
      return new Response(o.body, { headers: { 'Content-Type': 'application/gzip', 'Cache-Control': 'no-store' } });
    }
    if (req.method === 'PUT') {
      const len = parseInt(req.headers.get('Content-Length') || '0', 10);
      if (len > k.max) return json({ error: 'too_big' }, 413);
      const buf = await req.arrayBuffer();
      if (buf.byteLength < 20) return json({ error: 'empty' }, 400);
      if (buf.byteLength > k.max) return json({ error: 'too_big' }, 413);
      const b = new Uint8Array(buf, 0, 3);
      if (b[0] !== 0x1f || b[1] !== 0x8b || b[2] !== 0x08) return json({ error: 'bad_type' }, 415);
      await env.USERDATA.put(key, buf, { httpMetadata: { contentType: 'application/gzip' } });
      return json({ ok: true, size: buf.byteLength });
    }
    return json({ error: 'method' }, 405);
  }
  if (url.pathname === '/api/data' && req.method === 'DELETE') {
    if (!(await isAdmin(req))) return json({ error: 'forbidden' }, 403);
    const uid = url.searchParams.get('uid') || '';
    if (!UUID_RE.test(uid)) return json({ error: 'bad_uid' }, 400);
    const l = await env.USERDATA.list({ prefix: 'users/' + uid.toLowerCase() + '/' });
    const keys = l.objects.map(o => o.key);
    if (keys.length) await env.USERDATA.delete(keys);
    return json({ ok: true, deleted: keys.length });
  }
  return json({ error: 'not_found' }, 404);
}

// Admin-only read access to both buckets, used by the full-backup and usage panel in the admin page.
async function adminR2(req, env, url) {
  if (!(await isAdmin(req))) return json({ error: 'forbidden' }, 403);
  const b = url.searchParams.get('b');
  const bucket = b === 'img' ? env.IMAGES : b === 'user' ? env.USERDATA : null;
  if (!bucket) return json({ error: 'bad_bucket' }, 400);
  if (url.pathname === '/api/admin/list') {
    const l = await bucket.list({ limit: 1000, cursor: url.searchParams.get('cursor') || undefined });
    return json({
      objects: l.objects.map(o => ({ key: o.key, size: o.size, at: o.uploaded ? new Date(o.uploaded).getTime() : 0 })),
      cursor: l.truncated ? l.cursor : null
    });
  }
  if (url.pathname === '/api/admin/get') {
    const key = url.searchParams.get('key') || '';
    const okKey = b === 'img' ? PATH_RE.test(key) : /^users\/[0-9a-f-]{36}\/(notes|questions)\.json\.gz$/i.test(key);
    if (!okKey) return json({ error: 'bad_key' }, 400);
    const o = await bucket.get(key);
    if (!o) return json({ error: 'none' }, 404);
    return new Response(o.body, { headers: { 'Content-Type': 'application/octet-stream', 'Cache-Control': 'no-store' } });
  }
  return json({ error: 'not_found' }, 404);
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/img') return img(req, env, url);
    if (url.pathname === '/api/data' || url.pathname.startsWith('/api/data/')) return data(req, env, url);
    if (url.pathname === '/api/admin/list' || url.pathname === '/api/admin/get') return adminR2(req, env, url);
    if (url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404);
    return env.ASSETS.fetch(req);
  }
};
