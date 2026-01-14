import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getStripe, createConnectAccount, createAccountLink } from '@/lib/stripe';

// POST: Create Stripe Connect account and get onboarding link
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's creator profile
    const profile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
      include: { stripeAccount: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: 'Creator profile not found. Please create a profile first.' },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    const returnUrl = `${origin}/dashboard?tab=earnings&stripe=connected`;
    const refreshUrl = `${origin}/dashboard?tab=earnings&stripe=refresh`;

    let stripeAccountId: string;

    // Check if user already has a Stripe account
    if (profile.stripeAccount) {
      stripeAccountId = profile.stripeAccount.stripeAccountId;
      
      // Check if onboarding is complete
      const account = await stripe.accounts.retrieve(stripeAccountId);
      
      if (account.details_submitted && account.charges_enabled) {
        return NextResponse.json({
          success: true,
          message: 'Stripe account already connected',
          isComplete: true,
          account: {
            id: stripeAccountId,
            chargesEnabled: account.charges_enabled,
            payoutsEnabled: account.payouts_enabled,
          },
        });
      }
    } else {
      // Create new Stripe Connect account
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true },
      });

      const stripeAccount = await createConnectAccount(stripe, {
        email: user?.email || '',
        country: 'US',
        businessType: 'individual',
      });

      stripeAccountId = stripeAccount.id;

      // Save to database
      await prisma.stripeConnectAccount.create({
        data: {
          creatorProfileId: profile.id,
          stripeAccountId: stripeAccountId,
          status: 'ONBOARDING',
          email: user?.email,
          country: 'US',
          businessType: 'individual',
        },
      });
    }

    // Create account link for onboarding
    const accountLink = await createAccountLink(
      stripe,
      stripeAccountId,
      refreshUrl,
      returnUrl
    );

    return NextResponse.json({
      success: true,
      onboardingUrl: accountLink.url,
      accountId: stripeAccountId,
    });
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error);
    return NextResponse.json(
      { error: 'Failed to create Stripe Connect account' },
      { status: 500 }
    );
  }
}

// GET: Get Connect account status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
      include: { stripeAccount: true },
    });

    if (!profile?.stripeAccount) {
      return NextResponse.json({
        connected: false,
        message: 'No Stripe account connected',
      });
    }

    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(
      profile.stripeAccount.stripeAccountId
    );

    // Update database if status changed
    const newStatus = account.details_submitted && account.charges_enabled
      ? 'ACTIVE'
      : account.details_submitted
      ? 'RESTRICTED'
      : 'ONBOARDING';

    if (newStatus !== profile.stripeAccount.status) {
      await prisma.stripeConnectAccount.update({
        where: { id: profile.stripeAccount.id },
        data: {
          status: newStatus,
          chargesEnabled: account.charges_enabled,
          payoutsEnabled: account.payouts_enabled ?? false,
          detailsSubmitted: account.details_submitted,
          onboardingCompletedAt: newStatus === 'ACTIVE' ? new Date() : null,
        },
      });
    }

    return NextResponse.json({
      connected: true,
      accountId: profile.stripeAccount.stripeAccountId,
      status: newStatus,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      email: account.email,
    });
  } catch (error) {
    console.error('Error fetching Connect account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Stripe account status' },
      { status: 500 }
    );
  }
}
