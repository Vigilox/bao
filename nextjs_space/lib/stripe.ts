import Stripe from 'stripe';

// Platform fee percentage (e.g., 10%)
export const PLATFORM_FEE_PERCENT = 10;

// Minimum amounts
export const MIN_TIP_AMOUNT = 1; // $1 minimum tip
export const MIN_WITHDRAWAL = 10; // $10 minimum withdrawal

// Create Stripe instance
export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  
  return new Stripe(secretKey, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  });
}

// Calculate platform fee and creator amount
export function calculateFees(amount: number): {
  platformFee: number;
  creatorAmount: number;
} {
  const platformFee = Math.round((amount * PLATFORM_FEE_PERCENT) / 100 * 100) / 100;
  const creatorAmount = Math.round((amount - platformFee) * 100) / 100;
  
  return { platformFee, creatorAmount };
}

// Convert dollars to cents for Stripe
export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// Convert cents to dollars
export function toDollars(cents: number): number {
  return cents / 100;
}

// Create Stripe Connect Express account
export async function createConnectAccount(
  stripe: Stripe,
  options: {
    email: string;
    country?: string;
    businessType?: 'individual' | 'company';
  }
) {
  return await stripe.accounts.create({
    type: 'express',
    country: options.country || 'US',
    email: options.email,
    business_type: options.businessType || 'individual',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
}

// Create account link for onboarding
export async function createAccountLink(
  stripe: Stripe,
  accountId: string,
  refreshUrl: string,
  returnUrl: string
) {
  return await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  });
}

// Get Connect account details
export async function getConnectAccount(stripe: Stripe, accountId: string) {
  return await stripe.accounts.retrieve(accountId);
}

// Create a payment intent for tips
export async function createTipPaymentIntent(
  stripe: Stripe,
  options: {
    amount: number; // in dollars
    connectedAccountId: string;
    platformFee: number; // in dollars
    metadata?: Record<string, string>;
  }
) {
  const amountInCents = toCents(options.amount);
  const platformFeeInCents = toCents(options.platformFee);
  
  return await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
    application_fee_amount: platformFeeInCents,
    transfer_data: {
      destination: options.connectedAccountId,
    },
    metadata: options.metadata || {},
  });
}

// Create a direct payment intent (for premium content without Connect)
export async function createPaymentIntent(
  stripe: Stripe,
  options: {
    amount: number; // in dollars
    metadata?: Record<string, string>;
  }
) {
  const amountInCents = toCents(options.amount);
  
  return await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
    metadata: options.metadata || {},
  });
}

// Create a payout to connected account
export async function createPayout(
  stripe: Stripe,
  options: {
    amount: number; // in dollars
    connectedAccountId: string;
    metadata?: Record<string, string>;
  }
) {
  const amountInCents = toCents(options.amount);
  
  // First, create a transfer to the connected account
  const transfer = await stripe.transfers.create({
    amount: amountInCents,
    currency: 'usd',
    destination: options.connectedAccountId,
    metadata: options.metadata || {},
  });
  
  return transfer;
}

// Verify webhook signature
export function constructWebhookEvent(
  stripe: Stripe,
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }
  
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
