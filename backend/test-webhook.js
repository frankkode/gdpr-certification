#!/usr/bin/env node

/**
 * Stripe Webhook Testing Script
 * 
 * This script helps test your Stripe webhook integration locally.
 * Run: node test-webhook.js
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(color, ...args) {
  console.log(color, ...args, colors.reset);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https');
    const client = isHttps ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (err) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function testWebhookConfiguration() {
  log(colors.cyan, '\n🧪 Testing Stripe Webhook Configuration...\n');

  try {
    const response = await makeRequest(`${BASE_URL}/debug/webhook-test`);
    
    if (response.status === 200) {
      const config = response.data;
      
      log(colors.green, '✅ Webhook test endpoint accessible');
      
      // Check Stripe configuration
      if (config.configuration.stripeConfigured.secretKey) {
        log(colors.green, '✅ Stripe secret key configured');
      } else {
        log(colors.red, '❌ Stripe secret key missing');
      }
      
      if (config.configuration.stripeConfigured.webhookSecret) {
        log(colors.green, '✅ Stripe webhook secret configured');
      } else {
        log(colors.red, '❌ Stripe webhook secret missing');
      }
      
      // Check database
      if (config.configuration.databaseReady.tablesExist) {
        log(colors.green, '✅ Database tables ready');
      } else {
        log(colors.red, '❌ Database tables missing');
      }
      
      if (config.configuration.databaseReady.subscriptionPlansExist) {
        log(colors.green, '✅ Subscription plans configured');
      } else {
        log(colors.yellow, '⚠️  No subscription plans found');
      }
      
      // Show recent events
      if (config.recentWebhookEvents.length > 0) {
        log(colors.blue, `\n📊 Recent webhook events (${config.recentWebhookEvents.length}):`);
        config.recentWebhookEvents.forEach(event => {
          console.log(`   ${event.timestamp} - ${event.event_type}: ${event.event_description}`);
        });
      } else {
        log(colors.yellow, '\n⚠️  No recent webhook events found');
      }
      
      // Show next steps
      log(colors.magenta, '\n📋 Next Steps:');
      config.nextSteps.forEach(step => console.log(`   ${step}`));
      
      // Show testing instructions
      log(colors.cyan, '\n🛠️  Testing Instructions:');
      console.log(`   1. Install ngrok: npm install -g ngrok`);
      console.log(`   2. Start tunnel: ngrok http 5000`);
      console.log(`   3. Update Stripe webhook URL to: https://[ngrok-url]/payments/webhook`);
      console.log(`   4. Or use Stripe CLI: stripe listen --forward-to localhost:5000/payments/webhook`);
      
    } else {
      log(colors.red, `❌ Failed to test webhook configuration: ${response.status}`);
      console.log(response.data);
    }
  } catch (error) {
    log(colors.red, '❌ Error testing webhook configuration:', error.message);
  }
}

async function simulateWebhook(userId = 1, tier = 'premium') {
  log(colors.cyan, `\n🎬 Simulating webhook for user ${userId} with ${tier} tier...\n`);

  try {
    const response = await makeRequest(`${BASE_URL}/debug/webhook-simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        eventType: 'payment_intent.succeeded',
        userId,
        tier
      }
    });
    
    if (response.status === 200) {
      log(colors.green, '✅ Webhook simulation successful!');
      console.log('\n📊 Results:');
      console.log(`   Transaction Created: ${response.data.results.transactionCreated}`);
      console.log(`   User Updated: ${response.data.results.userUpdated}`);
      console.log(`   Subscription Expires: ${response.data.results.subscriptionExpires}`);
      console.log(`   Plan: ${JSON.stringify(response.data.results.planDetails, null, 2)}`);
    } else {
      log(colors.red, `❌ Webhook simulation failed: ${response.status}`);
      console.log(response.data);
    }
  } catch (error) {
    log(colors.red, '❌ Error simulating webhook:', error.message);
  }
}

async function checkWebhookLogs() {
  log(colors.cyan, '\n📊 Checking webhook logs...\n');

  try {
    const response = await makeRequest(`${BASE_URL}/debug/webhook-logs`);
    
    if (response.status === 200) {
      const logs = response.data;
      
      log(colors.green, '✅ Webhook logs retrieved');
      
      console.log('\n📈 Summary:');
      console.log(`   Total logs: ${logs.summary.totalLogs}`);
      console.log(`   Total transactions: ${logs.summary.totalTransactions}`);
      console.log(`   Completed payments: ${logs.summary.completedPayments}`);
      console.log(`   Failed payments: ${logs.summary.failedPayments}`);
      
      if (logs.webhookLogs.length > 0) {
        log(colors.blue, '\n📋 Recent webhook logs:');
        logs.webhookLogs.slice(0, 5).forEach(log => {
          console.log(`   ${log.timestamp} - ${log.event_type}: ${log.event_description}`);
        });
      }
      
      if (logs.recentTransactions.length > 0) {
        log(colors.blue, '\n💳 Recent transactions:');
        logs.recentTransactions.slice(0, 5).forEach(trans => {
          console.log(`   ${trans.created_at} - User ${trans.user_id}: $${(trans.amount_cents/100).toFixed(2)} ${trans.currency} (${trans.payment_status})`);
        });
      }
      
    } else {
      log(colors.red, `❌ Failed to get webhook logs: ${response.status}`);
      console.log(response.data);
    }
  } catch (error) {
    log(colors.red, '❌ Error checking webhook logs:', error.message);
  }
}

async function main() {
  log(colors.magenta, '🔔 Stripe Webhook Testing Tool');
  log(colors.magenta, '================================\n');
  
  console.log(`Testing server at: ${BASE_URL}\n`);
  
  // Run all tests
  await testWebhookConfiguration();
  await simulateWebhook();
  await checkWebhookLogs();
  
  log(colors.cyan, '\n✨ Testing complete! Check the results above.\n');
  
  // Show manual testing steps
  log(colors.yellow, '🧪 Manual Testing Steps:');
  console.log('1. Start your server: npm start (or node server.js)');
  console.log('2. In another terminal: ngrok http 5000');
  console.log('3. Copy the ngrok HTTPS URL (e.g., https://abc123.ngrok.io)');
  console.log('4. Go to Stripe Dashboard → Webhooks → Add endpoint');
  console.log('5. URL: https://abc123.ngrok.io/payments/webhook');
  console.log('6. Events: payment_intent.succeeded, checkout.session.completed');
  console.log('7. Test with a real payment through your frontend');
  console.log('8. Check ngrok terminal and server logs for webhook calls');
}

// Run the tests
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testWebhookConfiguration, simulateWebhook, checkWebhookLogs };