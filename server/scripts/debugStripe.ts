
import 'dotenv/config';
import { stripe } from "../lib/stripe";

async function debugStripe() {
    try {
        console.log("Checking Stripe connection...");

        // 1. Check Account
        const account = await stripe.accounts.retrieve();
        console.log("Connected to Stripe Account:", account.id, account.email || "No email");
        console.log("Mode:", account.type); // standard, express, etc. - doesn't directly say test/live but implies context

        // 2. List recent Checkout Sessions
        console.log("\nFetching last 5 Checkout Sessions...");
        const sessions = await stripe.checkout.sessions.list({ limit: 5 });

        if (sessions.data.length === 0) {
            console.log("No checkout sessions found.");
        } else {
            sessions.data.forEach(s => {
                console.log(`- [${s.created}] ${s.id} | Status: ${s.status} | Payment Status: ${s.payment_status} | Customer: ${s.customer}`);
            });
        }

        // 3. List Webhooks
        console.log("\nFetching Webhook Endpoints...");
        const webhooks = await stripe.webhookEndpoints.list({ limit: 5 });
        webhooks.data.forEach(w => {
            console.log(`- ${w.id} | URL: ${w.url} | Status: ${w.status}`);
        });

    } catch (error: any) {
        console.error("Stripe Error:", error.message);
    }
}

debugStripe();
