
import type { Handler } from '@netlify/functions';

const handler: Handler = async (event) => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body || '{}');

        // Basic Validation
        if (!data.name || !data.email || !data.address) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
        }

        // Retrieve API Key and Org Slug from Environment Variables
        const API_KEY = process.env.SWEEP_AND_GO_API_KEY;
        const ORG_SLUG = process.env.SWEEP_AND_GO_ORG_SLUG || 'super-scooops-qhnjn';

        if (!API_KEY) {
            return { statusCode: 500, body: JSON.stringify({ error: 'S&G API Key Missing' }) };
        }

        // Split Name
        const nameParts = data.name.trim().split(/\s+/);
        const firstName = nameParts[0] || 'Hero';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'Recruit';

        if (data.isLeadOnly) {
            // LEAD FALLBACK
            const leadPayload = {
                organization: ORG_SLUG,
                name: data.name,
                address: data.address,
                email_address: data.email,
                phone: data.phone,
                zip_code: data.zip,
                comment: `QUESTION FROM RECRUIT:
Plan: ${data.planName}
Dogs: ${data.dogs}
Total: $${data.totalPrice}
Preferred Day: ${data.preferredDay || 'Not specified'}`,
                marketing_allowed: 1,
                marketing_allowed_source: "open_api"
            };

            const response = await fetch('https://openapi.sweepandgo.com/api/v2/client_on_boarding/out_of_service_form', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
                body: JSON.stringify(leadPayload)
            });

            if (!response.ok) throw new Error(await response.text());

            return { statusCode: 200, body: JSON.stringify({ success: true, mode: 'lead' }) };
        }

        // FULL REGISTRATION
        // Map Frequency 
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

        const registrationPayload = {
            first_name: firstName,
            last_name: lastName,
            email: data.email,
            cell_phone_number: data.phone,
            home_address: data.address,
            zip_code: data.zip,
            cross_sell_id: `pkg_${data.planId}`, // Placeholder ID
            cross_sell_name: data.planName,
            clean_up_frequency: freqMap[data.frequencyId] || 'once_a_week',
            category: "cleanup",
            billing_interval: "monthly",
            credit_card_token: data.stripeToken,
            marketing_allowed: 1,
            terms_open_api: true,
            organization: ORG_SLUG,
            marketing_allowed_source: "open_api",
            comment: `PROMO: FREE FIRST CLEANING
Preferred Service Day: ${data.preferredDay || 'Monday'}
Deodorizer Mission: ${deodorizerLabel}`
        };

        const response = await fetch('https://openapi.sweepandgo.com/api/v2/client_on_boarding/create_client_with_package', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
            body: JSON.stringify(registrationPayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('CRM ERROR:', errorText);
            return { statusCode: response.status, body: JSON.stringify({ error: errorText }) };
        }

        const result = await response.json();
        return { statusCode: 200, body: JSON.stringify({ success: true, mode: 'registration', data: result }) };

    } catch (error: any) {
        console.error('Submission Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: `CRM ERROR: ${error.message || 'Failed to submit booking.'}`,
                details: error.stack
            }),
        };
    }
};

export { handler };
