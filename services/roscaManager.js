const whatsappService = require('./whatsappService');
const stripeService = require('./stripeService');
const db = require('./db');
const emailService = require('./emailService');

// In-memory state (fallback)
const roscaState = {
    participants: [], 
    cycleStatus: 'pending', 
    currentRecipientIndex: 0,
    contributionAmount: 100, 
    potTotal: 0
};

async function getGroupId(chatId) {
    if (!await isDBAvailable()) return null; 
    
    const whatsappId = chatId && chatId.endsWith('@g.us') ? chatId : 'default';
    
    let res = await db.query("SELECT id FROM groups WHERE whatsapp_id = $1", [whatsappId]);
    if (res.rows.length > 0) return res.rows[0].id;
    
    if (whatsappId !== 'default') {
        const ins = await db.query("INSERT INTO groups (whatsapp_id, name, default_currency) VALUES ($1, 'New Group', 'USD') RETURNING id", [whatsappId]);
        await emailService.sendAdminAlert("New Group Created", `Group ID: ${chatId}`);
        return ins.rows[0].id;
    }
    return null;
}

async function registerGroup(chatId, name, currency = 'USD') {
    if (!await isDBAvailable()) return;
    await db.query(`
        INSERT INTO groups (whatsapp_id, name, default_currency)
        VALUES ($1, $2, $3)
        ON CONFLICT (whatsapp_id) 
        DO UPDATE SET name = $2, default_currency = $3
    `, [chatId, name, currency]);
}

async function addParticipant(phoneNumber, name, email, chatId) {
    if (await isDBAvailable()) {
        const groupId = await getGroupId(chatId);
        if (!groupId) return "❌ System error: Group not found.";

        try {
            let cycleRes = await db.query("SELECT * FROM rosca_cycles WHERE group_id = $1 AND status = 'pending' LIMIT 1", [groupId]);
            let cycleId;
            if (cycleRes.rows.length === 0) {
                let currency = 'USD';
                const gRes = await db.query("SELECT default_currency FROM groups WHERE id = $1", [groupId]);
                if (gRes.rows.length > 0) currency = gRes.rows[0].default_currency || 'USD';

                const newCycle = await db.query(
                    "INSERT INTO rosca_cycles (status, group_id, currency) VALUES ('pending', $1, $2) RETURNING id", 
                    [groupId, currency]
                );
                cycleId = newCycle.rows[0].id;
            } else {
                cycleId = cycleRes.rows[0].id;
            }
            
            const existRes = await db.query("SELECT * FROM participants WHERE phone_number = $1 AND cycle_id = $2", [phoneNumber, cycleId]);
            if (existRes.rows.length > 0) return "⚠️ You are already in the circle.";
            
            await db.query("INSERT INTO participants (phone_number, name, email, cycle_id) VALUES ($1, $2, $3, $4)", [phoneNumber, name, email, cycleId]);
            
            if (email) {
                await emailService.sendEmail(email, name, "Welcome to Likelembe", `Hi ${name}, you have successfully joined the circle!`);
            }
            await emailService.sendAdminAlert("New Participant", `${name} (${email || 'No Email'}) joined group ${groupId}`);
            
            const countRes = await db.query("SELECT COUNT(*) FROM participants WHERE cycle_id = $1", [cycleId]);
            return `🎉 *Welcome, ${name}!* You have successfully joined.
👥 Current participants: ${countRes.rows[0].count}`;
        } catch (e) {
            console.error("DB Error:", e);
            return "❌ System error. Please try again later.";
        }
    } else {
        if (roscaState.cycleStatus !== 'pending') return "⚠️ Cycle already started. Cannot join now.";
        const existing = roscaState.participants.find(p => p.phoneNumber === phoneNumber);
        if (existing) return "⚠️ You are already in the circle.";
        roscaState.participants.push({ phoneNumber, name, email, hasPaid: false });
        return `🎉 *Welcome, ${name}!* (Offline Mode)`;
    }
}

