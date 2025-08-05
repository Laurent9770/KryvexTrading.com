import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51Rsffa1ALmImltzk3JmrnffWZiAbqOe3TO93cfKH86fpuIxSAjkYg2zAAMBUzde84WLH28NJXPlK06ExYLznRUdo00Q6owNm5i');

export interface CheckoutSessionRequest {
  amount: number; // Amount in cents
  currency?: string;
  description?: string;
}

export interface SubscriptionSessionRequest {
  priceId: string;
  description?: string;
}

export class StripeService {
  private static instance: StripeService;
  private apiUrl: string;

  private constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'https://kryvextrading-com.onrender.com';
  }

  public static getInstance(): StripeService {
    if (!StripeService.instance) {
      StripeService.instance = new StripeService();
    }
    return StripeService.instance;
  }

  // Create a one-time payment checkout session
  async createCheckoutSession(request: CheckoutSessionRequest): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  // Create a subscription checkout session
  async createSubscriptionSession(request: SubscriptionSessionRequest): Promise<string> {
    try {
      const response = await fetch(`${this.apiUrl}/api/stripe/create-subscription-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription session');
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error creating subscription session:', error);
      throw error;
    }
  }

  // Redirect to Stripe Checkout
  async redirectToCheckout(sessionId: string): Promise<void> {
    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: sessionId
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error redirecting to checkout:', error);
      throw error;
    }
  }

  // Handle deposit payment
  async handleDeposit(amount: number, currency: string = 'usd'): Promise<void> {
    try {
      const sessionId = await this.createCheckoutSession({
        amount: amount * 100, // Convert to cents
        currency: currency,
        description: 'Kryvex Trading Deposit'
      });

      await this.redirectToCheckout(sessionId);
    } catch (error) {
      console.error('Error handling deposit:', error);
      throw error;
    }
  }

  // Handle subscription payment
  async handleSubscription(priceId: string, description: string = 'Kryvex Pro Subscription'): Promise<void> {
    try {
      const sessionId = await this.createSubscriptionSession({
        priceId: priceId,
        description: description
      });

      await this.redirectToCheckout(sessionId);
    } catch (error) {
      console.error('Error handling subscription:', error);
      throw error;
    }
  }

  // Check payment status
  async checkPaymentStatus(paymentIntentId: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/api/stripe/payment-intent/${paymentIntentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check payment status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error checking payment status:', error);
      throw error;
    }
  }
}

export default StripeService.getInstance(); 