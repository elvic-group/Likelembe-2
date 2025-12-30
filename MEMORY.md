# Project Memory: Likelembe 2
Created: Monday, December 29, 2025

## 1. Goal
Build a WhatsApp-based ROSCA (Money Rotation) bot using Green API, integrated with ChatGPT for assistance and Stripe for real payments, backed by a Neon PostgreSQL database.

## 2. Technical Milestones Completed
- **Environment**: Node.js project initialized with `express`, `dotenv`, `@green-api/whatsapp-api-client`, `openai`, `stripe`, and `pg`.
- **Logic Layer**: Created `roscaManager.js` to handle rotation logic (Join, Start, Pay, Status).
- **AI Integration**: Integrated ChatGPT via `aiService.js` to handle any non-command messages.
- **Payment Integration**: Set up `stripeService.js` to generate live checkout links for contributions.
- **Data Layer**: Migrated from Neon PostgreSQL to **Bunny.net (LibSQL)**. Using a custom adapter in `db.js` to translate Postgres queries to SQLite syntax on the fly.
- **Infrastructure**: 
    - Deployed to Vercel: [https://likelembe-2.vercel.app](https://likelembe-2.vercel.app)
    - Pushed to GitHub: [https://github.com/elvic-group/Likelembe-2](https://github.com/elvic-group/Likelembe-2)
- **Tooling**: Configured Gemini CLI MCP for Vercel and GitHub using your provided API keys.

## 3. Credentials Provided (Stored in .env)
- **OpenAI**: sk-proj-... (Stripe - Elvic Adventures)
- **Stripe**: sk_live_... / pk_live_...
- **Bunny.net**: API Key (e499...) - *Database URL needed*
- **Vercel**: dH8g...
- **GitHub**: ghp_M7ot... (Push access to elvic-group)

## 4. Current State
- The code is production-ready and deployed to Vercel (Code updated for Bunny DB).
- **Immediate Action Required**: 
    1. **Bunny DB**: Create a database in Bunny.net, get the **HTTP URL** and **Auth Token**.
    2. **Env Vars**: Add `BUNNY_DB_URL` and `BUNNY_DB_AUTH_TOKEN` to Vercel Environment Variables (and `OPENAI_API_KEY`, `STRIPE_...`, etc.).
    3. **Init DB**: Run `init_db.js` locally (with `BUNNY_DB_URL` set in `.env`) or find a way to run it against the Bunny DB to create tables.
- **Webhook Connection**: The Green API console needs the webhook URL set to `https://likelembe-2.vercel.app/webhook`.

## 5. Future Roadmap
- Implement a Stripe Webhook listener to automatically mark participants as "Paid" once the transaction is successful.
- Refactor `roscaManager` to use the `@green-api/whatsapp-chatbot-js-v2` SDK for multi-step conversation flows.
- Fix the local SSL connection to Neon (likely requires a local cert or specific proxy settings).
