
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
        const ORG_SLUG = process.env.SWEEP_AND_GO_ORG_SLUG || 'super-scooops';

        if (!API_KEY) {
            console.error('Sweep & Go API Key is missing in environment variables.');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'SWEEP_AND_GO_API_KEY is not defined in Netlify environment variables.' })
            };
        }

        console.log('Attempting CRM submission for:', data.email);

        // Prepare data payload for Sweep & Go (Lead Submission)
        const payload = {
            organization: ORG_SLUG,
            name: data.name,
            address: data.address,
            email_address: data.email,
            zip_code: data.zip,
            comment: `Plan: ${data.planId} | Dogs: ${data.dogs} | Deodorizer: ${data.deodorizer ? 'Yes' : 'No'}`,
            marketing_allowed: 1,
            marketing_allowed_source: "open_api"
        };

        // Make the request to Sweep & Go API (Lead Creation Endpoint)
        const response = await fetch('https://openapi.sweepandgo.com/api/v2/client_on_boarding/out_of_service_form', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Sweep & Go API Error:', errorText);
            throw new Error(`CRM API responded with ${response.status}: ${errorText}`);
        }

        const result = await response.json();

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Booking submitted successfully!', data: result }),
        };

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