async function startCircle(phoneNumber, chatId) {
    if (await isDBAvailable()) {
        const groupId = await getGroupId(chatId);
        
        const cycleRes = await db.query("SELECT * FROM rosca_cycles WHERE group_id = $1 AND status = 'pending' LIMIT 1", [groupId]);
        if (cycleRes.rows.length === 0) return "⚠️ No pending cycle for this group.";
        
        const participantsRes = await db.query("SELECT * FROM participants WHERE cycle_id = $1", [cycleRes.rows[0].id]);
        if (participantsRes.rows.length < 2) return "⚠️ Need at least 2 participants to start.";
        
        await db.query("UPDATE rosca_cycles SET status = 'active' WHERE id = $1", [cycleRes.rows[0].id]);
        
        const recipient = participantsRes.rows[0];
        for (const p of participantsRes.rows) {
             whatsappService.sendMessage(p.phone_number, 
                `🚀 *The Cycle Has Begun!* 🌍\n\n` +
                `The first pot will go to: *${recipient.name}* 🏆\n` +
                `Good luck to everyone!`
            ).catch(console.error);
        }
        return "✅ Cycle started successfully!";
    } else {
        if (roscaState.participants.length < 2) return "⚠️ Need at least 2 participants.";
        roscaState.cycleStatus = 'active';
        roscaState.currentRecipientIndex = 0;
        const recipient = roscaState.participants[0];
        for (const p of roscaState.participants) {
            whatsappService.sendMessage(p.phoneNumber, "Cycle Started (Offline)").catch(console.error);
        }
        return "Cycle started (Offline Mode).";
    }
}

async function initiatePayment(phoneNumber, name, chatId) {
    const groupId = await getGroupId(chatId);
    let currency = 'usd';
    
    if (await isDBAvailable() && groupId) {
        const cRes = await db.query(`
            SELECT c.currency FROM rosca_cycles c
            JOIN participants p ON p.cycle_id = c.id
            WHERE p.phone_number = $1 AND c.group_id = $2
            ORDER BY c.id DESC LIMIT 1
        `, [phoneNumber, groupId]);
        if (cRes.rows.length > 0) currency = cRes.rows[0].currency || 'usd';
    }

    const amount = 100; 
    const link = await stripeService.createPaymentLink(amount, name, phoneNumber, currency);
    
    if (link) {
        return `💳 *Time to Contribute!*

` +
               `Click the link below to pay your *${amount} ${currency.toUpperCase()}*:
` +
               `${link}

` +
               `_Secure payment via Stripe_`;
    } else {
        return "❌ Error creating payment link. Try again later.";
    }
}

async function getStatus(phoneNumber, chatId) {
    if (await isDBAvailable()) {
        const groupId = await getGroupId(chatId);
        
         const pRes = await db.query(`
            SELECT p.*, c.status as cycle_status, c.currency, c.pot_total 
            FROM participants p
            JOIN rosca_cycles c ON p.cycle_id = c.id
            WHERE p.phone_number = $1 AND c.group_id = $2
            ORDER BY c.id DESC LIMIT 1
         `, [phoneNumber, groupId]);
         
         if (pRes.rows.length === 0) return "⚠️ You are not in a circle in this group.";
         const p = pRes.rows[0];
         return `📊 *Your Status*

` +
                `🔄 Cycle: *${p.cycle_status.toUpperCase()}*
` +
                `💰 Pot: *${p.pot_total} ${p.currency}*
` +
                `✅ Payment: *${p.has_paid ? 'PAID' : 'PENDING'}*`;
    }
    const p = roscaState.participants.find(p => p.phoneNumber === phoneNumber);
    if (!p) return "You are not in a circle.";
    return `Status: ${roscaState.cycleStatus}. Payment: ${p.hasPaid ? 'Paid' : 'Pending'}`;
}

