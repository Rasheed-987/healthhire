import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export class PaymentService {
  async createPaymentIntent(amount: number, description: string = 'HealthHire Portal Premium Access') {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to pence
        currency: "gbp",
        description,
        metadata: {
          product: 'healthhire_premium',
          type: 'one_time'
        }
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  async verifyPayment(paymentIntentId: string) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return {
        success: paymentIntent.status === 'succeeded',
        amount: paymentIntent.amount / 100, // Convert back to pounds
        currency: paymentIntent.currency,
        status: paymentIntent.status
      };
    } catch (error) {
      console.error('Payment verification failed:', error);
      throw new Error('Failed to verify payment');
    }
  }

  async handleWebhook(rawBody: string, signature: string) {
    try {
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.warn('STRIPE_WEBHOOK_SECRET not configured - webhook verification skipped');
        // In production, you should set up webhook endpoints and provide the secret
        // For now, we'll parse the body directly (less secure)
        return JSON.parse(rawBody);
      }

      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );

      return event;
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw new Error('Invalid webhook signature');
    }
  }
}

export const paymentService = new PaymentService();