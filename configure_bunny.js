const fs = require('fs');
const path = require('path');
const os = require('os');

// Path to your Gemini CLI MCP config
const configPath = path.join(os.homedir(), '.gemini', 'antigravity', 'mcp_config.json');

const bunnyConfig = {
    command: "npx",
    args: ["-y", "@composio/mcp", "run", "bunnycdn"],
    env: {
        BUNNY_API_KEY: "e49973fc-466b-48ff-b2d1-28dca7f64d62536350f5-65b0-4b5c-b9f8-81e2a64a2d93"
    }
};

try {
    console.log(`🔍 Checking for config at: ${configPath}`);
    
    let config = { mcpServers: {} };
    if (fs.existsSync(configPath)) {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } else {
        // Create directory if it doesn't exist
        fs.mkdirSync(path.dirname(configPath), { recursive: true });
    }

    // Add Bunny MCP
    config.mcpServers = config.mcpServers || {};
    config.mcpServers.bunny = bunnyConfig;

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log('✅ Success! Bunny MCP has been added to your config.');
    console.log('🔄 Please RESTART your Gemini CLI to see the new bunny tools.');
} catch (error) {
    console.error('❌ Error updating config:', error.message);
}
