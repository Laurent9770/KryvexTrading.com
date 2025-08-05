const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Create checkout session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { amount, currency = 'usd', description = 'Kryvex Trading Deposit' } = req.body;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: currency,
            product_data: { 
              name: description,
              description: 'Deposit to your Kryvex Trading account'
            },
            unit_amount: amount, // Amount in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/dashboard?canceled=true`,
      metadata: {
        userId: req.user?.id || 'anonymous',
        type: 'deposit'
      }
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error('Stripe session error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Create subscription checkout session
router.post('/create-subscription-session', async (req, res) => {
  try {
    const { priceId, description = 'Kryvex Pro Subscription' } = req.body;
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/dashboard?canceled=true`,
      metadata: {
        userId: req.user?.id || 'anonymous',
        type: 'subscription'
      }
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error('Stripe subscription session error:', err);
    res.status(500).json({ error: 'Failed to create subscription session' });
  }
});

// Webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Payment successful:', session.id);
      // Here you would update user's balance in your database
      // await updateUserBalance(session.metadata.userId, session.amount_total);
      break;
    case 'customer.subscription.created':
      const subscription = event.data.object;
      console.log('Subscription created:', subscription.id);
      break;
    case 'customer.subscription.updated':
      const updatedSubscription = event.data.object;
      console.log('Subscription updated:', updatedSubscription.id);
      break;
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      console.log('Subscription deleted:', deletedSubscription.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Get payment intent status
router.get('/payment-intent/:id', async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(req.params.id);
    res.json(paymentIntent);
  } catch (err) {
    console.error('Error retrieving payment intent:', err);
    res.status(500).json({ error: 'Failed to retrieve payment intent' });
  }
});

module.exports = router; 