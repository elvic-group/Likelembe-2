# Likelembe 2 - ROSCA WhatsApp Bot

## Project Overview
This project is a WhatsApp-based **ROSCA (Rotating Savings and Credit Association)** bot named "Likelembe". It automates the management of money rotation circles, allowing users to join, contribute, and receive funds via WhatsApp.

## Architecture & Tech Stack

*   **Runtime**: Node.js with Express.js
*   **Messaging**: [Green API](https://green-api.com/) (WhatsApp integration)
*   **AI Assistant**: OpenAI (ChatGPT) for handling natural language queries and fallback responses.
*   **Database**: Neon (Serverless PostgreSQL) for persisting participants, cycles, and payment status. Includes a memory fallback if DB is unreachable.
*   **Payments**: Stripe (Checkout Sessions) for collecting contributions.
*   **Deployment**: Vercel (Serverless Functions).

## Key Features

1.  **Commands**:
    *   `join [name]`: Add a participant to the pending cycle.
    *   `start`: Begin the cycle (requires >= 2 participants). Notifies the first recipient.
    *   `pay`: Generates a Stripe payment link for the current round.
    *   `status`: View cycle progress, current pot, and payment status.
2.  **AI Fallback**: If a user sends a message that isn't a command, ChatGPT replies as a helpful assistant.
3.  **Persistence**: Data is stored in Postgres. If the database connection fails, the bot seamlessly switches to in-memory storage (data lost on restart).

## File Structure

*   `index.js`: Entry point. Sets up the Express server and routes the Green API webhook (`/webhook`) to either the ROSCA manager or AI service.
*   `services/`
    *   `roscaManager.js`: Core business logic (managing state, rotation, payments).
    *   `whatsappService.js`: Wrapper for Green API to send messages.
    *   `aiService.js`: Wrapper for OpenAI API.
    *   `stripeService.js`: Generates Stripe Checkout links.
    *   `db.js`: Manages connection to Neon PostgreSQL.
*   `init_db.js`: Script to initialize database tables (`participants`, `rosca_cycles`).
*   `vercel.json`: Configuration for deploying to Vercel.

## Setup & Configuration

### Environment Variables (.env)
The following variables are required:
```env
PORT=3000
WEBHOOK_URL_BASE=https://your-app.vercel.app

# Green API (WhatsApp)
GREEN_API_ID_INSTANCE=...
GREEN_API_API_TOKEN_INSTANCE=...

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# Neon DB
DATABASE_URL=postgres://user:pass@host/db...
NEON_API_KEY=...
```

### Installation
1.  `npm install`
2.  Set up `.env`.
3.  Run `node init_db.js` to create tables.
4.  Run `node index.js` to start locally.

## Deployment Status (as of Dec 29, 2025)

*   **Vercel URL**: `https://likelembe-2.vercel.app`
    *   *Note*: Environment variables must be added manually in Vercel Dashboard.
*   **GitHub Repo**: `https://github.com/elvic-group/Likelembe-2`
*   **Green API Webhook**: Needs to be set to `https://likelembe-2.vercel.app/webhook`.

## Local Tools (Gemini CLI)
*   **MCP Configured**: Vercel and GitHub MCP servers have been added to `~/.gemini/antigravity/mcp_config.json`. Restart Gemini CLI to use them.
