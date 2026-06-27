# 🌐 NexSite — AI Website Builder SaaS MVP

> Build professional websites for Indian small businesses in minutes using AI.
> Includes full **Customer CMS** so owners can edit their content anytime.

---

## 📁 Project Structure

```
nexsite/
├── server.js                     ← Express entry point (all routes)
├── package.json
├── .env.example                  ← Copy to .env and fill in keys
│
├── database/
│   ├── schema.sql                ← Run FIRST in Supabase SQL Editor
│   └── schema_cms.sql            ← Run SECOND (adds CMS + auth columns)
│
├── middleware/
│   └── auth.js                   ← JWT verification for CMS routes
│
├── routes/
│   ├── ai.js                     ← POST /api/generate
│   ├── websites.js               ← GET/POST /api/websites
│   ├── leads.js                  ← POST /api/leads
│   ├── payments.js               ← Razorpay create-order + verify
│   ├── admin.js                  ← Admin data endpoints
│   ├── auth.js                   ← POST /api/auth/login|register|refresh
│   └── cms.js                    ← PATCH /api/cms/:id/* (protected)
│
├── services/
│   ├── grokService.js            ← Grok AI generation + retry logic
│   ├── supabaseService.js        ← All DB operations
│   └── razorpayService.js        ← Order creation + signature verify
│
├── utils/
│   ├── slugify.js
│   └── validateJson.js
│
└── frontend/
    ├── index.html                ← Landing page
    ├── login.html                ← Customer login / register
    ├── chat.html                 ← WhatsApp-style AI builder
    ├── preview.html              ← Live preview + plan + payment
    ├── dashboard.html            ← 🆕 Customer CMS dashboard
    ├── site.html                 ← Public website renderer
    ├── admin.html                ← Admin dashboard
    ├── css/
    │   ├── style.css             ← Global dark theme
    │   └── templates.css         ← All 5 template styles
    └── js/
        ├── api.js                ← Central API helper + toast
        ├── cms.js                ← 🆕 CMS auth helpers + API calls
        ├── main.js               ← Landing page JS
        ├── chat.js               ← Chat state machine
        ├── preview.js            ← Preview + payment flow
        ├── templates.js          ← 5 website template renderers
        ├── site.js               ← Public site loader + FAQ + form
        └── admin.js              ← Admin dashboard data
```

---

## 🚀 Setup Guide (5 Steps)

### Step 1 — Extract & Install

```bash
tar -xzf nexsite-mvp.tar.gz
cd nexsite
npm install
```

### Step 2 — Create `.env`

```bash
cp .env.example .env
```

Fill in all values in `.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key

GROK_API_KEY=your-grok-key
GROK_API_URL=https://api.x.ai/v1/chat/completions
GROK_MODEL=grok-2-latest

RAZORPAY_KEY_ID=your-rzp-key-id
RAZORPAY_KEY_SECRET=your-rzp-secret

FRONTEND_URL=http://localhost:5000
BACKEND_URL=http://localhost:5000
PORT=5000
```

### Step 3 — Setup Supabase

1. Go to [supabase.com](https://supabase.com) → New project
2. Open **SQL Editor**
3. Paste contents of `database/schema.sql` → **Run**
4. Paste contents of `database/schema_cms.sql` → **Run**
5. Go to **Authentication → Settings**:
   - Enable **Email** provider
   - Set **Site URL** to `http://localhost:5000`
   - Under **Email Templates**, disable email confirmation for local dev (optional)
6. Copy **Project URL**, **anon key**, **service role key** into `.env`

### Step 4 — Get API Keys

| Service | Where to get it |
|---------|----------------|
| **Grok AI** | [console.x.ai](https://console.x.ai) → API Keys |
| **Razorpay** | [dashboard.razorpay.com](https://dashboard.razorpay.com) → Settings → API Keys |
| **Supabase** | Project Settings → API |

### Step 5 — Run

```bash
npm run dev
# Opens at http://localhost:5000
```

---

## 🌐 All Pages

| URL | Page | Who uses it |
|-----|------|-------------|
| `/` | Landing page | Everyone |
| `/login.html` | Sign in / Register | Customers |
| `/chat.html` | AI Chat Builder | New customers |
| `/preview.html` | Preview + Payment | New customers |
| `/dashboard.html` | **CMS Dashboard** | Logged-in customers |
| `/site.html?slug=...` | Live public website | Website visitors |
| `/admin.html` | Admin panel | You |

---

## 🔌 API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/generate` | Generate AI content |
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/auth/refresh` | Refresh token |
| `GET`  | `/api/websites/:slug` | Get published website |
| `POST` | `/api/leads` | Submit contact form lead |
| `POST` | `/api/payments/create-order` | Create Razorpay order |
| `POST` | `/api/payments/verify` | Verify payment |

### Protected (requires `Authorization: Bearer <token>`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/cms/my-websites` | List customer's websites |
| `GET`  | `/api/cms/:id` | Get website for editing |
| `PATCH`| `/api/cms/:id/hero` | Update hero text |
| `PATCH`| `/api/cms/:id/about` | Update about section |
| `PUT`  | `/api/cms/:id/services` | Replace services list |
| `PUT`  | `/api/cms/:id/faq` | Replace FAQ list |
| `PATCH`| `/api/cms/:id/contact` | Update contact info |
| `PATCH`| `/api/cms/:id/branding` | Update name + logo |
| `PATCH`| `/api/cms/:id/seo` | Update SEO + CTA |
| `GET`  | `/api/cms/:id/history` | Edit audit log |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/api/admin/websites` | All websites |
| `GET`  | `/api/admin/leads` | All leads |
| `GET`  | `/api/admin/stats` | Dashboard stats |

---

## 💳 Pricing Plans

| Plan | Setup | Monthly | Features |
|------|-------|---------|----------|
| Starter | ₹299 | ₹59 | Free subdomain, contact form, WhatsApp button |
| Premium | ₹999 | ₹99 | Custom domain, SEO, priority support |

---

## 🏗️ Customer Flow

```
Register → Login → Chat Builder → AI Generates →
Preview & Pick Template → Pay via Razorpay →
Website Published → Dashboard CMS → Edit Anytime
```

### CMS Dashboard Sections
- **Hero** — Main headline + tagline
- **About** — About section heading + description  
- **Services** — Add / edit / delete services (unlimited)
- **FAQ** — Add / edit / delete FAQs (unlimited)
- **Contact** — Phone, email, address (updates WhatsApp button too)
- **Branding** — Business name + logo URL with live preview
- **SEO & CTA** — Meta title, description, call-to-action section

All changes go **live instantly** — no approval needed.

---

## 🚢 Deployment

### Backend → Railway or Render
```bash
# Set all .env variables in your Railway/Render dashboard
# Start command: npm start
# Build command: npm install
```

### Frontend → Same server (Express serves static files)
All HTML/CSS/JS lives in `/frontend` and is served by Express automatically.

---

## 🔒 Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` is **never** sent to the frontend
- `RAZORPAY_KEY_SECRET` is **never** sent to the frontend  
- `GROK_API_KEY` is **never** sent to the frontend
- All CMS writes require a valid Supabase JWT
- Row Level Security (RLS) on Supabase prevents cross-user data access
- Rate limiting: 10 AI generations per 15 min per IP

---

## 📞 Support

Built by **SoftZen Technologies** — Kiran H.
