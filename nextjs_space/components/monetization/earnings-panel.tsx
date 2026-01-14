'use client';

import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Wallet,
  CreditCard,
  Settings,
  ExternalLink,
  Loader2,
  CheckCircle,
  AlertCircle,
  Heart,
  BadgeDollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface EarningsData {
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  totalTips: number;
  totalTipAmount: number;
  last30DaysEarnings: number;
  monthlyBreakdown: { month: string; total: number }[];
  stripeConnected: boolean;
  stripeStatus: string | null;
  acceptsTips: boolean;
  minimumTip: number;
}

interface Tip {
  id: string;
  amount: number;
  creatorAmount: number;
  message: string | null;
  isAnonymous: boolean;
  sender: {
    id: string;
    name: string;
    image: string | null;
  } | null;
  post: {
    id: string;
    title: string | null;
    thumbnailUrl: string | null;
  } | null;
  createdAt: string;
}

export function EarningsPanel() {
  const [activeTab, setActiveTab] = useState('overview');
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Settings form
  const [acceptsTips, setAcceptsTips] = useState(false);
  const [minimumTip, setMinimumTip] = useState(1);
  const [tipMessage, setTipMessage] = useState('');

  useEffect(() => {
    fetchEarnings();
    fetchTips();
  }, []);

  const fetchEarnings = async () => {
    try {
      const res = await fetch('/api/stripe/earnings');
      if (res.ok) {
        const data = await res.json();
        setEarnings(data);
        setAcceptsTips(data.acceptsTips);
        setMinimumTip(data.minimumTip);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTips = async () => {
    try {
      const res = await fetch('/api/stripe/tip');
      if (res.ok) {
        const data = await res.json();
        setTips(data.tips || []);
      }
    } catch (error) {
      console.error('Error fetching tips:', error);
    }
  };

  const connectStripe = async () => {
    setConnectingStripe(true);
    try {
      const res = await fetch('/api/stripe/connect', {
        method: 'POST',
      });
      const data = await res.json();
      
      if (data.onboardingUrl) {
        window.location.href = data.onboardingUrl;
      } else if (data.isComplete) {
        fetchEarnings();
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
    } finally {
      setConnectingStripe(false);
    }
  };

  const openStripeDashboard = async () => {
    try {
      const res = await fetch('/api/stripe/connect/dashboard');
      const data = await res.json();
      if (data.dashboardUrl) {
        window.open(data.dashboardUrl, '_blank');
      }
    } catch (error) {
      console.error('Error opening dashboard:', error);
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch('/api/stripe/earnings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acceptsTips,
          minimumTip,
          tipMessage,
        }),
      });
      if (res.ok) {
        fetchEarnings();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Earnings</h2>
          <p className="text-muted-foreground">Manage your monetization and payouts</p>
        </div>
        {earnings?.stripeConnected && earnings.stripeStatus === 'ACTIVE' && (
          <Button variant="outline" onClick={openStripeDashboard}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Stripe Dashboard
          </Button>
        )}
      </div>

      {/* Stripe Connection Status */}
      {!earnings?.stripeConnected && (
        <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Connect Stripe to Accept Tips</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Set up your Stripe account to receive tips from your supporters. It only takes a few minutes.
                </p>
                <Button onClick={connectStripe} disabled={connectingStripe}>
                  {connectingStripe ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="w-4 h-4 mr-2" />
                  )}
                  Connect Stripe Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {earnings?.stripeConnected && earnings.stripeStatus !== 'ACTIVE' && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Complete Stripe Setup</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Your Stripe account setup is incomplete. Please finish the onboarding process to start receiving tips.
                </p>
                <Button onClick={connectStripe} disabled={connectingStripe}>
                  {connectingStripe ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Complete Setup
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {earnings?.stripeConnected && earnings.stripeStatus === 'ACTIVE' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="text-2xl font-bold">${earnings.totalEarnings.toFixed(2)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Available Balance</p>
                    <p className="text-2xl font-bold">${earnings.availableBalance.toFixed(2)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Last 30 Days</p>
                    <p className="text-2xl font-bold">${earnings.last30DaysEarnings.toFixed(2)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tips</p>
                    <p className="text-2xl font-bold">{earnings.totalTips}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-pink-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tips">Recent Tips</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Earnings</CardTitle>
                  <CardDescription>Your earnings over the past 12 months</CardDescription>
                </CardHeader>
                <CardContent>
                  {earnings.monthlyBreakdown.length > 0 ? (
                    <div className="space-y-3">
                      {earnings.monthlyBreakdown.map((month) => (
                        <div key={month.month} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {new Date(month.month).toLocaleDateString('en-US', {
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                          <span className="font-medium">${month.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No earnings data yet. Start accepting tips to see your stats!
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tips" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Tips</CardTitle>
                  <CardDescription>Tips you've received from your supporters</CardDescription>
                </CardHeader>
                <CardContent>
                  {tips.length > 0 ? (
                    <div className="space-y-4">
                      {tips.map((tip) => (
                        <div
                          key={tip.id}
                          className="flex items-start gap-4 p-4 border rounded-lg"
                        >
                          <Avatar>
                            <AvatarImage src={tip.sender?.image || undefined} />
                            <AvatarFallback>
                              {tip.isAnonymous
                                ? '?'
                                : tip.sender?.name?.[0]?.toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {tip.isAnonymous ? 'Anonymous' : tip.sender?.name}
                              </span>
                              <Badge variant="secondary" className="text-green-600">
                                +${tip.creatorAmount.toFixed(2)}
                              </Badge>
                            </div>
                            {tip.message && (
                              <p className="text-sm text-muted-foreground mt-1">
                                "{tip.message}"
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(tip.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No tips received yet. Share your profile to start earning!
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monetization Settings</CardTitle>
                  <CardDescription>Configure how you receive tips</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="accept-tips" className="text-base">Accept Tips</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow supporters to send you tips
                      </p>
                    </div>
                    <Switch
                      id="accept-tips"
                      checked={acceptsTips}
                      onCheckedChange={setAcceptsTips}
                    />
                  </div>

                  <div>
                    <Label htmlFor="minimum-tip">Minimum Tip Amount ($)</Label>
                    <Input
                      id="minimum-tip"
                      type="number"
                      min={1}
                      step="0.5"
                      value={minimumTip}
                      onChange={(e) => setMinimumTip(parseFloat(e.target.value) || 1)}
                      className="mt-2 max-w-xs"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum: $1.00
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="tip-message">Tip Button Message (optional)</Label>
                    <Textarea
                      id="tip-message"
                      placeholder="e.g., Your support helps me create more content!"
                      value={tipMessage}
                      onChange={(e) => setTipMessage(e.target.value)}
                      className="mt-2"
                      maxLength={200}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This message appears on your tip button
                    </p>
                  </div>

                  <Button onClick={saveSettings} disabled={savingSettings}>
                    {savingSettings ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Save Settings
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
