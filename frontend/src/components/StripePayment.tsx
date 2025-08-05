import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import stripeService from '@/services/stripeService';

interface StripePaymentProps {
  type: 'deposit' | 'subscription';
  priceId?: string; // For subscriptions
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const StripePayment: React.FC<StripePaymentProps> = ({
  type,
  priceId,
  onSuccess,
  onCancel
}) => {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('usd');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handlePayment = async () => {
    if (type === 'deposit' && !amount) {
      toast({
        title: "Error",
        description: "Please enter an amount",
        variant: "destructive"
      });
      return;
    }

    if (type === 'subscription' && !priceId) {
      toast({
        title: "Error",
        description: "Subscription price ID is required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (type === 'deposit') {
        await stripeService.handleDeposit(parseFloat(amount), currency);
      } else if (type === 'subscription' && priceId) {
        await stripeService.handleSubscription(priceId);
      }
      
      toast({
        title: "Success",
        description: "Redirecting to payment...",
      });
      
      onSuccess?.();
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {type === 'deposit' ? 'Make a Deposit' : 'Subscribe to Pro'}
        </CardTitle>
        <CardDescription>
          {type === 'deposit' 
            ? 'Add funds to your trading account' 
            : 'Get access to premium features'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {type === 'deposit' && (
          <>
            <div className="space-y-2">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount
              </label>
              <Input
                id="amount"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="currency" className="text-sm font-medium">
                Currency
              </label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="eur">EUR</SelectItem>
                  <SelectItem value="gbp">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {type === 'subscription' && (
          <div className="text-center py-4">
            <p className="text-lg font-semibold">Kryvex Pro Subscription</p>
            <p className="text-sm text-muted-foreground">
              Get access to advanced trading features
            </p>
          </div>
        )}

        <div className="flex space-x-2">
          <Button
            onClick={handlePayment}
            disabled={loading || (type === 'deposit' && !amount)}
            className="flex-1"
          >
            {loading ? 'Processing...' : type === 'deposit' ? 'Pay Now' : 'Subscribe'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Secure payment powered by Stripe
        </div>
      </CardContent>
    </Card>
  );
};

export default StripePayment; 