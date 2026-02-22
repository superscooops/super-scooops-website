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
    
    // Billing address (optional; if omitted, service address is used)
    billingAddress?: string;
    billingCity?: string;
    billingState?: string;
    billingZip?: string;
    
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
            '2x-monthly': 'twice_per_month',
            '1x-monthly': 'every_four_weeks',
            'one-time': 'once',
        };
        const isWeekly = ['weekly', '2x-weekly', '3x-weekly'].includes(data.frequencyId || 'weekly');

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

        // --- STEP 1: Stripe first (customer + subscription). If card is declined, we do NOT create Sweep&GO client.
        const stripeSecret = process.env.STRIPE_SECRET_KEY;
        if (!stripeSecret) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Stripe is not configured. Cannot complete registration.' })
            };
        }

        const stripe = new Stripe(stripeSecret);
        const dogs = typeof data.dogs === 'number' ? data.dogs : 1;
        const billAddress = (data.billingAddress && data.billingAddress.trim()) ? data.billingAddress.trim() : data.address;
        const billCity = (data.billingCity && data.billingCity.trim()) ? data.billingCity.trim() : data.city;
        const billState = (data.billingState && data.billingState.trim()) ? data.billingState.trim() : data.state;
        const billZip = (data.billingZip && data.billingZip.trim()) ? data.billingZip.trim() : data.zip;

        let stripeCustomerId: string;
        try {
            const customer = await stripe.customers.create({
                email: data.email,
                name: data.name.trim(),
                source: data.stripeToken,
                address: {
                    line1: billAddress,
                    city: billCity,
                    state: billState,
                    postal_code: billZip,
                    country: 'US',
                },
                metadata: {
                    plan_id: data.planId || '',
                    frequency_id: data.frequencyId || '',
                    dogs: String(dogs),
                },
            });
            stripeCustomerId = customer.id;

            if (isWeekly) {
                const PRICE_IDS: Record<string, string | undefined> = {
                    'sidekick': process.env.STRIPE_PRICE_SIDEKICK,
                    'hero': process.env.STRIPE_PRICE_HERO,
                    'super-scooper': process.env.STRIPE_PRICE_SUPER_SCOOOPER,
                    'extra-dog': process.env.STRIPE_PRICE_EXTRA_DOG,
                    'deodorizer-bi-weekly': process.env.STRIPE_PRICE_DEODORIZER_BI_WEEKLY || 'price_1T3jTJ1vIpt8szc8pZMZPzo2',
                    'deodorizer-weekly': process.env.STRIPE_PRICE_DEODORIZER_WEEKLY || 'price_1T3jRe1vIpt8szc8UG2vaHTv',
                    'deodorizer-1x-month': process.env.STRIPE_PRICE_DEODORIZER_1X_MONTH || 'price_1T3jXh1vIpt8szc89rdVrBlJ',
                    'deodorizer-1x': process.env.STRIPE_PRICE_DEODORIZER_1X || 'price_1T3jZw1vIpt8szc8nEm9IQkj',
                };
                const subscriptionItems: Stripe.SubscriptionCreateParams.Item[] = [];
                const basePriceId = data.planId ? PRICE_IDS[data.planId] : undefined;
                if (!basePriceId) {
                    return {
                        statusCode: 500,
                        body: JSON.stringify({ error: `Stripe price not configured for plan: ${data.planId}` })
                    };
                }
                subscriptionItems.push({ price: basePriceId, quantity: 1 });
                if (dogs > 1) {
                    const extraDogPriceId = PRICE_IDS['extra-dog'];
                    if (!extraDogPriceId) {
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
                        return {
                            statusCode: 500,
                            body: JSON.stringify({ error: `Stripe price not configured for deodorizer (${data.deodorizer})` })
                        };
                    }
                    subscriptionItems.push({ price: deodorizerPriceId, quantity: 1 });
                }
                const now = new Date();
                const nextFriday = new Date(now);
                const dayOfWeek = nextFriday.getDay();
                const daysToFriday = dayOfWeek <= 5 ? (5 - dayOfWeek) : (5 + (7 - dayOfWeek));
                nextFriday.setDate(nextFriday.getDate() + daysToFriday);
                nextFriday.setUTCHours(12, 0, 0, 0);
                const billingCycleAnchor = Math.floor(nextFriday.getTime() / 1000);
                const promotionCodeId = process.env.STRIPE_FIRST_SCOOP_PROMO_CODE || 'promo_1T0dyt1vIpt8szc84tV37D4X';
                const subscriptionParams: Stripe.SubscriptionCreateParams = {
                    customer: customer.id,
                    items: subscriptionItems,
                    billing_cycle_anchor: billingCycleAnchor,
                    proration_behavior: 'none',
                    metadata: {
                        plan_id: data.planId || '',
                        dogs: String(dogs),
                        service_days: serviceDaysStr,
                    },
                };
                if (promotionCodeId) {
                    subscriptionParams.discounts = [{ promotion_code: promotionCodeId }];
                }
                await stripe.subscriptions.create(subscriptionParams);
            }
            // Non-weekly: customer only (no subscription); billed post-service per cleanup
        } catch (stripeErr: any) {
            console.error('Stripe error (card may be declined):', stripeErr);
            const msg = stripeErr.message || 'Unknown error';
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: msg.includes('card') ? `Payment failed: ${msg}` : `Payment failed: ${msg}. Please check your card and billing details.`,
                })
            };
        }

        // --- STEP 2: Only after Stripe succeeds, create client in Sweep&GO.
        const billingInterval = isWeekly ? 'weekly' : (data.frequencyId === 'one-time' ? 'one_time' : 'monthly');
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
            billing_interval: billingInterval,
            credit_card_token: data.stripeToken,
            name_on_card: data.name.trim(),
            marketing_allowed: 1,
            terms_open_api: true,
            organization: ORG_SLUG,
            marketing_allowed_source: "open_api",
            service_days: serviceDaysStr,
            comment: isWeekly
                ? `PROMO: FREE FIRST CLEANING\nPreferred Service Days: ${serviceDaysStr}\nDogs: ${data.dogs || 1}\nDeodorizer Mission: ${deodorizerLabel}`
                : `Billed per cleanup after service. No free cleanup.\nPreferred Service Days: ${serviceDaysStr}\nDogs: ${data.dogs || 1}\nDeodorizer Mission: ${deodorizerLabel}`,
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
            let errorMessage = errorText;
            try {
                const errorJson = JSON.parse(errorText);
                errorMessage = errorJson.message || errorJson.error || errorText;
            } catch (e) {
                // keep raw
            }
            return {
                statusCode: response.status,
                body: JSON.stringify({
                    error: `Your payment succeeded but we could not create your account: ${errorMessage}. Please contact support.`,
                })
            };
        }

        const result = await response.json();

        try {
            await stripe.customers.update(stripeCustomerId, {
                metadata: { sweep_client_id: String(result.client_id || result.id || '') },
            });
        } catch (e) {
            // non-fatal
        }

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                mode: 'registration',
                clientId: result.client_id || result.id,
                data: result,
                subscriptionActive: isWeekly,
                billingDay: isWeekly ? 'Friday' : undefined,
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
