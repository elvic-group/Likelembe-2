# Likelembe 2: Money Rotation Bot (ROSCA)

A professional WhatsApp-based ROSCA (Money Rotation) bot integrated with ChatGPT for assistance and Stripe for real payments.

## 🚀 Live Status
- **Backend (Vercel):** [https://likelembe-2.vercel.app](https://likelembe-2.vercel.app)
- **Dashboard:** [https://likelembe-2.vercel.app/dashboard](https://likelembe-2.vercel.app/dashboard)
- **Health Check:** [https://likelembe-2.vercel.app/api/health](https://likelembe-2.vercel.app/api/health)

## 🛠 Tech Stack
- **Engine:** Node.js (Express)
- **WhatsApp:** [Green API](https://green-api.com/)
- **AI:** OpenAI (GPT-4o)
- **Payments:** Stripe
- **Database:** Neon (PostgreSQL)
- **Infrastructure:** Vercel

## 📖 Features
- **Join/Create Groups:** Multi-group support via WhatsApp groups.
- **AI Assistant:** Responds to user queries naturally using ChatGPT.
- **Secure Payments:** Generates Stripe Checkout links for contributions.
- **Automated Payouts:** Express Stripe accounts for winners (Admin triggered).
- **Reminders:** Daily CRON endpoint to nudge pending participants.
- **Hardened Security:** SSL enforced, fail-fast configuration, and safe text handling.

## ⚙️ Operational Setup

### 1. Webhooks
- **Green API:** Point to `https://likelembe-2.vercel.app/webhook`.
- **Stripe:** Point to `https://likelembe-2.vercel.app/stripe-webhook` (event: `checkout.session.completed`).

### 2. CRON Job
Set a daily CRON task to hit:
`GET https://likelembe-2.vercel.app/api/cron/reminders`
**Header:** `Authorization: Bearer [CRON_SECRET]`

### 3. Required Environment Variables (Vercel)
- `GREEN_API_INSTANCE_ID`
- `GREEN_API_API_TOKEN`
- `OPENAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `DATABASE_URL` (Neon)
- `CRON_SECRET`

## 👨‍💻 Commands
- **join [Name]** - Join the current rotation circle.
- **pay** - Receive a payment link for the current round.
- **status** - Check your group standing and total pot.
- **setup** - Link your bank account via Stripe for payouts.
- **start** - (Admin) Begin the money rotation cycle.
- **payout** - (Admin) Trigger the transfer to the current winner.

---
*Created by Gemini CLI*