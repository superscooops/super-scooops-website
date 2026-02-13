import type { Handler } from '@netlify/functions';

interface SweepAndGoWebhookEvent {
    event_type: string;
    timestamp?: string;
    organization?: string;
    data?: {
        client_id?: string;
        client_name?: string;
        email?: string;
        phone?: string;
        address?: string;
        status?: string;
        payment_status?: string;
        service_date?: string;
        service_type?: string;
        amount?: number;
        [key: string]: any;
    };
    [key: string]: any;
}

const handler: Handler = async (event): Promise<{ statusCode: number; body: string }> => {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        console.warn(`Webhook received ${event.httpMethod} request, expected POST`);
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method Not Allowed' })
        };
    }

    try {
        // Parse webhook payload
        const payload: SweepAndGoWebhookEvent = JSON.parse(event.body || '{}');
        
        // Log webhook receipt for debugging
        console.log('Sweep&GO Webhook Received:', {
            event_type: payload.event_type,
            timestamp: payload.timestamp,
            organization: payload.organization,
            has_data: !!payload.data
        });

        // Verify webhook signature if Sweep&GO provides one
        // Note: Check Sweep&GO docs for signature verification method
        const webhookSecret = process.env.SWEEP_AND_GO_WEBHOOK_SECRET;
        if (webhookSecret) {
            const signature = event.headers['x-sweep-signature'] || event.headers['x-webhook-signature'];
            if (signature) {
                // TODO: Implement signature verification based on Sweep&GO's method
                // This is a placeholder - verify the actual signature verification method
                console.log('Webhook signature present, verification needed');
            }
        }

        // Validate required fields
        if (!payload.event_type) {
            console.error('Webhook missing event_type');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing event_type' })
            };
        }

        // Process different event types
        switch (payload.event_type) {
            case 'client.created':
            case 'client_created':
                await handleClientCreated(payload);
                break;

            case 'client.updated':
            case 'client_updated':
                await handleClientUpdated(payload);
                break;

            case 'payment.received':
            case 'payment_received':
            case 'payment.success':
                await handlePaymentReceived(payload);
                break;

            case 'payment.failed':
            case 'payment_failed':
                await handlePaymentFailed(payload);
                break;

            case 'service.completed':
            case 'service_completed':
            case 'cleanup.completed':
                await handleServiceCompleted(payload);
                break;

            case 'service.scheduled':
            case 'service_scheduled':
                await handleServiceScheduled(payload);
                break;

            case 'subscription.cancelled':
            case 'subscription_cancelled':
                await handleSubscriptionCancelled(payload);
                break;

            case 'subscription.activated':
            case 'subscription_activated':
                await handleSubscriptionActivated(payload);
                break;

            default:
                console.log(`Unhandled webhook event type: ${payload.event_type}`);
                // Return success even for unhandled events to prevent retries
                return {
                    statusCode: 200,
                    body: JSON.stringify({ 
                        received: true, 
                        event_type: payload.event_type,
                        message: 'Event received but not processed'
                    })
                };
        }

        // Return success response
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                success: true, 
                event_type: payload.event_type,
                message: 'Webhook processed successfully'
            })
        };

    } catch (error: any) {
        console.error('Webhook Processing Error:', error);
        
        // Return 500 to trigger retry, or 200 to acknowledge receipt
        // Adjust based on Sweep&GO's retry behavior
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Webhook processing failed',
                message: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};

// Event Handlers

async function handleClientCreated(payload: SweepAndGoWebhookEvent) {
    const clientData = payload.data;
    console.log('Client Created:', {
        client_id: clientData?.client_id,
        name: clientData?.client_name,
        email: clientData?.email,
        organization: payload.organization
    });

    // TODO: Add your custom logic here
    // Examples:
    // - Send welcome email
    // - Create record in external system
    // - Trigger onboarding workflow
    // - Update analytics
    
    // Example: Send to external service
    // await fetch('https://your-service.com/api/clients', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify(clientData)
    // });
}

async function handleClientUpdated(payload: SweepAndGoWebhookEvent) {
    const clientData = payload.data;
    console.log('Client Updated:', {
        client_id: clientData?.client_id,
        changes: clientData
    });

    // TODO: Handle client updates
    // - Sync changes to external systems
    // - Update local cache
    // - Notify relevant parties
}

async function handlePaymentReceived(payload: SweepAndGoWebhookEvent) {
    const paymentData = payload.data;
    console.log('Payment Received:', {
        client_id: paymentData?.client_id,
        amount: paymentData?.amount,
        status: paymentData?.payment_status
    });

    // TODO: Handle successful payment
    // - Update accounting system
    // - Send receipt email
    // - Update subscription status
    // - Trigger fulfillment processes
}

async function handlePaymentFailed(payload: SweepAndGoWebhookEvent) {
    const paymentData = payload.data;
    console.log('Payment Failed:', {
        client_id: paymentData?.client_id,
        amount: paymentData?.amount,
        reason: paymentData?.failure_reason
    });

    // TODO: Handle failed payment
    // - Send notification email
    // - Update client status
    // - Trigger retry logic
    // - Alert support team
}

async function handleServiceCompleted(payload: SweepAndGoWebhookEvent) {
    const serviceData = payload.data;
    console.log('Service Completed:', {
        client_id: serviceData?.client_id,
        service_date: serviceData?.service_date,
        service_type: serviceData?.service_type
    });

    // TODO: Handle service completion
    // - Send completion confirmation
    // - Update service history
    // - Trigger follow-up communications
    // - Update analytics
}

async function handleServiceScheduled(payload: SweepAndGoWebhookEvent) {
    const serviceData = payload.data;
    console.log('Service Scheduled:', {
        client_id: serviceData?.client_id,
        service_date: serviceData?.service_date,
        service_type: serviceData?.service_type
    });

    // TODO: Handle service scheduling
    // - Send confirmation to client
    // - Update calendar
    // - Notify field team
}

async function handleSubscriptionCancelled(payload: SweepAndGoWebhookEvent) {
    const subscriptionData = payload.data;
    console.log('Subscription Cancelled:', {
        client_id: subscriptionData?.client_id,
        cancellation_date: subscriptionData?.cancellation_date
    });

    // TODO: Handle cancellation
    // - Send cancellation confirmation
    // - Update client status
    // - Trigger retention campaign
    // - Update analytics
}

async function handleSubscriptionActivated(payload: SweepAndGoWebhookEvent) {
    const subscriptionData = payload.data;
    console.log('Subscription Activated:', {
        client_id: subscriptionData?.client_id,
        activation_date: subscriptionData?.activation_date
    });

    // TODO: Handle activation
    // - Send welcome/activation email
    // - Update client status
    // - Trigger onboarding sequence
}

export { handler };
