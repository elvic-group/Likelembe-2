const { execSync } = require('child_process');

function run(cmd) {
    try {
        console.log(`\n>>> Running: ${cmd}`);
        execSync(cmd, { stdio: 'inherit' });
    } catch (error) {
        console.error(`Error running command: ${cmd}`);
        // We continue even if commit fails (e.g. if nothing to commit)
    }
}

console.log("🚀 Starting Deployment Sequence...");

// 1. Git Operations
run('git add .');
run('git commit -m "feat: complete rosca bot deployment"');
run('git push origin main');

// 2. Vercel Secrets
console.log("\n🔑 Setting Vercel Environment Variables...");
// We use a try/catch here because if it exists, it might error, but that's fine.
try {
    // Using a simpler approach for the secret to avoid shell pipe issues if possible, 
    // but execSync should handle it.
    execSync('printf "46rJBglATYx2IL9X42J+xS47kr2ZJ2GlLpse+8WYyVE=" | npx vercel env add CRON_SECRET production', { stdio: 'inherit' });
} catch (e) {
    console.log("⚠️  Could not add CRON_SECRET (It might already exist or require manual entry).");
}

console.log("\n✅ Deployment script finished.");

