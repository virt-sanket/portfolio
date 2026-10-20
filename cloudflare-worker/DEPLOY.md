# ══════════════════════════════════════════════════════════════════
#  CLOUDFLARE DEPLOYMENT GUIDE — SK Portfolio Admin System
# ══════════════════════════════════════════════════════════════════

## WHAT YOU'RE DEPLOYING

| Component | What it is | Where |
|-----------|-----------|-------|
| Admin Panel | `admin.html` + `admin.css` + `admin.js` | Your existing site |
| Backend API | `cloudflare-worker/worker.js` | Cloudflare Workers (free) |
| Database | Cloudflare KV | Cloudflare (free 100k reads/day) |
| Email | MailChannels via Workers | Free (included with Workers) |

---

## STEP 1 — Install Wrangler CLI

```bash
npm install -g wrangler
wrangler login
```

---

## STEP 2 — Create KV Namespaces

Run these commands and copy the IDs they give you:

```bash
cd cloudflare-worker

wrangler kv:namespace create PORTFOLIO_DATA
# → Copy the id: "xxxxxxxx..."

wrangler kv:namespace create SESSIONS
# → Copy the id: "yyyyyyyy..."
```

Then open `wrangler.toml` and replace the placeholder IDs:
```toml
[[kv_namespaces]]
binding = "PORTFOLIO_DATA"
id = "xxxxxxxx..."   ← paste here

[[kv_namespaces]]
binding = "SESSIONS"
id = "yyyyyyyy..."   ← paste here
```

Also set your domain:
```toml
[vars]
SITE_URL = "https://yourdomain.com"   ← your actual domain

[[routes]]
pattern = "yourdomain.com/api/*"      ← your actual domain
zone_name = "yourdomain.com"          ← your actual domain
```

---

## STEP 3 — Deploy the Worker

```bash
cd cloudflare-worker
wrangler deploy
```

You should see: `✅ Deployed sk-portfolio-api`

---

## STEP 4 — Enable MailChannels (Free OTP Email)

MailChannels works automatically with Cloudflare Workers — no API key needed.

> **Important:** You must add a DNS TXT record to authorize your domain:
> 1. Go to Cloudflare Dashboard → DNS
> 2. Add TXT record:
>    - Name: `_mailchannels`
>    - Value: `v=mc1 cfid=yourdomain.com`

---

## STEP 5 — Deploy Your Site Files

Upload all files in `c:\website\` to Cloudflare Pages:

**Option A — Cloudflare Pages (recommended):**
1. Go to **Cloudflare Dashboard → Pages → Create a project**
2. Connect your GitHub repo OR upload directly
3. Build command: (leave empty — it's static HTML)
4. Output directory: `/`

**Option B — via Wrangler:**
```bash
cd c:\website
wrangler pages deploy . --project-name=sk-portfolio
```

---

## STEP 6 — Test the Admin Panel

1. Visit `https://yourdomain.com/admin.html`
2. Click **Send OTP**
3. Check `kandel.sanket@gmail.com` for the 6-digit code
4. Enter it → you're in!

---

## ANALYTICS TRACKING

Add this snippet to every HTML page (before `</body>`):

```html
<script>
  fetch('/api/track', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ page: location.pathname })
  }).catch(() => {});
</script>
```

A script `tracker.js` is included — just add `<script src="tracker.js"></script>` to all pages.

---

## SECURITY NOTES

- Admin panel is `noindex` — not indexed by search engines
- Sessions expire after 24 hours automatically (KV TTL)
- OTPs expire after 10 minutes
- All admin API routes require a valid session token
- The `admin.html` page is NOT protected by Cloudflare Access by default
  → For extra security, add **Cloudflare Access** policy to protect `/admin.html`

---

## CLOUDFLARE FREE TIER LIMITS

| Resource | Free Limit | Your Usage |
|----------|-----------|-----------|
| Workers requests | 100,000/day | API calls only |
| KV reads | 100,000/day | Portfolio data |
| KV writes | 1,000/day | Saves & edits |
| KV storage | 1 GB | Blog + projects |
| Pages bandwidth | Unlimited | Site files |

All well within free limits for a personal portfolio.

---

## TROUBLESHOOTING

**OTP not received?**
- Check spam folder
- Verify `_mailchannels` DNS TXT record is set
- Check Worker logs: `wrangler tail`

**API 401 errors?**
- Your session expired — log in again
- Check that Worker is deployed to correct route

**KV reads returning nothing?**
- Normal on first use — save something from admin panel first

---

## FILE STRUCTURE

```
c:\website\
├── admin.html          ← Admin panel (OTP login + full editor)
├── admin.css           ← Admin styles
├── admin.js            ← Admin frontend JS
├── tracker.js          ← Analytics tracking (add to all pages)
├── index.html          ← Portfolio home
├── about.html
├── projects.html
├── skills.html
├── blog.html           ← Now loads posts dynamically from API
├── contact.html
├── style.css
├── components.css
├── components.js
└── cloudflare-worker/
    ├── worker.js       ← Backend API (deploy this)
    └── wrangler.toml   ← Cloudflare configuration
```
