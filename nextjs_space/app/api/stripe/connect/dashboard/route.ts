import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getStripe } from '@/lib/stripe';

// GET: Create login link to Stripe Express Dashboard
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
      return NextResponse.json(
        { error: 'No Stripe account connected' },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    
    // Create a login link to the Express Dashboard
    const loginLink = await stripe.accounts.createLoginLink(
      profile.stripeAccount.stripeAccountId
    );

    return NextResponse.json({
      success: true,
      dashboardUrl: loginLink.url,
    });
  } catch (error) {
    console.error('Error creating dashboard link:', error);
    return NextResponse.json(
      { error: 'Failed to create dashboard link' },
      { status: 500 }
    );
  }
}
