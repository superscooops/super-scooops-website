
import type { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

async function handler(event) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body || '{}');
        const { email, planId, dogs, deodorizer, address, name } = data;

        // Define Price IDs (These must be set by the user in Netlify Env Vars)
        const PRICE_IDS: Record<string, string | undefined> = {
            'sidekick': process.env.STRIPE_PRICE_SIDEKICK,
            'hero': process.env.STRIPE_PRICE_HERO,
            'super-scooper': process.env.STRIPE_PRICE_SUPER_SCOOOPER,
            'extra-dog': process.env.STRIPE_PRICE_EXTRA_DOG,
            'deodorizer-1x': process.env.STRIPE_PRICE_DEODORIZER_1x,
            'deodorizer-2x': process.env.STRIPE_PRICE_DEODORIZER_2x,
            'deodorizer-3x': process.env.STRIPE_PRICE_DEODORIZER_3x,
        };

        const lineItems: any[] = [];

        // 1. Add Base Plan
        const basePriceId = PRICE_IDS[planId];
        if (!basePriceId) throw new Error(`Missing Price ID for plan: ${planId}`);
        lineItems.push({ price: basePriceId, quantity: 1 });

        // 2. Add Extra Dogs (if > 1)
        if (dogs > 1) {
            const extraDogPriceId = PRICE_IDS['extra-dog'];
            if (!extraDogPriceId) throw new Error('Missing Price ID for Extra Dog');
            lineItems.push({ price: extraDogPriceId, quantity: dogs - 1 });
        }

        // 3. Add Deodorizer (if selected)
        if (deodorizer) {
            const deodorizerPriceId = PRICE_IDS[deodorizer];
            if (!deodorizerPriceId) throw new Error(`Missing Price ID for Deodorizer (${deodorizer})`);
            lineItems.push({ price: deodorizerPriceId, quantity: 1 });
        }

        // Create Checkout Session
        const baseUrl = process.env.URL || 'https://superscooops.com';
        const session = await stripe.checkout.sessions.create({
            customer_email: email,
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'subscription',
            success_url: `${baseUrl}/success.html`,
            cancel_url: `${baseUrl}/cancel.html`,
            metadata: {
                address,
                name,
                planId,
                dogs: dogs.toString(),
            },
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ url: session.url }),
        };

    } catch (error: any) {
        console.error('Stripe Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
}

export { handler };
