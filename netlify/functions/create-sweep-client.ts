import type { Handler } from '@netlify/functions';
import Stripe from 'stripe';

interface CreateClientRequest {
    // Required fields (Sweep&GO onboarding requires these)
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    
    // Service details
    planId?: string;
    planName?: string;
    dogs?: number;
    frequencyId?: string;
    preferredDay?: string;
    /** For 2x/3x weekly: ordered service days, e.g. ['Monday','Thursday'] */
    preferredDays?: string[];
    deodorizer?: string | null;
    totalPrice?: string | number;
    
    // Payment (optional - for full registration)
    stripeToken?: string;
    
    // Lead only flag
    isLeadOnly?: boolean;
}

interface SweepAndGoResponse {
    success: boolean;
    mode: 'lead' | 'registration';
    clientId?: string;
    data?: any;
    error?: string;
    subscriptionActive?: boolean;
    trialDays?: number;
    warning?: string;
}

const handler: Handler = async (event): Promise<{ statusCode: number; body: string }> => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        const data: CreateClientRequest = JSON.parse(event.body || '{}');

        // Basic Validation (match Sweep&GO required fields)
        const required: { key: keyof CreateClientRequest; label: string }[] = [
            { key: 'name', label: 'name' },
            { key: 'email', label: 'email' },
            { key: 'phone', label: 'phone' },
            { key: 'address', label: 'address' },
            { key: 'city', label: 'city' },
            { key: 'state', label: 'state' },
            { key: 'zip', label: 'ZIP code' },
        ];
        const missing = required.filter(({ key }) => !data[key] || String(data[key]).trim() === '');
        if (missing.length) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    error: `Missing required fields: ${missing.map(m => m.label).join(', ')}` 
                })
            };
        }

        // Retrieve API Key and Org Slug from Environment Variables
        const API_KEY = process.env.SWEEP_AND_GO_API_KEY;
        const ORG_SLUG = process.env.SWEEP_AND_GO_ORG_SLUG || 'super-scooops-qhnjn';

        if (!API_KEY) {
            console.error('Sweep&GO API Key is missing from environment variables');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Sweep&GO API configuration error' })
            };
        }

        // Split Name
        const nameParts = data.name.trim().split(/\s+/);
        const firstName = nameParts[0] || 'Hero';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Recruit';

        // Handle Lead-Only submissions (questions, inquiries without payment)
        if (data.isLeadOnly) {
            const leadPayload = {
                organization: ORG_SLUG,
                name: data.name,
                address: data.address,
                city: data.city,
                state: data.state,
                email_address: data.email,
                phone: data.phone,
                zip_code: data.zip,
                comment: `QUESTION FROM RECRUIT:
Plan: ${data.planName || 'Not specified'}
Dogs: ${data.dogs || 1}
Total: $${data.totalPrice || 'N/A'}
Preferred Day(s): ${Array.isArray(data.preferredDays) && data.preferredDays.length ? data.preferredDays.join(', ') : (data.preferredDay || 'Not specified')}`,
                marketing_allowed: 1,
                marketing_allowed_source: "open_api"
            };

            const response = await fetch(
                'https://openapi.sweepandgo.com/api/v2/client_on_boarding/out_of_service_form',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_KEY}`
                    },
                    body: JSON.stringify(leadPayload)
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Sweep&GO Lead API Error:', errorText);
                return {
                    statusCode: response.status,
                    body: JSON.stringify({ 
                        error: `Failed to create lead: ${errorText}` 
                    })
                };
            }

            const result = await response.json();
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    mode: 'lead',
                    data: result
                } as SweepAndGoResponse)
            };
        }

        // FULL CLIENT REGISTRATION (with payment)
        // Map Frequency IDs to Sweep&GO format
        const freqMap: Record<string, string> = {
            '3x-weekly': 'three_times_a_week',
            '2x-weekly': 'two_times_a_week',
            'weekly': 'once_a_week',
            'bi-weekly': 'bi_weekly',
            'monthly': 'every_four_weeks'
        };

        const deodorizerLabel = data.deodorizer
            ? data.deodorizer.replace('deodorizer-', '').toUpperCase()
            : 'NONE';

        const serviceDaysList = Array.isArray(data.preferredDays) && data.preferredDays.length
            ? data.preferredDays.filter(Boolean)
            : [data.preferredDay || 'Monday'];
        const serviceDaysStr = serviceDaysList.join(', ');
        const firstServiceDay = serviceDaysList[0] || 'Monday';

        // Validate Stripe token for full registration
        if (!data.stripeToken) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    error: 'Stripe token is required for client registration' 
                })
            };
        }

        const registrationPayload = {
            first_name: firstName,
            last_name: lastName,
            email: data.email,
            cell_phone_number: data.phone,
            home_address: data.address,
            city: data.city,
            state: data.state,
            zip_code: data.zip,
            cross_sell_id: data.planId ? `pkg_${data.planId}` : undefined,
            cross_sell_name: data.planName || 'Standard Plan',
            clean_up_frequency: freqMap[data.frequencyId || 'weekly'] || 'once_a_week',
            category: "cleanup",
            billing_interval: "weekly",
            credit_card_token: data.stripeToken,
            name_on_card: data.name.trim(),
            marketing_allowed: 1,
            terms_open_api: true,
            organization: ORG_SLUG,
            marketing_allowed_source: "open_api",
            service_days: serviceDaysStr,
            comment: `PROMO: FREE FIRST CLEANING
Preferred Service Days: ${serviceDaysStr}
Dogs: ${data.dogs || 1}
Deodorizer Mission: ${deodorizerLabel}`
        };

        const response = await fetch(
            'https://openapi.sweepandgo.com/api/v2/client_on_boarding/create_client_with_package',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify(registrationPayload)
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Sweep&GO Registration API Error:', errorText);
            
            // Try to parse error for better messaging
            let errorMessage = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorJson.error || errorText;
            } catch (e) {
                // Keep raw error text if not JSON
            }

            return {
                statusCode: response.status,
                body: JSON.stringify({ 
                    error: `Failed to create client: ${errorMessage}` 
                })
            };
        }

        const result = await response.json();

        // Create Stripe subscription: weekly billing, first charge on customer's preferred service day.
        // Requires: STRIPE_SECRET_KEY; Stripe Prices must be recurring with interval 'week' (weekly).
        // STRIPE_PRICE_SIDEKICK/HERO/SUPER_SCOOOPER, STRIPE_PRICE_EXTRA_DOG, STRIPE_PRICE_DEODORIZER_1x/2x/3x (optional).
        // Optional: STRIPE_TRIAL_DAYS (default 7 = first week free).
        const stripeSecret = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecret) {
            console.error('STRIPE_SECRET_KEY missing; client created in Sweep&GO but no recurring subscription');
            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    mode: 'registration',
                    clientId: result.client_id || result.id,
                    data: result,
                    warning: 'Stripe subscription not created (missing STRIPE_SECRET_KEY)'
                } as SweepAndGoResponse)
            };
        }

        const stripe = new Stripe(stripeSecret);
        const PRICE_IDS: Record<string, string | undefined> = {
            'sidekick': process.env.STRIPE_PRICE_SIDEKICK,
            'hero': process.env.STRIPE_PRICE_HERO,
            'super-scooper': process.env.STRIPE_PRICE_SUPER_SCOOOPER,
            'extra-dog': process.env.STRIPE_PRICE_EXTRA_DOG,
            'deodorizer-1x': process.env.STRIPE_PRICE_DEODORIZER_1x,
            'deodorizer-2x': process.env.STRIPE_PRICE_DEODORIZER_2x,
            'deodorizer-3x': process.env.STRIPE_PRICE_DEODORIZER_3x,
        };

        const subscriptionItems: Stripe.SubscriptionCreateParams.Item[] = [];
        const basePriceId = data.planId ? PRICE_IDS[data.planId] : undefined;
        if (!basePriceId) {
            console.error(`Missing Stripe Price ID for plan: ${data.planId}`);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: `Stripe price not configured for plan: ${data.planId}` })
            };
        }
        subscriptionItems.push({ price: basePriceId, quantity: 1 });

        const dogs = typeof data.dogs === 'number' ? data.dogs : 1;
        if (dogs > 1) {
            const extraDogPriceId = PRICE_IDS['extra-dog'];
            if (!extraDogPriceId) {
                console.error('Missing Stripe Price ID for extra-dog');
                return {
                    statusCode: 500,
                    body: JSON.stringify({ error: 'Stripe price not configured for extra dog' })
                };
            }
            subscriptionItems.push({ price: extraDogPriceId, quantity: dogs - 1 });
        }

        if (data.deodorizer) {
            const deodorizerPriceId = PRICE_IDS[data.deodorizer];
            if (!deodorizerPriceId) {
                console.error(`Missing Stripe Price ID for deodorizer: ${data.deodorizer}`);
                return {
                    statusCode: 500,
                    body: JSON.stringify({ error: `Stripe price not configured for deodorizer (${data.deodorizer})` })
                };
            }
            subscriptionItems.push({ price: deodorizerPriceId, quantity: 1 });
        }

        const trialDays = parseInt(process.env.STRIPE_TRIAL_DAYS || '7', 10);

        const dayNameToNumber: Record<string, number> = {
            Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6
        };
        const firstBillingDayOfWeek = dayNameToNumber[firstServiceDay] ?? 1;
        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(trialEnd.getDate() + trialDays);
        let anchor = new Date(trialEnd);
        while (anchor.getDay() !== firstBillingDayOfWeek) {
            anchor.setDate(anchor.getDate() + 1);
        }
        anchor.setUTCHours(12, 0, 0, 0);
        const billingCycleAnchor = Math.floor(anchor.getTime() / 1000);

        try {
            const customer = await stripe.customers.create({
                email: data.email,
                name: data.name.trim(),
                source: data.stripeToken,
                metadata: {
                    sweep_client_id: String(result.client_id || result.id || ''),
                    plan_id: data.planId || '',
                    dogs: String(dogs),
                },
            });

            const subscription = await stripe.subscriptions.create({
                customer: customer.id,
                items: subscriptionItems,
                trial_period_days: trialDays,
                billing_cycle_anchor: billingCycleAnchor,
                proration_behavior: 'none',
                metadata: {
                    sweep_client_id: String(result.client_id || result.id || ''),
                    plan_id: data.planId || '',
                    dogs: String(dogs),
                    service_days: serviceDaysStr,
                },
            });
        } catch (stripeErr: any) {
            console.error('Stripe subscription error:', stripeErr);
            return {
                statusCode: 500,
                body: JSON.stringify({
                    error: `Client created in Sweep&GO, but recurring subscription failed: ${stripeErr.message || 'Unknown error'}`,
                })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                mode: 'registration',
                clientId: result.client_id || result.id,
                data: result,
                subscriptionActive: true,
                trialDays,
            } as SweepAndGoResponse)
        };

    } catch (error: any) {
        console.error('Create Sweep&GO Client Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: `Internal server error: ${error.message || 'Failed to create client'}`,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};

export { handler };
