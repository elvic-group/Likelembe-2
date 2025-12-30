#!/bin/bash
# Stop on error
set -e

# Ensure we are in the project directory
PROJECT_DIR="/Users/elvicmbaya/Likelembe 2"
echo "📂 Navigating to: $PROJECT_DIR"
cd "$PROJECT_DIR"

echo "--------------------------------------"
echo "🚀 Step 1: Saving Code to GitHub..."
git add .
# Commit might fail if nothing to change, that's ok
git commit -m "feat: final deployment" || echo "Nothing new to commit"
git push origin main

echo "--------------------------------------"
echo "🔑 Step 2: Setting Cron Secret..."
# We use --yes to skip confirmation prompts
printf "46rJBglATYx2IL9X42J+xS47kr2ZJ2GlLpse+8WYyVE=" | npx vercel env add CRON_SECRET production || echo "Secret might already exist"

echo "--------------------------------------"
echo "☁️  Step 3: Triggering Vercel Deployment..."
npx vercel deploy --prod --yes

echo "--------------------------------------"
echo "✅ SUCCESS! Your bot is deploying."
echo "Dashboard: https://likelembe-2.vercel.app/dashboard"
