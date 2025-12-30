#!/bin/bash
echo "📬 Setting up EmailJS on Vercel..."

# Add Public Key
printf "6wm0yUv2ZWBMJCxWV" | npx vercel env add EMAILJS_PUBLIC_KEY production --yes
# Add Private Key
printf "q9Y_qOZsWtDfjBDpjXhDc" | npx vercel env add EMAILJS_PRIVATE_KEY production --yes
# Add Admin Email
printf "elvickongolo@gmail.com" | npx vercel env add ADMIN_EMAIL production --yes
# Add Default Service ID (Attempt)
printf "default_service" | npx vercel env add EMAILJS_SERVICE_ID production --yes

echo "✅ EmailJS keys added! Please go to your EmailJS dashboard and get your Template ID."
echo "Then run: printf 'YOUR_TEMPLATE_ID' | npx vercel env add EMAILJS_TEMPLATE_ID production --yes"
