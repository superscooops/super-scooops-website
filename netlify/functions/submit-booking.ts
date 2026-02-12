
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

        // Retrieve API Key from Environment Variables
        const API_KEY = process.env.SWEEP_AND_GO_API_KEY;

        if (!API_KEY) {
            console.error('Sweep & Go API Key is missing in environment variables.');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'SWEEP_AND_GO_API_KEY is not defined in Netlify environment variables.' })
            };
        }

        console.log('Attempting CRM submission for:', data.email);

        // Prepare data payload for Sweep & Go (Example Structure - adjust based on actual API docs)
        const payload = {
            client: {
                firstName: data.name.split(' ')[0],
                lastName: data.name.split(' ').slice(1).join(' ') || '',
                email: data.email,
                address: {
                    line1: data.address,
                    postalCode: data.zip
                }
            },
            service: {
                planId: data.planId,
                dogCount: data.dogs,
                deodorizer: data.deodorizer
            }
        };

        // Make the request to Sweep & Go API
        const response = await fetch('https://openapi.sweepandgo.com/api/v2/clients/client_details', {
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
