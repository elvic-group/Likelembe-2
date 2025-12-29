const whatsappService = require('./whatsappService');
const stripeService = require('./stripeService');
const db = require('./db');

// In-memory state (fallback)
const roscaState = {
    participants: [], 
    cycleStatus: 'pending', 
    currentRecipientIndex: 0,
    contributionAmount: 100, 
    potTotal: 0
};

async function processCommand(phoneNumber, text, senderName = 'Friend') {
    const cleanText = text.trim().toLowerCase();
    
    if (cleanText === 'status') {
        return await getStatus(phoneNumber);
    } else if (cleanText.startsWith('join ')) {
        const name = text.substring(5).trim();
        return await addParticipant(phoneNumber, name);
    } else if (cleanText === 'pay') {
        return await initiatePayment(phoneNumber, senderName);
    } else if (cleanText === 'start') {
        return await startCircle(phoneNumber);
    }
    
    return null;
}

// Helper to check DB health
async function isDBAvailable() {
    try {
        await db.query('SELECT 1');
        return true;
    } catch (e) {
        return false;
    }
}

async function addParticipant(phoneNumber, name) {
    if (await isDBAvailable()) {
        try {
            // DB Implementation
            const cycleRes = await db.query("SELECT * FROM rosca_cycles WHERE status = 'pending' LIMIT 1");
            if (cycleRes.rows.length === 0) return "Cycle already started or none exists.";
            
            const cycleId = cycleRes.rows[0].id;
            
            // Check existing
            const existRes = await db.query("SELECT * FROM participants WHERE phone_number = $1 AND cycle_id = $2", [phoneNumber, cycleId]);
            if (existRes.rows.length > 0) return "You are already in the circle.";
            
            await db.query("INSERT INTO participants (phone_number, name, cycle_id) VALUES ($1, $2, $3)", [phoneNumber, name, cycleId]);
            
            const countRes = await db.query("SELECT COUNT(*) FROM participants WHERE cycle_id = $1", [cycleId]);
            return `Welcome ${name}! Current participants: ${countRes.rows[0].count}`;
        } catch (e) {
            console.error("DB Error:", e);
            return "System error. Please try again later.";
        }
    } else {
        // Memory Implementation
        if (roscaState.cycleStatus !== 'pending') return "Cycle already started. Cannot join now.";
        const existing = roscaState.participants.find(p => p.phoneNumber === phoneNumber);
        if (existing) return "You are already in the circle.";
        roscaState.participants.push({ phoneNumber, name, hasPaid: false });
        return `Welcome ${name}! Current participants: ${roscaState.participants.length} (Offline Mode)`;
    }
}

async function startCircle(phoneNumber) {
    if (await isDBAvailable()) {
        // Simplified DB Start Logic
        const cycleRes = await db.query("SELECT * FROM rosca_cycles WHERE status = 'pending' LIMIT 1");
        if (cycleRes.rows.length === 0) return "No pending cycle.";
        
        const participantsRes = await db.query("SELECT * FROM participants WHERE cycle_id = $1", [cycleRes.rows[0].id]);
        if (participantsRes.rows.length < 2) return "Need at least 2 participants.";
        
        await db.query("UPDATE rosca_cycles SET status = 'active' WHERE id = $1", [cycleRes.rows[0].id]);
        
        // Notify
        const recipient = participantsRes.rows[0];
        for (const p of participantsRes.rows) {
             whatsappService.sendMessage(p.phone_number, 
                `ROSCA Cycle Started!\nFirst recipient: ${recipient.name}`
            ).catch(console.error);
        }
        return "Cycle started!";
    } else {
        if (roscaState.participants.length < 2) return "Need at least 2 participants.";
        roscaState.cycleStatus = 'active';
        roscaState.currentRecipientIndex = 0;
        const recipient = roscaState.participants[0];
        for (const p of roscaState.participants) {
            whatsappService.sendMessage(p.phoneNumber, 
                `ROSCA Cycle Started!\nFirst recipient: ${recipient.name}`
            ).catch(console.error);
        }
        return "Cycle started (Offline Mode).";
    }
}

async function initiatePayment(phoneNumber, name) {
    // Generate Stripe Link
    const amount = 100; // Hardcoded or fetch from state/DB
    const link = await stripeService.createPaymentLink(amount, name, phoneNumber);
    
    if (link) {
        return `Please complete your contribution here: ${link}`;
    } else {
        return "Error creating payment link. Try again later.";
    }
}

async function getStatus(phoneNumber) {
    // Simplified status
    if (await isDBAvailable()) {
         const pRes = await db.query("SELECT * FROM participants WHERE phone_number = $1", [phoneNumber]);
         if (pRes.rows.length === 0) return "Not in a circle.";
         return `You are in the circle. Status: Active (DB)`;
    }
    const p = roscaState.participants.find(p => p.phoneNumber === phoneNumber);
    if (!p) return "You are not in a circle.";
    return `Status: ${roscaState.cycleStatus}. Payment: ${p.hasPaid ? 'Paid' : 'Pending'}`;
}

async function markParticipantAsPaid(phoneNumber) {
    console.log(`Marking ${phoneNumber} as paid...`);
    
    if (await isDBAvailable()) {
        try {
            // Assuming there's a 'has_paid' column or similar tracking mechanism
            // For this MVP, we might need to add a transaction record or update a flag
            // Let's assume a simple update for the current active/pending cycle
            const updateRes = await db.query(
                "UPDATE participants SET has_paid = true WHERE phone_number = $1", 
                [phoneNumber]
            );
            return updateRes.rowCount > 0;
        } catch (e) {
            console.error("DB Error updating payment:", e);
            return false;
        }
    } else {
        // Memory Fallback
        const participant = roscaState.participants.find(p => p.phoneNumber === phoneNumber);
        if (participant) {
            participant.hasPaid = true;
            // Add to pot
            roscaState.potTotal += roscaState.contributionAmount;
            return true;
        }
        return false;
    }
}

module.exports = {
    processCommand,
    markParticipantAsPaid
};
