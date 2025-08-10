#!/usr/bin/env node

/**
 * Subscription Plans Setup Script
 * 
 * This script initializes default subscription plans in the database.
 * Run: node setup-subscription-plans.js
 */

require('dotenv').config();
const { db, ensureTablesExist } = require('./db');

const SUBSCRIPTION_PLANS = [
  {
    plan_name: 'free',
    display_name: 'Free Plan',
    price: 0.00,
    currency: 'USD',
    certificate_limit: 1,
    features: [
      '1 certificate per month',
      'Basic templates only',
      'Standard verification',
      'Email support'
    ]
  },
  {
    plan_name: 'professional',
    display_name: 'Professional Plan',
    price: 9.99,
    currency: 'USD',
    certificate_limit: 10,
    features: [
      '10 certificates per month',
      'Premium templates',
      'Advanced verification',
      'Custom branding',
      'Priority support'
    ]
  },
  {
    plan_name: 'premium',
    display_name: 'Premium Plan',
    price: 19.99,
    currency: 'USD',
    certificate_limit: 30,
    features: [
      '30 certificates per month',
      'All templates',
      'Advanced analytics',
      'Custom templates',
      'Logo upload',
      'Priority support'
    ]
  },
  {
    plan_name: 'enterprise',
    display_name: 'Enterprise Plan',
    price: 49.99,
    currency: 'USD',
    certificate_limit: 100,
    features: [
      '100 certificates per month',
      'Unlimited templates',
      'Advanced analytics',
      'API access',
      'White-label solution',
      '24/7 support',
      'Custom integrations'
    ]
  }
];

async function setupSubscriptionPlans() {
  try {
    console.log('🔄 Setting up subscription plans...\n');

    // Ensure database tables exist
    await ensureTablesExist();
    console.log('✅ Database tables verified');

    // Check existing plans
    const existingPlans = await db.query('SELECT plan_name FROM subscription_plans');
    const existingPlanNames = existingPlans.rows.map(p => p.plan_name);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const plan of SUBSCRIPTION_PLANS) {
      try {
        if (existingPlanNames.includes(plan.plan_name)) {
          // Update existing plan
          await db.query(`
            UPDATE subscription_plans 
            SET display_name = $1, price = $2, currency = $3, 
                certificate_limit = $4, features = $5, updated_at = CURRENT_TIMESTAMP
            WHERE plan_name = $6
          `, [
            plan.display_name,
            plan.price,
            plan.currency,
            plan.certificate_limit,
            JSON.stringify(plan.features),
            plan.plan_name
          ]);
          
          console.log(`🔄 Updated plan: ${plan.plan_name}`);
          updated++;
        } else {
          // Create new plan
          await db.query(`
            INSERT INTO subscription_plans 
            (plan_name, display_name, price, currency, certificate_limit, features, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, true)
          `, [
            plan.plan_name,
            plan.display_name,
            plan.price,
            plan.currency,
            plan.certificate_limit,
            JSON.stringify(plan.features)
          ]);
          
          console.log(`✅ Created plan: ${plan.plan_name}`);
          created++;
        }
      } catch (planError) {
        console.error(`❌ Error with plan ${plan.plan_name}:`, planError.message);
        skipped++;
      }
    }

    console.log(`\n📊 Setup Summary:`);
    console.log(`   Created: ${created} plans`);
    console.log(`   Updated: ${updated} plans`);
    console.log(`   Skipped: ${skipped} plans`);

    // Show all plans
    const allPlans = await db.query(`
      SELECT plan_name, display_name, price, currency, certificate_limit, is_active
      FROM subscription_plans 
      ORDER BY price ASC
    `);

    console.log(`\n💳 Current Subscription Plans:`);
    allPlans.rows.forEach(plan => {
      const status = plan.is_active ? '🟢' : '🔴';
      console.log(`   ${status} ${plan.display_name}: $${plan.price}/${plan.currency} - ${plan.certificate_limit} certs/month`);
    });

    console.log('\n✅ Subscription plans setup complete!');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    process.exit(0);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupSubscriptionPlans();
}

module.exports = { setupSubscriptionPlans, SUBSCRIPTION_PLANS };