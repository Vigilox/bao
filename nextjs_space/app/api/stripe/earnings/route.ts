import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET: Get creator's earnings summary
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        stripeAccount: true,
      },
    });

    if (!profile) {
      return NextResponse.json({
        totalEarnings: 0,
        availableBalance: 0,
        pendingBalance: 0,
        totalTips: 0,
        totalPremiumSales: 0,
        stripeConnected: false,
      });
    }

    // Get earnings breakdown
    const [tipStats, recentTips, monthlyStats] = await Promise.all([
      // Total completed tips
      prisma.tip.aggregate({
        where: {
          recipientProfileId: profile.id,
          status: 'COMPLETED',
        },
        _sum: { creatorAmount: true },
        _count: true,
      }),
      // Recent tips (last 30 days)
      prisma.tip.findMany({
        where: {
          recipientProfileId: profile.id,
          status: 'COMPLETED',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          creatorAmount: true,
          createdAt: true,
        },
      }),
      // Monthly breakdown
      prisma.$queryRaw<{ month: Date; total: number }[]>`
        SELECT
          DATE_TRUNC('month', "createdAt") as month,
          SUM("creatorAmount") as total
        FROM tips
        WHERE "recipientProfileId" = ${profile.id}
          AND status = 'COMPLETED'
          AND "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY month DESC
      `,
    ]);

    // Calculate pending balance (tips not yet transferred)
    const pendingTips = await prisma.tip.aggregate({
      where: {
        recipientProfileId: profile.id,
        status: 'PENDING',
      },
      _sum: { creatorAmount: true },
    });

    // Last 30 days earnings
    const last30DaysEarnings = recentTips.reduce(
      (sum, tip) => sum + tip.creatorAmount,
      0
    );

    return NextResponse.json({
      totalEarnings: profile.totalEarnings,
      availableBalance: profile.availableBalance,
      pendingBalance: pendingTips._sum.creatorAmount || 0,
      totalTips: tipStats._count,
      totalTipAmount: tipStats._sum.creatorAmount || 0,
      last30DaysEarnings,
      monthlyBreakdown: monthlyStats.map((stat) => ({
        month: stat.month,
        total: Number(stat.total),
      })),
      stripeConnected: !!profile.stripeAccount,
      stripeStatus: profile.stripeAccount?.status || null,
      acceptsTips: profile.acceptsTips,
      minimumTip: profile.minimumTip,
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
}

// PATCH: Update monetization settings
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { acceptsTips, minimumTip, tipMessage } = body;

    const profile = await prisma.creatorProfile.update({
      where: { userId: session.user.id },
      data: {
        ...(acceptsTips !== undefined && { acceptsTips }),
        ...(minimumTip !== undefined && { minimumTip: Math.max(1, minimumTip) }),
        ...(tipMessage !== undefined && { tipMessage }),
      },
    });

    return NextResponse.json({
      success: true,
      acceptsTips: profile.acceptsTips,
      minimumTip: profile.minimumTip,
      tipMessage: profile.tipMessage,
    });
  } catch (error) {
    console.error('Error updating monetization settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