async function markParticipantAsPaid(phoneNumber) {
    console.log(`Marking ${phoneNumber} as paid...`);
    
    if (await isDBAvailable()) {
        try {
            // Find participant and update, joining with cycle to get currency and amount
            const updateRes = await db.query(`
                UPDATE participants p
                SET has_paid = true 
                FROM rosca_cycles c
                WHERE p.cycle_id = c.id 
                  AND p.phone_number = $1 
                  AND p.has_paid = false 
                RETURNING p.name, p.email, c.currency, c.contribution_amount
            `, [phoneNumber]);
            
            if (updateRes.rows.length > 0) {
                const p = updateRes.rows[0];
                const amountStr = `${p.contribution_amount} ${p.currency.toUpperCase()}`;
                
                // Send Receipts
                if (p.email) {
                    await emailService.sendEmail(p.email, p.name, "Payment Receipt", `We received your contribution of ${amountStr}. Thank you!`);
                }
                await emailService.sendAdminAlert("Payment Received", `${p.name} paid ${amountStr}.`);
                return true;
            }
            return false;
        } catch (e) {
            console.error("DB Error updating payment:", e);
            return false;
        }
    } else {
        // Memory Fallback
        const participant = roscaState.participants.find(p => p.phoneNumber === phoneNumber);
        if (participant) {
            participant.hasPaid = true;
            return true;
        }
        return false;
    }
}

async function getDashboardData() {
    const data = {
        cycle: { status: 'Unknown', pot_total: 0 },
        participants: []
    };

    if (await isDBAvailable()) {
        try {
            const cycleRes = await db.query("SELECT * FROM rosca_cycles ORDER BY id DESC LIMIT 1");
            if (cycleRes.rows.length > 0) {
                data.cycle = cycleRes.rows[0];
                const pRes = await db.query("SELECT * FROM participants WHERE cycle_id = $1", [data.cycle.id]);
                data.participants = pRes.rows;
            }
        } catch (e) {
            console.error("DB Dashboard Error:", e);
        }
    } else {
        data.cycle.status = roscaState.cycleStatus;
        data.cycle.pot_total = roscaState.potTotal;
        data.participants = roscaState.participants.map(p => ({
            name: p.name,
            phone_number: p.phoneNumber,
            has_paid: p.hasPaid
        }));
    }
    return data;
}

async function sendReminders() {
    console.log("Sending reminders...");
    let count = 0;
    
    if (await isDBAvailable()) {
        try {
            const cycleRes = await db.query("SELECT * FROM rosca_cycles WHERE status = 'active' LIMIT 1");
            if (cycleRes.rows.length === 0) return "No active cycle.";
            
            const res = await db.query(
                "SELECT * FROM participants WHERE cycle_id = $1 AND has_paid = false", 
                [cycleRes.rows[0].id]
            );
            
            for (const p of res.rows) {
                await whatsappService.sendMessage(p.phone_number, 
                    `⏳ *Weekly Reminder*\n\n` +
                    `Don't forget to make your contribution! The circle relies on you.
` +
                    `Type *pay* to get your link.`
                );
                count++;
            }
        } catch (e) {
            console.error("Error sending reminders (DB):", e);
            return "Error sending reminders.";
        }
    } 
    return `Sent ${count} reminders.`;
}

async function setupPayout(phoneNumber, chatId) {
    if (!await isDBAvailable()) return "Feature not available in offline mode.";
    
    const groupId = await getGroupId(chatId);
    
    const pRes = await db.query(`
        SELECT p.* FROM participants p
        JOIN rosca_cycles c ON p.cycle_id = c.id
        WHERE p.phone_number = $1 AND c.group_id = $2
        ORDER BY c.id DESC LIMIT 1
    `, [phoneNumber, groupId]);
    
    if (pRes.rows.length === 0) return "⚠️ You are not in a circle.";
    const p = pRes.rows[0];
    
    if (p.stripe_account_id) {
        return "✅ You are already set up for payouts!";
    }
    
    const accountId = await stripeService.createExpressAccount();
    if (!accountId) return "❌ Error creating Stripe account.";
    
    await db.query("UPDATE participants SET stripe_account_id = $1 WHERE id = $2", [accountId, p.id]);
    
    const link = await stripeService.createAccountLink(accountId);
    if (!link) return "❌ Error creating onboarding link.";
    
    return `🏦 *Setup Payouts*

Tap here to link your Bank/Debit Card securely:
${link}`;
}

