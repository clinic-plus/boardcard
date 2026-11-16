// Boardcard Worker: question images (admin only). Static site is served by the assets binding.
const SB = 'https://qiejgpvawhxzqmxdjmbd.supabase.co';
const KEY = 'sb_publishable_rc10-toTkzah_8IN-JA0uQ_RrA2TFiv';
const MAX_BYTES = 500 * 1024;
const PATH_RE = /^q\/\d{6}\/[a-f0-9]{16}\.(webp|jpg)$/;
// Student data (gzip JSON), private bucket. Limits are measured on the gzip bytes.
const KINDS = {
  notes: { file: 'notes.json.gz', max: 1800000 },
  pq: { file: 'questions.json.gz', max: 1500000 },
  progress: { file: 'progress.json.gz', max: 3000000 }
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
  const m = /^\/api\/data\/(notes|pq|progress)$/.exec(url.pathname);
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
    // keep=progress: remove only notes and personal questions, keep the study progress
    const keepProg = url.searchParams.get('keep') === 'progress';
    const keys = l.objects.map(o => o.key).filter(k => !(keepProg && /\/progress\.json\.gz$/.test(k)));
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
    const okKey = b === 'img' ? PATH_RE.test(key) : /^users\/[0-9a-f-]{36}\/(notes|questions|progress)\.json\.gz$/i.test(key);
    if (!okKey) return json({ error: 'bad_key' }, 400);
    const o = await bucket.get(key);
    if (!o) return json({ error: 'none' }, 404);
    return new Response(o.body, { headers: { 'Content-Type': 'application/octet-stream', 'Cache-Control': 'no-store' } });
  }
  return json({ error: 'not_found' }, 404);
}

// Usage metrics from the Cloudflare GraphQL API. Needs the secret CF_API_TOKEN (Account Analytics: Read).
const CLASS_A = ['ListBuckets','PutBucket','ListObjects','ListObjectsV2','PutObject','CopyObject','CompleteMultipartUpload','CreateMultipartUpload','ListMultipartUploads','UploadPart','UploadPartCopy','PutBucketEncryption','PutBucketCors','PutBucketLifecycleConfiguration','LifecycleStorageTierTransition'];
async function metrics(req, env) {
  if (!(await isAdmin(req))) return json({ error: 'forbidden' }, 403);
  if (!env.CF_API_TOKEN) return json({ error: 'dbg', detail: 'Worker sees env: ' + Object.keys(env).join(', ') });
  const h = { Authorization: 'Bearer ' + env.CF_API_TOKEN, 'Content-Type': 'application/json' };
  try {
    let acc = env.CF_ACCOUNT_ID;
    if (!acc) {
      const r = await fetch('https://api.cloudflare.com/client/v4/accounts', { headers: h });
      const j = await r.json();
      acc = j && j.result && j.result[0] && j.result[0].id;
      if (!acc) return json({ error: 'no_account', detail: 'أضف CF_ACCOUNT_ID كمتغير في الـ Worker' });
    }
    const now = new Date();
    const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
    const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const q = `query($acc:String!,$day:Time!,$month:Time!,$now:Time!){viewer{accounts(filter:{accountTag:$acc}){
      w:workersInvocationsAdaptive(limit:1000,filter:{datetime_geq:$day,datetime_leq:$now}){sum{requests errors}}
      r:r2OperationsAdaptiveGroups(limit:1000,filter:{datetime_geq:$month,datetime_leq:$now}){dimensions{actionType} sum{requests}}
    }}}`;
    const r = await fetch('https://api.cloudflare.com/client/v4/graphql', {
      method: 'POST', headers: h,
      body: JSON.stringify({ query: q, variables: { acc: acc, day: day, month: month, now: now.toISOString() } })
    });
    const j = await r.json();
    const a = j && j.data && j.data.viewer && j.data.viewer.accounts && j.data.viewer.accounts[0];
    if (!a) return json({ error: 'cf', detail: JSON.stringify(j && (j.errors || j)).slice(0, 300) });
    let req_day = 0, err_day = 0, A = 0, B = 0;
    (a.w || []).forEach(x => { req_day += x.sum.requests || 0; err_day += x.sum.errors || 0; });
    (a.r || []).forEach(x => {
      const n = x.sum.requests || 0, t = x.dimensions.actionType;
      if (CLASS_A.indexOf(t) >= 0) A += n; else if (/^Delete/.test(t)) return; else B += n;
    });
    return json({ workers_today: req_day, workers_errors: err_day, r2_class_a: A, r2_class_b: B });
  } catch (e) {
    return json({ error: 'cf', detail: String(e).slice(0, 200) });
  }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/api/img') return img(req, env, url);
    if (url.pathname === '/api/data' || url.pathname.startsWith('/api/data/')) return data(req, env, url);
    if (url.pathname === '/api/admin/metrics') return metrics(req, env);
    if (url.pathname === '/api/admin/list' || url.pathname === '/api/admin/get') return adminR2(req, env, url);
    if (url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404);
    return env.ASSETS.fetch(req);
  }
};
