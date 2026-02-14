import type { Handler } from '@netlify/functions';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2024-11-20.acacia' });

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
    }

    try {
        const body = JSON.parse(event.body || '{}');
        const email = typeof body.email === 'string' ? body.email.trim() : '';

        if (!email) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Email is required' }),
            };
        }

        const customers = await stripe.customers.list({ email, limit: 1 });
        const customer = customers.data[0];

        if (!customer) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'No billing account found for this email. Sign up first or use the email you used when subscribing.' }),
            };
        }

        const baseUrl = process.env.URL || 'https://superscooops.com';
        const returnUrl = body.return_url || `${baseUrl}/manage-billing.html`;

        const session = await stripe.billingPortal.sessions.create({
            customer: customer.id,
            return_url: returnUrl,
        });

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: session.url }),
        };
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        console.error('Billing portal session error:', err);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: message }),
        };
    }
};
