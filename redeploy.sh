#!/bin/bash
echo "🚀 Starting Deployment..."

# 1. Add Cron Secret to Vercel
echo "🔑 Setting Cron Secret..."
printf "46rJBglATYx2IL9X42J+xS47kr2ZJ2GlLpse+8WYyVE=" | npx vercel env add CRON_SECRET production

# 2. Push Code to GitHub (Triggers Vercel Build)
echo "📦 Pushing Code..."
git add .
git commit -m "feat: complete rosca bot deployment"
git push origin main

echo "✅ Deployment Triggered! Check your dashboard in a few minutes."
