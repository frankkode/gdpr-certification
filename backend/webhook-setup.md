# Webhook Setup Guide

## Problem
Your webhook isn't catching Stripe events because Stripe can't reach `localhost:5000` from the internet.

## Solution: Use ngrok for local development

### Step 1: Install ngrok
```bash
# Option 1: npm
npm install -g ngrok

# Option 2: Download from https://ngrok.com/download
```

### Step 2: Start ngrok tunnel
```bash
# In a new terminal, run:
ngrok http 5000
```

This will output something like:
```
Forwarding    https://abc123def.ngrok.io -> http://localhost:5000
```

### Step 3: Update Stripe Dashboard
1. Go to Stripe Dashboard → Developers → Webhooks
2. Create new webhook or edit existing one
3. Set Endpoint URL to: `https://abc123def.ngrok.io/payments/webhook`
4. Select these events:
   - `payment_intent.succeeded`
   - `checkout.session.completed`
   - `payment_intent.payment_failed`

### Step 4: Test webhook
1. Make a test payment through your frontend
2. Check ngrok terminal for incoming requests
3. Check your backend server logs for webhook processing

### Step 5: Monitor webhook calls
```bash
# In ngrok terminal, you'll see:
POST /payments/webhook    200 OK

# In your server logs, you'll see:
Payment completed for user 123 - professional plan
```

## Alternative: Use Stripe CLI for testing
```bash
# Install Stripe CLI
# Forward events to local server
stripe listen --forward-to localhost:5000/payments/webhook

# Trigger test events
stripe trigger payment_intent.succeeded
```

## Production Setup
For production, your webhook URL should be:
`https://yourdomain.com/payments/webhook`