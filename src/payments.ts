// Payment Processing Module

export interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'applepay' | 'googlepay';
  last4?: string;
  brand?: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'pro';
  status: 'active' | 'cancelled' | 'expired';
  bookingsRemaining: number;
  currentPeriodEnd: Date;
}

export class PaymentProcessor {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async charge(userId: string, amount: number, paymentMethodId: string): Promise<{ transactionId: string }> {
    console.log(`Charging user ${userId}: $${amount.toFixed(2)} with payment method ${paymentMethodId}`);
    
    // In production, integrate with Stripe
    // const stripe = require('stripe')(this.config.stripeSecretKey);
    // const charge = await stripe.charges.create({...});

    return {
      transactionId: `TXN-${Date.now()}`,
    };
  }

  async refund(userId: string, amount: number): Promise<{ refundId: string }> {
    console.log(`Refunding user ${userId}: $${amount.toFixed(2)}`);
    
    return {
      refundId: `REF-${Date.now()}`,
    };
  }

  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    // Return saved payment methods
    return [
      {
        id: 'pm_001',
        type: 'card',
        last4: '4242',
        brand: 'Visa',
      },
    ];
  }

  async addPaymentMethod(userId: string, paymentDetails: any): Promise<PaymentMethod> {
    console.log(`Adding payment method for user ${userId}`);
    
    return {
      id: `pm_${Date.now()}`,
      type: 'card',
      last4: paymentDetails.last4 || '1234',
      brand: paymentDetails.brand || 'Visa',
    };
  }

  async removePaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    console.log(`Removing payment method ${paymentMethodId} for user ${userId}`);
  }

  // Subscription Management
  async createSubscription(userId: string, plan: 'pro'): Promise<Subscription> {
    console.log(`Creating ${plan} subscription for user ${userId}`);
    
    return {
      id: `sub_${Date.now()}`,
      userId,
      plan,
      status: 'active',
      bookingsRemaining: plan === 'pro' ? 10 : 0,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };
  }

  async getSubscription(userId: string): Promise<Subscription | null> {
    console.log(`Getting subscription for user ${userId}`);
    
    // Return mock subscription
    return {
      id: 'sub_001',
      userId,
      plan: 'pro',
      status: 'active',
      bookingsRemaining: 8,
      currentPeriodEnd: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    };
  }

  async cancelSubscription(userId: string): Promise<void> {
    console.log(`Cancelling subscription for user ${userId}`);
  }

  async useBooking(userId: string): Promise<boolean> {
    const subscription = await this.getSubscription(userId);
    
    if (!subscription) return false;
    
    if (subscription.bookingsRemaining > 0) {
      subscription.bookingsRemaining--;
      return true;
    }
    
    return false;
  }

  // Calculate Service Fee
  calculateServiceFee(bookingPrice: number, userHasSubscription: boolean = false): number {
    if (userHasSubscription) {
      return 0; // No service fee for pro members
    }
    
    // Default: $2.99 per booking, or 3% of booking price (whichever is higher)
    const percentageFee = bookingPrice * 0.03;
    return Math.max(2.99, percentageFee);
  }
}
