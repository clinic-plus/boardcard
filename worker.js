// Boardcard Worker: question images (admin only). Static site is served by the assets binding.
const SB = 'https://zpyajqolfdnhdnlvmura.supabase.co';
const KEY = 'sb_publishable_Y-WPWul8817xMEdAHjCjwQ_-tQ4Y2Ii';
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
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }
  });

// Reads the request body but stops as soon as it passes `max` bytes, so a request without a
// Content-Length (or with a false one) cannot make the Worker buffer a huge upload in memory.
// Returns an ArrayBuffer, or null when the body is larger than `max`.
async function readCapped(req, max) {
  const len = parseInt(req.headers.get('Content-Length') || '0', 10);
  if (len > max) return null;
  if (!req.body) return new ArrayBuffer(0);
  const rd = req.body.getReader(), parts = [];
  let n = 0;
  for (;;) {
    const { done, value } = await rd.read();
    if (done) break;
    n += value.byteLength;
    if (n > max) { try { await rd.cancel(); } catch (e) {} return null; }
    parts.push(value);
  }
  const out = new Uint8Array(n);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.byteLength; }
  return out.buffer;
}

// Optional per-account limit on student-data requests. It works only when a Rate Limiting binding named RL
// is added to the Worker (see wrangler config); without it this does nothing. Limiting by account (not by IP)
// means students sharing one mobile-network IP never block each other.
async function limited(env, id) {
  try {
    if (!env.RL) return false;
    const r = await env.RL.limit({ key: 'u:' + id });
    return !r.success;
  } catch (e) {
    return false;
  }
}

// Per-IP limit (binding RLIP) for requests that cost a Supabase call; also used to cap anonymous junk.
const ipOf = req => req.headers.get('CF-Connecting-IP') || '0';
async function limitedBy(b, key) {
  try { return b ? !(await b.limit({ key })).success : false; } catch (e) { return false; }
}

// ---- Token checks ----
const b64u = x => { x = x.replace(/-/g, '+').replace(/_/g, '/'); return Uint8Array.from(atob(x + '='.repeat((4 - x.length % 4) % 4)), c => c.charCodeAt(0)); };
const bearer = req => { const m = /^Bearer\s+(\S+)$/.exec(req.headers.get('Authorization') || ''); return m ? m[1] : null; };

// Public signing keys of the Supabase project, cached for 10 minutes (a stale copy is kept if Supabase is briefly unreachable).
let JWKS = { at: 0, keys: null };
async function jwks() {
  const now = Date.now();
  if (JWKS.keys && now - JWKS.at < 600000) return JWKS.keys;
  try {
    const r = await fetch(SB + '/auth/v1/.well-known/jwks.json', { headers: { apikey: KEY } });
    if (r.ok) {
      const j = await r.json();
      if (j && Array.isArray(j.keys)) { JWKS = { at: now, keys: j.keys }; return JWKS.keys; }
    }
  } catch (e) {}
  return JWKS.keys;
}

