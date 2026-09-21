/**
 * Local stand-in for the Supabase Kong gateway: PostgREST under /rest/v1
 * and a small GoTrue-compatible auth API under /auth/v1 so the Next.js
 * app can sign people in with magic links without Docker.
 */
import http from "node:http"
import { createHmac, randomBytes, createHash } from "node:crypto"
import { execFileSync } from "node:child_process"
import { writeFileSync } from "node:fs"

const POSTGREST = process.env.POSTGREST_URL ?? "http://127.0.0.1:54323"
const PORT = Number(process.env.GATEWAY_PORT ?? 54321)
const JWT_SECRET = process.env.JWT_SECRET
const PSQL = process.env.PSQL_BIN
const PGHOST = process.env.PGHOST ?? "127.0.0.1"
const PGPORT = process.env.PGPORT ?? "54322"
const PGUSER = process.env.PGUSER ?? "postgres"
const PGDATABASE = process.env.PGDATABASE ?? "postgres"
const MAILBOX = process.env.MAILBOX_PATH
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"

if (!JWT_SECRET || !PSQL) {
  console.error("JWT_SECRET and PSQL_BIN are required")
  process.exit(1)
}

const pendingByEmail = new Map()
const codes = new Map()
const refreshTokens = new Map()

function b64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "")
}

function signJwt(payload) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const body = b64url(JSON.stringify(payload))
  const sig = createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "")
  return `${header}.${body}.${sig}`
}

function verifyJwt(token) {
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const expected = createHmac("sha256", JWT_SECRET)
    .update(`${parts[0]}.${parts[1]}`)
    .digest("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "")
  if (expected !== parts[2]) return null
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString())
  } catch {
    return null
  }
}

function sql(query) {
  const out = execFileSync(
    PSQL,
    ["-h", PGHOST, "-p", PGPORT, "-U", PGUSER, "-d", PGDATABASE, "-Atq", "-c", query],
    { encoding: "utf8" }
  ).trim()
  return out.split("\n")[0] ?? ""
}

function quote(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

function publicUser(row) {
  return {
    id: row.id,
    aud: "authenticated",
    role: "authenticated",
    email: row.email,
    email_confirmed_at: row.email_confirmed_at ?? new Date().toISOString(),
    phone: "",
    confirmed_at: row.confirmed_at ?? new Date().toISOString(),
    last_sign_in_at: row.last_sign_in_at,
    app_metadata: row.raw_app_meta_data ?? { provider: "email", providers: ["email"] },
    user_metadata: row.raw_user_meta_data ?? {},
    identities: [],
    created_at: row.created_at,
    updated_at: row.updated_at,
    is_anonymous: false,
  }
}

function loadUserByEmail(email) {
  const raw = sql(
    `select row_to_json(u) from auth.users u where lower(email) = lower(${quote(email)}) limit 1`
  )
  return raw ? JSON.parse(raw) : null
}

function loadUserById(id) {
  const raw = sql(`select row_to_json(u) from auth.users u where id = ${quote(id)}::uuid limit 1`)
  return raw ? JSON.parse(raw) : null
}

function createUserRow(email, confirmed = true) {
  const raw = sql(
    `with u as (
       insert into auth.users (email, email_confirmed_at, confirmed_at)
       values (${quote(email)}, ${confirmed ? "now()" : "null"}, ${confirmed ? "now()" : "null"})
       returning *
     )
     select row_to_json(u) from u`
  )
  return JSON.parse(raw)
}

function sessionFor(user) {
  const now = Math.floor(Date.now() / 1000)
  const expiresIn = 60 * 60 * 24 * 7
  const accessToken = signJwt({
    aud: "authenticated",
    role: "authenticated",
    sub: user.id,
    email: user.email,
    iat: now,
    exp: now + expiresIn,
  })
  const refreshToken = randomBytes(24).toString("hex")
  refreshTokens.set(refreshToken, user.id)
  return {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: expiresIn,
    expires_at: now + expiresIn,
    refresh_token: refreshToken,
    user: publicUser(user),
  }
}

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Headers", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
  res.setHeader("Access-Control-Expose-Headers", "*")
}

function json(res, status, body) {
  cors(res)
  res.writeHead(status, { "Content-Type": "application/json" })
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (!chunks.length) return ""
  return Buffer.concat(chunks).toString("utf8")
}

function writeMailbox(entry) {
  if (!MAILBOX) return
  writeFileSync(MAILBOX, JSON.stringify(entry, null, 2))
}

