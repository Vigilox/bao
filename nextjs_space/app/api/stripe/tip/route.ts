import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  getStripe,
  calculateFees,
  createTipPaymentIntent,
  MIN_TIP_AMOUNT,
} from '@/lib/stripe';

// POST: Create a tip payment intent
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // Tips can be sent by logged-in users or anonymous
    
    const body = await request.json();
    const { creatorUsername, amount, message, postId, isAnonymous } = body;

    if (!creatorUsername || !amount) {
      return NextResponse.json(
        { error: 'Creator username and amount are required' },
        { status: 400 }
      );
    }

    if (amount < MIN_TIP_AMOUNT) {
      return NextResponse.json(
        { error: `Minimum tip amount is $${MIN_TIP_AMOUNT}` },
        { status: 400 }
      );
    }

    // Get creator profile with Stripe account
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { username: creatorUsername },
      include: {
        stripeAccount: true,
        user: { select: { id: true, name: true } },
      },
    });

    if (!creatorProfile) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    if (!creatorProfile.acceptsTips) {
      return NextResponse.json(
        { error: 'This creator is not accepting tips' },
        { status: 400 }
      );
    }

    if (amount < creatorProfile.minimumTip) {
      return NextResponse.json(
        { error: `Minimum tip for this creator is $${creatorProfile.minimumTip}` },
        { status: 400 }
      );
    }

    if (!creatorProfile.stripeAccount || creatorProfile.stripeAccount.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Creator has not set up payments yet' },
        { status: 400 }
      );
    }

    // Calculate fees
    const { platformFee, creatorAmount } = calculateFees(amount);

    // Create Stripe payment intent
    const stripe = getStripe();
    const paymentIntent = await createTipPaymentIntent(stripe, {
      amount,
      connectedAccountId: creatorProfile.stripeAccount.stripeAccountId,
      platformFee,
      metadata: {
        type: 'tip',
        creatorProfileId: creatorProfile.id,
        creatorUsername: creatorUsername,
        senderUserId: session?.user?.id || 'anonymous',
        postId: postId || '',
        isAnonymous: String(isAnonymous || false),
      },
    });

    // Create tip record in database
    const tip = await prisma.tip.create({
      data: {
        recipientProfileId: creatorProfile.id,
        senderUserId: session?.user?.id || null,
        postId: postId || null,
        amount,
        platformFee,
        creatorAmount,
        message: message || null,
        isAnonymous: isAnonymous || !session?.user?.id,
        stripePaymentIntentId: paymentIntent.id,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      tipId: tip.id,
      amount,
      platformFee,
      creatorAmount,
    });
  } catch (error) {
    console.error('Error creating tip:', error);
    return NextResponse.json(
      { error: 'Failed to create tip payment' },
      { status: 500 }
    );
  }
}

// GET: Get tips received by creator
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const profile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ tips: [], total: 0 });
    }

    const [tips, total] = await Promise.all([
      prisma.tip.findMany({
        where: {
          recipientProfileId: profile.id,
          status: 'COMPLETED',
        },
        include: {
          senderUser: {
            select: { id: true, name: true, image: true },
          },
          post: {
            select: { id: true, title: true, thumbnailUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.tip.count({
        where: {
          recipientProfileId: profile.id,
          status: 'COMPLETED',
        },
      }),
    ]);

    return NextResponse.json({
      tips: tips.map((tip) => ({
        id: tip.id,
        amount: tip.amount,
        creatorAmount: tip.creatorAmount,
        message: tip.message,
        isAnonymous: tip.isAnonymous,
        sender: tip.isAnonymous ? null : tip.senderUser,
        post: tip.post,
        createdAt: tip.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Error fetching tips:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tips' },
      { status: 500 }
    );
  }
}