// Verifies the token signature here, with no call to Supabase. Returns {id, sid, token} or null when the token is
// invalid, or undefined when it cannot be decided locally (legacy HS256 signing, no keys) so the caller falls back.
async function verifyLocal(token) {
  try {
    const p = token.split('.');
    if (p.length !== 3) return null;
    const head = JSON.parse(new TextDecoder().decode(b64u(p[0])));
    if (head.alg !== 'ES256' && head.alg !== 'RS256') return undefined;
    const keys = await jwks();
    const jwk = keys && keys.find(k => k.kid === head.kid && (!k.alg || k.alg === head.alg));
    if (!jwk) return undefined;
    const key = head.alg === 'ES256'
      ? await crypto.subtle.importKey('jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
      : await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const okSig = await crypto.subtle.verify(
      head.alg === 'ES256' ? { name: 'ECDSA', hash: 'SHA-256' } : { name: 'RSASSA-PKCS1-v1_5' },
      key, b64u(p[2]), new TextEncoder().encode(p[0] + '.' + p[1]));
    if (!okSig) return null;
    const c = JSON.parse(new TextDecoder().decode(b64u(p[1])));
    if (!c || c.iss !== SB + '/auth/v1' || c.aud !== 'authenticated' || c.role !== 'authenticated') return null;
    if (typeof c.exp !== 'number' || c.exp * 1000 < Date.now()) return null;
    if (!UUID_RE.test(c.sub || '')) return null;
    return { id: c.sub, sid: c.session_id || '', token: token };
  } catch (e) {
    return undefined;
  }
}

// Asks Supabase whether the token is valid (used for admin actions and as the fallback).
async function whoamiRemote(token) {
  try {
    const h = { apikey: KEY, Authorization: 'Bearer ' + token, Accept: 'application/json' };
    const u = await fetch(SB + '/auth/v1/user', { headers: h });
    if (!u.ok) return null;
    const user = await u.json();
    if (!user || !UUID_RE.test(user.id || '')) return null;
    return { id: user.id, sid: '', token: token };
  } catch (e) {
    return null;
  }
}

// Any signed-in user. Checked locally when possible, so a student request costs no extra Supabase call.
async function whoami(req, env) {
  const t = bearer(req);
  if (!t) return null;
  const l = await verifyLocal(t);
  if (l !== undefined) return l;
  // Undecidable locally (unknown kid / legacy signing): this falls back to a Supabase call, so cap it per IP.
  if (await limitedBy(env.RLIP, 'ip:' + ipOf(req))) return null;
  return await whoamiRemote(t);
}

const rpcH = token => ({ apikey: KEY, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Accept: 'application/json' });

// Admin check: a single call to the database function is_admin(), which also enforces the second login step.
async function isAdmin(req, env) {
  try {
    const t = bearer(req);
    if (!t) return false;
    // A forged or expired token is refused here, so junk requests to the admin routes never reach Supabase.
    const v = await verifyLocal(t);
    if (v === null) return false;
    if (v === undefined && await limitedBy(env.RLIP, 'ip:' + ipOf(req))) return false;
    const r = await fetch(SB + '/rest/v1/rpc/is_admin', { method: 'POST', headers: rpcH(t), body: '{}' });
    if (!r.ok) return false;
    return (await r.json()) === true;
  } catch (e) {
    return false;
  }
}

// {blocked, session} for a student write. Returns null when it cannot be read (Supabase hiccup): the write is then
// allowed, so a student never loses data because of a temporary outage.
async function gateOf(me) {
  try {
    const r = await fetch(SB + '/rest/v1/rpc/data_gate', { method: 'POST', headers: rpcH(me.token), body: '{}' });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    return null;
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
  if (!(await isAdmin(req, env))) return json({ error: 'forbidden' }, 403);

  if (req.method === 'DELETE') {
    const p = url.searchParams.get('path') || '';
    if (!PATH_RE.test(p)) return json({ error: 'bad_path' }, 400);
    await env.IMAGES.delete(p);
    return json({ ok: true });
  }

  const buf = await readCapped(req, MAX_BYTES);
  if (!buf) return json({ error: 'too_big' }, 413);
  if (buf.byteLength === 0) return json({ error: 'empty' }, 400);
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


// ---- AI explanations cache (D4) ----
// One shared explanation per question is kept in R2 (USERDATA bucket, prefix ai/). A student who may open the question
// (checked by the database function q_access, as that student) gets the stored text with no AI call and no daily-limit use.
// A miss calls the ai-explain Edge Function with the student's own token and stores the answer.
// The admin deletes the stored text (DELETE /api/ai?id=...) when a question is edited, so a stale explanation is never served.
const QID_RE = /^[A-Za-z0-9_-]{1,100}$/;
async function aiExplain(req, env, url) {
  if (req.method === 'DELETE') {
    if (!(await isAdmin(req, env))) return json({ error: 'forbidden' }, 403);
    const id = url.searchParams.get('id') || '';
    if (!QID_RE.test(id)) return json({ error: 'bad_id' }, 400);
    await env.USERDATA.delete('ai/' + id + '.json');
    return json({ ok: true });
  }
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  const me = await whoami(req, env);
  if (!me) return json({ error: 'unauthorized' }, 401);
  if (await limited(env, me.id)) return json({ error: 'busy' }, 429);
  let body;
  try { body = await req.json(); } catch (e) { return json({ error: 'bad_json' }, 400); }
  const qid = String((body && body.question_id) || '');
  if (!QID_RE.test(qid)) return json({ error: 'bad_request' }, 400);
  // may this student open this question? (subscriber + already answered, or admin)
  let acc = null;
  try {
    const r = await fetch(SB + '/rest/v1/rpc/q_access', { method: 'POST', headers: rpcH(me.token), body: JSON.stringify({ p_id: qid }) });
    if (r.status === 401) return json({ error: 'unauthorized' }, 401);
    if (r.ok) acc = await r.json();
  } catch (e) {}
  if (acc === 'no_sub') return json({ error: 'subscribers_only' }, 403);
  if (acc === 'not_seen') return json({ error: 'answer_first' }, 403);
  if (acc !== 'ok' && acc !== 'admin') return json({ error: 'not_found' }, 404);
  const key = 'ai/' + qid + '.json';
  try {
    const o = await env.USERDATA.get(key);
    if (o) {
      const j = await o.json();
      if (j && typeof j.t === 'string' && j.t) return json({ text: j.t, cached: true, alt: false });
    }
  } catch (e) {}
  let r;
  try {
    r = await fetch(SB + '/functions/v1/ai-explain', {
      method: 'POST',
      headers: { apikey: KEY, Authorization: 'Bearer ' + me.token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: qid })
    });
  } catch (e) { return json({ error: 'ai_failed' }, 502); }
  let out = null;
  try { out = await r.json(); } catch (e) {}
  if (!out) return json({ error: 'ai_failed' }, 502);
  if (r.ok && out.text && !out.alt) {
    try { await env.USERDATA.put(key, JSON.stringify({ t: out.text, at: Date.now() }), { httpMetadata: { contentType: 'application/json' } }); } catch (e) {}
  }
  return json(out, r.status);
}

async function data(req, env, url) {
  const m = /^\/api\/data\/(notes|pq|progress)$/.exec(url.pathname);
  if (m) {
    const k = KINDS[m[1]];
    const me = await whoami(req, env);
    if (!me) return json({ error: 'forbidden' }, 403);
    const key = 'users/' + me.id + '/' + k.file;
    if (await limited(env, me.id)) return json({ error: 'rate' }, 429);
    if (req.method === 'GET') {
      const o = await env.USERDATA.get(key);
      if (!o) return json({ error: 'none' }, 404);
      return new Response(o.body, { headers: { 'Content-Type': 'application/gzip', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Data-Etag': o.etag } });
    }
    if (req.method === 'PUT') {
      // Writes are the costly R2 operation: a tighter per-account limit than reads.
      if (await limitedBy(env.RLW, 'w:' + me.id)) return json({ error: 'rate' }, 429);
      // A blocked account, or a device whose session was replaced by a newer login, cannot write.
      const g = await gateOf(me);
      if (g && g.blocked) return json({ error: 'blocked' }, 403);
      if (g && g.session === false) return json({ error: 'session_replaced' }, 409);
      const buf = await readCapped(req, k.max);
      if (!buf) return json({ error: 'too_big' }, 413);
      if (buf.byteLength < 20) return json({ error: 'empty' }, 400);
      const b = new Uint8Array(buf, 0, 3);
      if (b[0] !== 0x1f || b[1] !== 0x8b || b[2] !== 0x08) return json({ error: 'bad_type' }, 415);
      // Optional conflict check: the device sends the ETag it last read; if the file changed meanwhile it must merge first.
      const ifTag = (req.headers.get('X-If-Etag') || '').replace(/[^0-9a-zA-Z_-]/g, '');
      const opts = { httpMetadata: { contentType: 'application/gzip' } };
      if (ifTag) opts.onlyIf = { etagMatches: ifTag };
      const put = await env.USERDATA.put(key, buf, opts);
      if (!put) return json({ error: 'conflict' }, 412);
      return new Response(JSON.stringify({ ok: true, size: buf.byteLength }), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Data-Etag': put.etag }
      });
    }
    return json({ error: 'method' }, 405);
  }
  if (url.pathname === '/api/data' && req.method === 'DELETE') {
    if (!(await isAdmin(req, env))) return json({ error: 'forbidden' }, 403);
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
  if (req.method !== 'GET') return json({ error: 'method' }, 405);
  if (!(await isAdmin(req, env))) return json({ error: 'forbidden' }, 403);
  const b = url.searchParams.get('b');
  const bucket = b === 'img' ? env.IMAGES : b === 'user' ? env.USERDATA : null;
  if (!bucket) return json({ error: 'bad_bucket' }, 400);
  if (url.pathname === '/api/admin/list') {
    const l = await bucket.list({ limit: 1000, cursor: url.searchParams.get('cursor') || undefined });
    return json({
      objects: l.objects.filter(o => b !== 'user' || o.key.startsWith('users/')).map(o => ({ key: o.key, size: o.size, at: o.uploaded ? new Date(o.uploaded).getTime() : 0 })),
      cursor: l.truncated ? l.cursor : null
    });
  }
  if (url.pathname === '/api/admin/get') {
    const key = url.searchParams.get('key') || '';
    const okKey = b === 'img' ? PATH_RE.test(key) : /^users\/[0-9a-f-]{36}\/(notes|questions|progress)\.json\.gz$/i.test(key);
    if (!okKey) return json({ error: 'bad_key' }, 400);
    const o = await bucket.get(key);
    if (!o) return json({ error: 'none' }, 404);
    return new Response(o.body, { headers: { 'Content-Type': 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  }
  return json({ error: 'not_found' }, 404);
}

// Usage metrics from the Cloudflare GraphQL API. Needs the secret CF_API_TOKEN (Account Analytics: Read).
const CLASS_A = ['ListBuckets','PutBucket','ListObjects','ListObjectsV2','PutObject','CopyObject','CompleteMultipartUpload','CreateMultipartUpload','ListMultipartUploads','UploadPart','UploadPartCopy','PutBucketEncryption','PutBucketCors','PutBucketLifecycleConfiguration','LifecycleStorageTierTransition'];
async function metrics(req, env) {
  if (!(await isAdmin(req, env))) return json({ error: 'forbidden' }, 403);
  // The admin page shows the setup hint for this exact code.
  if (!env.CF_API_TOKEN) return json({ error: 'no_token' });
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

// The admin page can live on its own host (variable ADMIN_HOST, e.g. admin.boardcard.net) so that its login token is
// stored on a different origin from the student site. Empty ADMIN_HOST = old behaviour (same host for both).
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const AH = String(env.ADMIN_HOST || '').trim().toLowerCase();
    if (AH && !url.pathname.startsWith('/api/')) {
      const onAdmin = url.hostname.toLowerCase() === AH;
      if (onAdmin && url.pathname === '/') return env.ASSETS.fetch(new Request(new URL('/admin', url), req));
      if (!onAdmin && (url.pathname === '/admin' || url.pathname === '/admin.html')) return Response.redirect('https://' + AH + '/', 302);
      // The student app must never run on the admin host (an XSS bug there would reach the admin login token).
      if (onAdmin && (url.pathname === '/index.html' || url.pathname === '/index')) return Response.redirect('https://' + AH.replace(/^admin\./, '') + '/', 302);
    }
    try {
      if (url.pathname === '/api/img') return await img(req, env, url);
      if (url.pathname === '/api/ai') return await aiExplain(req, env, url);
      if (url.pathname === '/api/data' || url.pathname.startsWith('/api/data/')) return await data(req, env, url);
      if (url.pathname === '/api/admin/metrics') return await metrics(req, env);
      if (url.pathname === '/api/admin/list' || url.pathname === '/api/admin/get') return await adminR2(req, env, url);
    } catch (e) {
      // An R2 or network failure answers with clean JSON instead of Cloudflare's error page.
      return json({ error: 'server' }, 500);
    }
    if (url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404);
    return env.ASSETS.fetch(req);
  }
};
