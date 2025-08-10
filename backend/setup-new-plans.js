#!/usr/bin/env node

require('dotenv').config();
const { db } = require('./db');

// New subscription plans to add
const newPlans = [
  {
    plan_name: 'schools',
    display_name: 'Schools Plan',
    price: 99.00,
    currency: 'EUR',
    certificate_limit: 200,
    features: [
      'Bulk certificate generation',
      '200 certificates per month',
      'Custom templates',
      'School branding',
      'CSV import',
      'Email support',
      'Student management',
      'Class roster imports'
    ],
    is_active: true
  },
  {
    plan_name: 'enterprise_api',
    display_name: 'Enterprise API',
    price: 0.00,
    currency: 'USD',
    certificate_limit: -1, // Unlimited
    features: [
      'Unlimited certificates',
      'Full API access',
      'Custom integrations',
      'White-label solution',
      'Priority support',
      'Contact sales for pricing',
      'Custom SLA',
      'Dedicated account manager'
    ],
    is_active: true
  }
];

async function setupNewPlans() {
  try {
    console.log('🚀 Setting up new subscription plans...');
    
    // Test database connection
    await db.query('SELECT NOW()');
    console.log('✅ Database connection successful');
    
    for (const plan of newPlans) {
      try {
        // Check if plan already exists
        const existingPlan = await db.query(
          'SELECT id FROM subscription_plans WHERE plan_name = $1',
          [plan.plan_name]
        );
        
        if (existingPlan.rows.length > 0) {
          console.log(`⚠️  Plan '${plan.plan_name}' already exists, updating...`);
          
          // Update existing plan
          await db.query(`
            UPDATE subscription_plans 
            SET 
              display_name = $1,
              price = $2,
              currency = $3,
              certificate_limit = $4,
              features = $5,
              is_active = $6,
              updated_at = CURRENT_TIMESTAMP
            WHERE plan_name = $7
          `, [
            plan.display_name,
            plan.price,
            plan.currency,
            plan.certificate_limit,
            JSON.stringify(plan.features),
            plan.is_active,
            plan.plan_name
          ]);
          
          console.log(`✅ Updated plan: ${plan.display_name}`);
        } else {
          // Create new plan
          await db.query(`
            INSERT INTO subscription_plans 
            (plan_name, display_name, price, currency, certificate_limit, features, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            plan.plan_name,
            plan.display_name,
            plan.price,
            plan.currency,
            plan.certificate_limit,
            JSON.stringify(plan.features),
            plan.is_active
          ]);
          
          console.log(`✅ Created new plan: ${plan.display_name}`);
        }
      } catch (planError) {
        console.error(`❌ Error setting up plan ${plan.plan_name}:`, planError.message);
      }
    }
    
    // Display all plans
    console.log('\n📋 Current subscription plans:');
    const allPlans = await db.query(`
      SELECT plan_name, display_name, price, currency, certificate_limit, is_active
      FROM subscription_plans 
      ORDER BY price ASC
    `);
    
    allPlans.rows.forEach(plan => {
      const status = plan.is_active ? '🟢 Active' : '🔴 Inactive';
      const limit = plan.certificate_limit === -1 ? 'Unlimited' : plan.certificate_limit;
      console.log(`  ${status} ${plan.display_name} - ${plan.currency}${plan.price} (${limit} certs)`);
    });
    
    console.log('\n🎉 New subscription plans setup completed successfully!');
    console.log('\n📌 Next steps:');
    console.log('   1. Schools Plan: Perfect for educational institutions');
    console.log('   2. Enterprise API: For customers needing unlimited certificates and API access');
    console.log('   3. Test the admin dashboard to create/edit plans');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    throw error;
  }
}

// Run the setup
if (require.main === module) {
  setupNewPlans()
    .then(() => {
      console.log('\n✅ Setup script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Setup script failed:', error);
      process.exit(1);
    });
}

module.exports = { setupNewPlans };