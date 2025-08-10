import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const PaymentCancel: React.FC = () => {
  const handleRetryPayment = () => {
    window.location.href = '/payment';
  };

  const handleGoToDashboard = () => {
    window.location.href = '/app';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 p-4">
      <div className="container mx-auto max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          {/* Cancel Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="flex justify-center mb-8"
          >
            <div className="p-6 bg-orange-500/20 border border-orange-400/30 rounded-full">
              <XCircle className="h-16 w-16 text-orange-400" />
            </div>
          </motion.div>

          {/* Cancel Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-4">Payment Cancelled</h1>
            <p className="text-xl text-orange-200 mb-6">
              Your payment was cancelled. No charges were made to your account.
            </p>
          </motion.div>

          {/* Information Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8"
          >
            <h3 className="text-lg font-semibold text-white mb-4">What happened?</h3>
            <div className="text-left text-gray-300 space-y-2">
              <p>• You cancelled the payment process</p>
              <p>• No money was charged to your payment method</p>
              <p>• Your subscription remains unchanged</p>
              <p>• You can try again anytime</p>
            </div>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button
              onClick={handleRetryPayment}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Try Again</span>
            </button>
            
            <button
              onClick={handleGoToDashboard}
              className="border border-white/20 text-white px-8 py-3 rounded-lg font-medium hover:bg-white/5 transition-colors flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
          </motion.div>

          {/* Support Information */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 text-center"
          >
            <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-6">
              <h4 className="text-blue-300 font-semibold mb-2">Need Help?</h4>
              <p className="text-blue-200 text-sm mb-4">
                If you're experiencing issues with payment, our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <span className="text-blue-300 text-sm">📧 support@certifysecure.com</span>
                <span className="text-blue-300 text-sm">📞 +1 (555) 123-4567</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentCancel;