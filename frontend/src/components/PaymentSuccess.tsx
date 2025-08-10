import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const PaymentSuccess: React.FC = () => {
  const { refreshAuth } = useAuth();
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');

        if (!sessionId) {
          throw new Error('No session ID found in URL');
        }

        const API_URL = import.meta.env.VITE_API_URL || '/api';
        const token = localStorage.getItem('authToken');

        if (!token) {
          throw new Error('Authentication required');
        }

        const response = await fetch(`${API_URL}/payments/verify-session/${sessionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setSessionData(data);
          
          // If subscription was updated on backend, update local user data immediately
          if (data.subscriptionUpdated && data.updatedUser) {
            console.log('🔄 PaymentSuccess: Subscription updated via backend fallback, updating local user data...');
            // Update the user data in localStorage and context immediately
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const updatedUserData = {
              ...currentUser,
              subscriptionTier: data.updatedUser.subscription_tier,
              subscriptionExpires: data.updatedUser.subscription_expires,
              certificateLimitPerMonth: data.updatedUser.certificate_limit_per_month
            };
            localStorage.setItem('user', JSON.stringify(updatedUserData));
            console.log('✅ PaymentSuccess: Local user data updated with new subscription');
          }
          
          // Refresh authentication to get updated subscription status with retry
          // Add a small delay to ensure database updates are complete
          const refreshDelay = data.subscriptionUpdated ? 1000 : 0; // 1 second delay if subscription was updated
          
          setTimeout(async () => {
            let retryCount = 0;
            const maxRetries = 3;
            
            const refreshWithRetry = async () => {
              try {
                console.log('🔄 PaymentSuccess: Calling refreshAuth()...');
                await refreshAuth();
                console.log('✅ PaymentSuccess: refreshAuth() completed successfully');
                // Start auto redirect after successful auth refresh
                handleAutoRedirect();
              } catch (error) {
                retryCount++;
                console.error(`❌ PaymentSuccess: refreshAuth() failed (attempt ${retryCount}):`, error);
                if (retryCount < maxRetries) {
                  console.log(`🔄 Retrying auth refresh (${retryCount}/${maxRetries})...`);
                  setTimeout(refreshWithRetry, 2000); // Retry after 2 seconds
                } else {
                  console.error('❌ Max retries reached for auth refresh');
                  // Still start auto redirect even if auth refresh failed
                  handleAutoRedirect();
                }
              }
            };
            
            await refreshWithRetry();
          }, refreshDelay);
        } else {
          throw new Error(data.error || 'Failed to verify payment');
        }

      } catch (error) {
        console.error('Payment verification error:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, []);

  const handleGoToCertificateGenerator = () => {
    // Redirect to certificate generator tab with payment indicator
    window.location.href = '/app?tab=generate&from_payment=true';
  };

  const handleAutoRedirect = () => {
    setRedirecting(true);
    
    // Start countdown
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          handleGoToCertificateGenerator();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-green-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-6">
            <h2 className="text-xl font-bold text-red-300 mb-4">Payment Verification Failed</h2>
            <p className="text-red-200 mb-6">{error}</p>
            <button
              onClick={() => window.location.href = '/payment'}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex justify-center mb-8"
          >
            <div className="p-6 bg-green-500/20 border border-green-400/30 rounded-full">
              <CheckCircle className="h-16 w-16 text-green-400" />
            </div>
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-4">Payment Successful!</h1>
            <p className="text-xl text-green-200 mb-6">
              Thank you for upgrading your subscription. Your account has been updated.
            </p>
          </motion.div>

          {/* Payment Details */}
          {sessionData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Payment Details</h3>
              <div className="space-y-3 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-300">Amount:</span>
                  <span className="text-white font-medium">
                    {(sessionData.session.amount_total / 100).toFixed(2)} {sessionData.session.currency.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Plan:</span>
                  <span className="text-white font-medium">
                    {sessionData.transaction?.description || 'Subscription Upgrade'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Status:</span>
                  <span className="text-green-400 font-medium">Completed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Transaction ID:</span>
                  <span className="text-white font-mono text-sm">
                    {sessionData.session.id}
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={handleGoToCertificateGenerator}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 disabled:bg-green-600/50 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <ArrowLeft className="h-5 w-5" />
              )}
              <span>{loading ? 'Updating Subscription...' : 'Start Creating Certificates'}</span>
            </button>
            
            <button
              onClick={() => window.location.href = '/app?tab=profile'}
              className="border border-white/20 text-white px-8 py-3 rounded-lg font-medium hover:bg-white/5 transition-colors flex items-center justify-center space-x-2"
            >
              <Download className="h-5 w-5" />
              <span>View Receipt</span>
            </button>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 text-center"
          >
            <p className="text-gray-400 text-sm">
              You can now generate more certificates and access premium features.
              <br />
              {redirecting ? (
                <span className="text-green-300 font-medium">
                  Redirecting to certificate generator in {countdown} seconds...
                </span>
              ) : (
                'Click the button above to start creating certificates.'
              )}
              <br />
              Need help? Contact our support team.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccess;