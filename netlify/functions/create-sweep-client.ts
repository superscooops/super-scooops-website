import type { Handler } from '@netlify/functions';

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
Preferred Day: ${data.preferredDay || 'Not specified'}`,
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
            billing_interval: "monthly",
            credit_card_token: data.stripeToken,
            marketing_allowed: 1,
            terms_open_api: true,
            organization: ORG_SLUG,
            marketing_allowed_source: "open_api",
            comment: `PROMO: FREE FIRST CLEANING
Preferred Service Day: ${data.preferredDay || 'Monday'}
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
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                mode: 'registration',
                clientId: result.client_id || result.id,
                data: result
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
