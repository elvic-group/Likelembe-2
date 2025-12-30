#!/bin/bash
echo "📬 Configuring EmailJS IDs..."

# Add Service ID
printf "service_mwcfm5n" | npx vercel env add EMAILJS_SERVICE_ID production --yes

# Add Template ID
printf "template_jwkf2l9" | npx vercel env add EMAILJS_TEMPLATE_ID production --yes

echo "✅ EmailJS configured! Redeploying to apply changes..."
npx vercel deploy --prod --yes
