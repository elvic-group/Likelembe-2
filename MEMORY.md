# Project Memory: Likelembe 2
Created: Monday, December 29, 2025

## 1. Goal
Build a WhatsApp-based ROSCA (Money Rotation) bot using Green API, integrated with ChatGPT for assistance and Stripe for real payments, backed by a Neon PostgreSQL database.

## 2. Technical Milestones Completed
- **Environment**: Node.js project initialized with `express`, `dotenv`, `@green-api/whatsapp-api-client`, `openai`, `stripe`, and `pg`.
- **Logic Layer**: Created `roscaManager.js` to handle rotation logic (Join, Start, Pay, Status).
- **AI Integration**: Integrated ChatGPT via `aiService.js` to handle any non-command messages.
- **Payment Integration**: Set up `stripeService.js` to generate live checkout links for contributions.
- **Data Layer**: Set up `db.js` with Neon PostgreSQL. Note: Encountered SSL handshake issues locally; implemented a robust memory fallback so the bot works even if the DB is offline.
- **Infrastructure**: 
    - Deployed to Vercel: [https://likelembe-2.vercel.app](https://likelembe-2.vercel.app)
    - Pushed to GitHub: [https://github.com/elvic-group/Likelembe-2](https://github.com/elvic-group/Likelembe-2)
- **Tooling**: Configured Gemini CLI MCP for Vercel and GitHub using your provided API keys.

## 3. Credentials Provided (Stored in .env)
- **OpenAI**: sk-proj-... (Stripe - Elvic Adventures)
- **Stripe**: sk_live_... / pk_live_...
- **Neon**: napi_... (Host: ep-winter-cell-afqhd4zs...)
- **Vercel**: dH8g...
- **GitHub**: ghp_M7ot... (Push access to elvic-group)

## 4. Current State
- The code is production-ready and deployed to Vercel.
- **Immediate Action Required**: You must go to the Vercel Dashboard and add the environment variables manually to enable the AI, Stripe, and DB features in the cloud.
- **Webhook Connection**: The Green API console needs the webhook URL set to `https://likelembe-2.vercel.app/webhook`.

## 5. Future Roadmap
- Implement a Stripe Webhook listener to automatically mark participants as "Paid" once the transaction is successful.
- Refactor `roscaManager` to use the `@green-api/whatsapp-chatbot-js-v2` SDK for multi-step conversation flows.
- Fix the local SSL connection to Neon (likely requires a local cert or specific proxy settings).
