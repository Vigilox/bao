import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getStripe, constructWebhookEvent, toDollars } from '@/lib/stripe';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    let event: Stripe.Event;

    try {
      event = constructWebhookEvent(stripe, body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      case 'transfer.created':
        console.log('Transfer created:', event.data.object);
        break;

      case 'payout.paid':
        await handlePayoutPaid(event.data.object as Stripe.Payout);
        break;

      case 'payout.failed':
        await handlePayoutFailed(event.data.object as Stripe.Payout);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent;

  if (metadata.type === 'tip') {
    // Update tip status
    const tip = await prisma.tip.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: { recipientProfile: true },
    });

    if (tip) {
      await prisma.$transaction([
        // Update tip status
        prisma.tip.update({
          where: { id: tip.id },
          data: { status: 'COMPLETED' },
        }),
        // Update creator earnings
        prisma.creatorProfile.update({
          where: { id: tip.recipientProfileId },
          data: {
            totalEarnings: { increment: tip.creatorAmount },
            availableBalance: { increment: tip.creatorAmount },
          },
        }),
        // Create transaction record
        prisma.transaction.create({
          data: {
            userId: tip.recipientProfile.userId,
            type: 'TIP',
            amount: tip.creatorAmount,
            status: 'COMPLETED',
            description: `Tip received${tip.isAnonymous ? ' (anonymous)' : ''}`,
            referenceId: tip.id,
            stripePaymentId: paymentIntent.id,
          },
        }),
      ]);

      // Create notification for creator
      await prisma.notification.create({
        data: {
          userId: tip.recipientProfile.userId,
          actorId: tip.senderUserId,
          type: 'tip',
          postId: tip.postId,
          message: `You received a $${tip.creatorAmount.toFixed(2)} tip${tip.message ? `: "${tip.message}"` : ''}`,
        },
      });
    }
  } else if (metadata.type === 'premium_content') {
    // Handle premium content purchase
    const purchase = await prisma.contentPurchase.findUnique({
      where: { stripePaymentIntentId: paymentIntent.id },
      include: {
        premiumContent: {
          include: {
            post: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (purchase) {
      await prisma.$transaction([
        prisma.contentPurchase.update({
          where: { id: purchase.id },
          data: { status: 'COMPLETED' },
        }),
        prisma.premiumContent.update({
          where: { id: purchase.premiumContentId },
          data: {
            totalPurchases: { increment: 1 },
            totalRevenue: { increment: purchase.amount },
          },
        }),
      ]);
    }
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  const { metadata } = paymentIntent;

  if (metadata.type === 'tip') {
    await prisma.tip.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: { status: 'FAILED' },
    });
  } else if (metadata.type === 'premium_content') {
    await prisma.contentPurchase.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: { status: 'FAILED' },
    });
  }
}

async function handleAccountUpdated(account: Stripe.Account) {
  const stripeAccount = await prisma.stripeConnectAccount.findUnique({
    where: { stripeAccountId: account.id },
  });

  if (stripeAccount) {
    const newStatus = account.details_submitted && account.charges_enabled
      ? 'ACTIVE'
      : account.details_submitted
      ? 'RESTRICTED'
      : 'ONBOARDING';

    await prisma.stripeConnectAccount.update({
      where: { id: stripeAccount.id },
      data: {
        status: newStatus,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled ?? false,
        detailsSubmitted: account.details_submitted,
        onboardingCompletedAt:
          newStatus === 'ACTIVE' && !stripeAccount.onboardingCompletedAt
            ? new Date()
            : stripeAccount.onboardingCompletedAt,
      },
    });
  }
}

async function handlePayoutPaid(payout: Stripe.Payout) {
  // Update withdrawal status if we track it by payout ID
  if (payout.metadata?.withdrawalId) {
    await prisma.withdrawal.update({
      where: { id: payout.metadata.withdrawalId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });
  }
}

async function handlePayoutFailed(payout: Stripe.Payout) {
  if (payout.metadata?.withdrawalId) {
    await prisma.withdrawal.update({
      where: { id: payout.metadata.withdrawalId },
      data: {
        status: 'FAILED',
        failureReason: payout.failure_message || 'Payout failed',
      },
    });
  }
}