async function handleAuth(req, res, url) {
  cors(res)
  if (req.method === "OPTIONS") {
    res.writeHead(204)
    res.end()
    return
  }

  const path = url.pathname.replace(/^\/auth\/v1/, "")

  if (path === "/health") {
    json(res, 200, { status: "ok" })
    return
  }

  if (req.method === "POST" && path === "/otp") {
    const body = JSON.parse((await readBody(req)) || "{}")
    const email = String(body.email ?? "").trim().toLowerCase()
    if (!email) {
      json(res, 400, { error: "email required", msg: "email required" })
      return
    }
    let user = loadUserByEmail(email)
    if (!user) user = createUserRow(email, true)
    const token = randomBytes(16).toString("hex")
    pendingByEmail.set(token, {
      userId: user.id,
      email,
      codeChallenge: body.code_challenge ?? null,
      redirectTo: body.redirect_to ?? body.gotrue_meta_security?.redirect_to ?? `${SITE_URL}/auth/callback`,
    })
    const verifyUrl = `http://127.0.0.1:${PORT}/auth/v1/verify?token=${token}&type=magiclink&redirect_to=${encodeURIComponent(pendingByEmail.get(token).redirectTo)}`
    writeMailbox({ email, verifyUrl, createdAt: new Date().toISOString() })
    console.log(`Magic link for ${email}: ${verifyUrl}`)
    json(res, 200, {})
    return
  }

  if (req.method === "GET" && path === "/verify") {
    const token = url.searchParams.get("token")
    const redirectTo = url.searchParams.get("redirect_to") || `${SITE_URL}/auth/callback`
    const pending = token ? pendingByEmail.get(token) : null
    if (!pending) {
      res.writeHead(302, { Location: `${SITE_URL}/sign-in?error=link` })
      res.end()
      return
    }
    pendingByEmail.delete(token)
    const code = randomBytes(16).toString("hex")
    codes.set(code, pending)
    const next = new URL(redirectTo, SITE_URL)
    next.searchParams.set("code", code)
    res.writeHead(302, { Location: next.toString() })
    res.end()
    return
  }

  if (req.method === "POST" && path === "/token") {
    const body = JSON.parse((await readBody(req)) || "{}")
    const grant = url.searchParams.get("grant_type") || body.grant_type
    if (grant === "refresh_token") {
      const userId = refreshTokens.get(body.refresh_token)
      const user = userId ? loadUserById(userId) : null
      if (!user) {
        json(res, 401, { error: "invalid_grant", msg: "Invalid refresh token" })
        return
      }
      json(res, 200, sessionFor(user))
      return
    }
    const pending = codes.get(body.auth_code || body.code)
    if (!pending) {
      json(res, 401, { error: "invalid_grant", msg: "Invalid auth code" })
      return
    }
    if (pending.codeChallenge) {
      const verifier = String(body.code_verifier ?? "")
      const challenge = b64url(createHash("sha256").update(verifier).digest())
      if (challenge !== pending.codeChallenge) {
        json(res, 401, { error: "invalid_grant", msg: "Invalid code verifier" })
        return
      }
    }
    codes.delete(body.auth_code || body.code)
    const user = loadUserById(pending.userId)
    if (!user) {
      json(res, 401, { error: "invalid_grant", msg: "User not found" })
      return
    }
    json(res, 200, sessionFor(user))
    return
  }

  if (req.method === "GET" && path === "/user") {
    const auth = req.headers.authorization ?? ""
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
    const claims = verifyJwt(token)
    if (!claims?.sub) {
      json(res, 401, { error: "invalid_token", msg: "Invalid token" })
      return
    }
    const user = loadUserById(claims.sub)
    if (!user) {
      json(res, 401, { error: "invalid_token", msg: "User not found" })
      return
    }
    json(res, 200, publicUser(user))
    return
  }

  if (req.method === "POST" && path === "/logout") {
    json(res, 204, {})
    return
  }

  if (req.method === "POST" && path === "/admin/users") {
    const body = JSON.parse((await readBody(req)) || "{}")
    const email = String(body.email ?? "").trim().toLowerCase()
    if (!email) {
      json(res, 400, { msg: "email required" })
      return
    }
    const existing = loadUserByEmail(email)
    if (existing) {
      json(res, 422, { msg: "A user with this email address has already been registered" })
      return
    }
    const user = createUserRow(email, body.email_confirm !== false)
    json(res, 200, publicUser(user))
    return
  }

  if (req.method === "GET" && path === "/admin/users") {
    const raw = sql(`select coalesce(json_agg(row_to_json(u)), '[]'::json) from auth.users u`)
    const users = JSON.parse(raw || "[]").map(publicUser)
    json(res, 200, { users, aud: "authenticated" })
    return
  }

  json(res, 404, { msg: `auth route not implemented: ${req.method} ${path}` })
}

async function proxyRest(req, res, url) {
  if (req.method === "OPTIONS") {
    cors(res)
    res.writeHead(204)
    res.end()
    return
  }
  const target = POSTGREST + url.pathname.replace(/^\/rest\/v1/, "") + url.search
  const body = await readBody(req)
  const headers = {}
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null || key === "host" || key === "content-length") continue
    headers[key] = Array.isArray(value) ? value.join(",") : value
  }
  const response = await fetch(target, {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : body,
  })
  cors(res)
  const skip = new Set(["transfer-encoding", "connection"])
  for (const [key, value] of response.headers.entries()) {
    if (!skip.has(key.toLowerCase())) res.setHeader(key, value)
  }
  res.writeHead(response.status)
  res.end(Buffer.from(await response.arrayBuffer()))
}

const server = http.createServer(async function handle(req, res) {
  try {
    const url = new URL(req.url ?? "/", `http://${req.headers.host}`)
    if (url.pathname.startsWith("/auth/v1")) {
      await handleAuth(req, res, url)
      return
    }
    if (url.pathname.startsWith("/rest/v1")) {
      await proxyRest(req, res, url)
      return
    }
    cors(res)
    json(res, 404, { msg: "not found" })
  } catch (error) {
    console.error(error)
    if (!res.headersSent) json(res, 500, { msg: error instanceof Error ? error.message : "error" })
  }
})

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Local API gateway on http://127.0.0.1:${PORT}`)
})
