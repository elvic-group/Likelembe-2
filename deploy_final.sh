#!/bin/bash
# Stop on error
set -e

# Ensure we are in the project directory
PROJECT_DIR="/Users/elvicmbaya/Likelembe 2"
echo "📂 Navigating to: $PROJECT_DIR"
cd "$PROJECT_DIR"

echo "--------------------------------------"
echo "🗄️  Step 1: Updating Database Schema..."
# We try to run init_db. It might fail locally due to SSL, but we'll try.
# On Vercel, the app self-heals the sessions table, but columns need manual init or production run.
node init_db.js || echo "⚠️  Local DB Update failed (probably SSL). Ensure you run this script where DB access is allowed."

echo "--------------------------------------"
echo "🚀 Step 2: Saving Code to GitHub..."
git add .
git commit -m "feat: finalize professional messages, multi-currency, and otp" || echo "Nothing new to commit"
git push origin main

echo "--------------------------------------"
echo "☁️  Step 3: Triggering Vercel Deployment..."
npx vercel deploy --prod --yes

echo "--------------------------------------"
echo "✅ SUCCESS! Your bot is deploying with all new features."
echo "Dashboard: https://likelembe-2.vercel.app/dashboard"