async function payoutWinner(chatId) {
    if (!await isDBAvailable()) return "Offline mode.";
    const groupId = await getGroupId(chatId);
    
    const cycleRes = await db.query("SELECT * FROM rosca_cycles WHERE group_id = $1 AND status = 'active' LIMIT 1", [groupId]);
    if (cycleRes.rows.length === 0) return "⚠️ No active cycle.";
    
    const cycle = cycleRes.rows[0];
    if (Number(cycle.pot_total) <= 0) return "⚠️ Pot is empty.";
    
    const participantsRes = await db.query("SELECT * FROM participants WHERE cycle_id = $1 ORDER BY id ASC", [cycle.id]);
    const recipient = participantsRes.rows[cycle.current_recipient_index]; 
    
    if (!recipient) return "❌ No recipient found.";
    
    if (!recipient.stripe_account_id) {
        return `⚠️ Cannot payout. *${recipient.name}* needs to run 'setup' first.`;
    }
    
    try {
        await stripeService.transferFunds(recipient.stripe_account_id, Number(cycle.pot_total), cycle.currency || 'usd');
        
        await db.query("UPDATE rosca_cycles SET pot_total = 0 WHERE id = $1", [cycle.id]);
        
        const nextIndex = (cycle.current_recipient_index + 1) % participantsRes.rows.length;
        await db.query("UPDATE rosca_cycles SET current_recipient_index = $1 WHERE id = $2", [nextIndex, cycle.id]);
        
        // Notify Winner via Email
        if (recipient.email) {
            const amountStr = `${cycle.pot_total} ${cycle.currency.toUpperCase()}`;
            await emailService.sendEmail(recipient.email, recipient.name, "Payout Sent!", `Congratulations! We have sent ${amountStr} to your Stripe account.`);
        }
        await emailService.sendAdminAlert("Payout Triggered", `${cycle.pot_total} ${cycle.currency} sent to ${recipient.name}`);

        return `💰 *Payout Complete!*

` +
               `*${cycle.pot_total} ${cycle.currency.toUpperCase()}* has been sent to *${recipient.name}*.
` +
               `Next up: *${participantsRes.rows[nextIndex].name}*!`;
    } catch (e) {
        console.error("Payout Failed:", e);
        return "❌ Payout failed. Check logs.";
    }
}

async function processCommand(phoneNumber, text, senderName = 'Friend', chatId) {
    const cleanText = text.trim().toLowerCase();
    
    if (cleanText === 'status') {
        return await getStatus(phoneNumber, chatId);
    } else if (cleanText.startsWith('join ')) {
        const name = text.substring(5).trim();
        // Text-based join doesn't ask for email yet
        return await addParticipant(phoneNumber, name, null, chatId);
    } else if (cleanText === 'pay') {
        return await initiatePayment(phoneNumber, senderName, chatId);
    } else if (cleanText === 'start') {
        return await startCircle(phoneNumber, chatId);
    } else if (cleanText === 'setup') {
        return await setupPayout(phoneNumber, chatId);
    } else if (cleanText === 'payout') {
        return await payoutWinner(chatId);
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

module.exports = {
    processCommand,
    markParticipantAsPaid,
    addParticipant,
    startCircle,
    initiatePayment,
    getStatus,
    isDBAvailable,
    getDashboardData,
    sendReminders,
    setupPayout,
    payoutWinner,
    registerGroup
};
