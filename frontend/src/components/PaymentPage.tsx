/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, CheckCircle, CreditCard, Lock, ArrowLeft, Crown, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PricingPlan {
  id: number;
  plan_name: string;
  display_name: string;
  price: string;
  currency: string;
  certificate_limit: number;
  features: string[];
}

interface CurrentSubscription {
  tier: string;
  expires: string | null;
  certificatesUsed: number;
  certificatesLimit: number;
  certificatesRemaining: number;
}

const PaymentPage: React.FC = () => {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState<CurrentSubscription | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const fetchPlans = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await fetch(`${API_URL}/subscription/plans`);
      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans.filter((plan: PricingPlan) => plan.plan_name !== 'free'));
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('authToken');
      
      if (!token) return;

      const response = await fetch(`${API_URL}/subscription/can-generate`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Also fetch subscription tier info
        const userResponse = await fetch(`${API_URL}/user/subscription`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          setCurrentSubscription({
            tier: userData.subscription.tier,
            expires: userData.subscription.expires,
            certificatesUsed: data.currentUsage || 0,
            certificatesLimit: data.limit || 0,
            certificatesRemaining: data.remaining || 0
          });
        } else {
          // Fallback - estimate tier from certificate limit
          let estimatedTier = 'free';
          const limit = data.limit || 0;
          if (limit >= 200) estimatedTier = 'schools';
          else if (limit >= 100) estimatedTier = 'enterprise';
          else if (limit >= 30) estimatedTier = 'premium';
          else if (limit >= 10) estimatedTier = 'professional';
          
          setCurrentSubscription({
            tier: estimatedTier,
            expires: null,
            certificatesUsed: data.currentUsage || 0,
            certificatesLimit: data.limit || 0,
            certificatesRemaining: data.remaining || 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching current subscription:', error);
    }
  };

  const handleUpgrade = async (plan: PricingPlan) => {
    setSelectedPlan(plan);

    // Handle Enterprise API plan differently
    if (plan.plan_name === 'enterprise_api') {
      // Open email client for contact sales
      window.location.href = 'mailto:sales@gdprcertification.com?subject=Enterprise API Plan Inquiry&body=Hello, I am interested in the Enterprise API plan. Please contact me to discuss pricing and features.';
      setSelectedPlan(null);
      return;
    }

    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      
      // Get authentication token
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        alert('Please log in to upgrade your subscription.');
        window.location.href = '/app';
        return;
      }

      const response = await fetch(`${API_URL}/payments/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          tier: plan.plan_name,
          duration: 1
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }

    } catch (error) {
      console.error('Payment error:', error);
      alert(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-3 mb-6"
          >
            <Shield className="h-8 w-8 text-green-400" />
            <h1 className="text-3xl font-bold text-white">{t('payment.title')}</h1>
          </motion.div>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            {t('payment.description')}
          </p>
        </div>

        {/* Current Plan Display */}
        {currentSubscription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-6 mb-8 max-w-md mx-auto"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Crown className="h-6 w-6 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">{t('payment.currentPlan')}</h3>
            </div>
            <div className="space-y-2">
              <p className="text-blue-300 font-medium capitalize">
                {currentSubscription.tier === 'enterprise_api' ? 'Enterprise API' : currentSubscription.tier} Plan
              </p>
              <p className="text-gray-300 text-sm">
                {currentSubscription.certificatesRemaining} of {currentSubscription.certificatesLimit} certificates remaining
              </p>
              {currentSubscription.expires && (
                <p className="text-gray-400 text-sm">
                  Expires: {new Date(currentSubscription.expires).toLocaleDateString()}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* Pricing Plans */}
        {loading ? (
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white mt-4">Loading plans...</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {plans.map((plan) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * plan.id }}
                className={`bg-white/5 border rounded-2xl p-8 ${
                  plan.plan_name === 'professional' 
                    ? 'border-green-400/50 ring-2 ring-green-400/20' 
                    : 'border-white/10'
                }`}
              >
                {plan.plan_name === 'professional' && (
                  <div className="bg-green-500/20 text-green-300 text-sm font-medium px-3 py-1 rounded-full inline-block mb-4">
                    {t('payment.mostPopular')}
                  </div>
                )}
                
                <h3 className="text-2xl font-bold text-white mb-2">{plan.display_name}</h3>
                <div className="text-3xl font-bold text-white mb-1">
                  {plan.plan_name === 'enterprise_api' ? (
                    <>
                      <span className="text-2xl">{t('payment.contactSales')}</span>
                    </>
                  ) : plan.price === '0' || plan.price === '0.00' ? (
                    <>
                      <span className="text-2xl">{t('payment.contactSales')}</span>
                    </>
                  ) : (
                    <>
                      {plan.currency}{plan.price}
                      <span className="text-lg text-gray-400">{t('payment.perMonth')}</span>
                    </>
                  )}
                </div>
                <p className="text-gray-400 mb-6">
                  {plan.plan_name === 'enterprise_api' 
                    ? t('payment.unlimitedCertificates')
                    : t('payment.certificatesPerMonth', { count: plan.certificate_limit })
                  }
                </p>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handleUpgrade(plan)}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                    plan.plan_name === 'professional'
                      ? 'bg-green-500 hover:bg-green-600 text-white transform hover:scale-105'
                      : plan.plan_name === 'enterprise_api'
                      ? 'bg-purple-500 hover:bg-purple-600 text-white border border-purple-400'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {plan.plan_name === 'enterprise_api' ? (
                      <>
                        <Mail className="h-5 w-5" />
                        <span>Contact Sales</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        <span>Choose {plan.display_name}</span>
                      </>
                    )}
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Security Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center space-x-2 bg-green-500/10 border border-green-400/30 rounded-full px-6 py-3">
            <Lock className="h-5 w-5 text-green-400" />
            <span className="text-green-300 font-medium">Secure Payment Processing</span>
          </div>
          <p className="text-gray-400 text-sm mt-4">
            All payments are processed securely. We don't store your payment information.
          </p>
        </motion.div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => window.close()}
            className="inline-flex items-center space-x-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Certificate Generator</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
