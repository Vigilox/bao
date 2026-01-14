'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Heart, Check, AlertCircle, DollarSign } from 'lucide-react';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorUsername: string;
  creatorDisplayName: string;
  minimumTip: number;
  tipMessage?: string | null;
  postId?: string;
}

const TIP_AMOUNTS = [1, 5, 10, 25, 50, 100];

export function TipModal({
  isOpen,
  onClose,
  creatorUsername,
  creatorDisplayName,
  minimumTip,
  tipMessage,
  postId,
}: TipModalProps) {
  const [step, setStep] = useState<'amount' | 'payment' | 'success' | 'error'>(
    'amount'
  );
  const [amount, setAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tipDetails, setTipDetails] = useState<{
    amount: number;
    platformFee: number;
    creatorAmount: number;
  } | null>(null);

  const finalAmount = customAmount ? parseFloat(customAmount) : amount;

  const handleAmountSelect = (value: number) => {
    setAmount(value);
    setCustomAmount('');
    setError(null);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setError(null);
  };

  const handleContinueToPayment = async () => {
    if (finalAmount < minimumTip) {
      setError(`Minimum tip is $${minimumTip}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/stripe/tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorUsername,
          amount: finalAmount,
          message: message || null,
          postId,
          isAnonymous,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create tip');
      }

      setClientSecret(data.clientSecret);
      setTipDetails({
        amount: data.amount,
        platformFee: data.platformFee,
        creatorAmount: data.creatorAmount,
      });
      setStep('payment');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('amount');
    setAmount(5);
    setCustomAmount('');
    setMessage('');
    setIsAnonymous(false);
    setClientSecret(null);
    setError(null);
    setTipDetails(null);
    onClose();
  };

  const handlePaymentSuccess = () => {
    setStep('success');
  };

  const handlePaymentError = (msg: string) => {
    setError(msg);
    setStep('error');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'amount' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-500" />
                Support {creatorDisplayName}
              </DialogTitle>
              {tipMessage && (
                <DialogDescription className="text-sm italic">
                  "{tipMessage}"
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Preset amounts */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Select amount</Label>
                <div className="grid grid-cols-3 gap-2">
                  {TIP_AMOUNTS.map((value) => (
                    <Button
                      key={value}
                      variant={amount === value && !customAmount ? 'default' : 'outline'}
                      onClick={() => handleAmountSelect(value)}
                      className="h-12"
                    >
                      ${value}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom amount */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Or enter custom amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min={minimumTip}
                    step="0.01"
                    placeholder={`${minimumTip} minimum`}
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Add a message (optional)</Label>
                <Textarea
                  placeholder="Say something nice..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  maxLength={500}
                  rows={2}
                />
              </div>

              {/* Anonymous option */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="anonymous"
                  checked={isAnonymous}
                  onCheckedChange={(checked) => setIsAnonymous(checked === true)}
                />
                <Label htmlFor="anonymous" className="text-sm cursor-pointer">
                  Send anonymously
                </Label>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              <Button
                onClick={handleContinueToPayment}
                disabled={loading || !finalAmount || finalAmount < minimumTip}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Heart className="w-4 h-4 mr-2" />
                )}
                Continue to Payment - ${finalAmount.toFixed(2)}
              </Button>
            </div>
          </>
        )}

        {step === 'payment' && clientSecret && (
          <>
            <DialogHeader>
              <DialogTitle>Complete Payment</DialogTitle>
              <DialogDescription>
                ${tipDetails?.amount.toFixed(2)} tip to {creatorDisplayName}
              </DialogDescription>
            </DialogHeader>

            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#2B5FD9',
                  },
                },
              }}
            >
              <PaymentForm
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
          </>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Tip Sent!</h3>
            <p className="text-muted-foreground mb-6">
              Thank you for supporting {creatorDisplayName}!
            </p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        )}

        {step === 'error' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Payment Failed</h3>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => setStep('amount')}>Try Again</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function PaymentForm({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: 'if_required',
    });

    if (error) {
      onError(error.message || 'Payment failed');
    } else {
      onSuccess();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <PaymentElement />
      <Button type="submit" disabled={!stripe || loading} className="w-full">
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : null}
        Complete Payment
      </Button>
    </form>
  );
}
