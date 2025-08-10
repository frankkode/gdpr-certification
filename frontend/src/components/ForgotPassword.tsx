import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ForgotPasswordProps {
  onBack: () => void;
  apiUrl: string;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, apiUrl }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: t('auth.forgotPassword.emailSent', { email })
        });
        setIsSubmitted(true);
      } else {
        setMessage({ type: 'error', text: data.error || t('auth.errors.networkError') });
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setMessage({ type: 'error', text: t('auth.errors.networkError') });
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl p-6"
      >
        {/* Success State */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-500/20 rounded-full border border-green-400/30">
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">{t('auth.forgotPassword.checkEmail')}</h2>
          <p className="text-gray-300 mb-6 leading-relaxed">
            {t('auth.forgotPassword.emailSent', { email: <strong className="text-white">{email}</strong> })}
          </p>
          <div className="space-y-4">
            <div className="p-4 bg-blue-500/10 border border-blue-400/20 rounded-lg">
              <p className="text-blue-300 text-sm">
                {t('auth.forgotPassword.didntReceive')}
              </p>
            </div>
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>{t('auth.forgotPassword.backToLogin')}</span>
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-md mx-auto bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl p-6"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-orange-500/20 rounded-full border border-orange-400/30">
            <Mail className="h-6 w-6 text-orange-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('auth.forgotPassword.title')}</h2>
        <p className="text-gray-400">{t('auth.forgotPassword.subtitle')}</p>
      </div>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`mb-4 p-3 border rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-500/20 border-green-400/30' 
              : 'bg-red-500/20 border-red-400/30'
          }`}
        >
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-400" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-400" />
            )}
            <p className={`text-sm ${message.type === 'success' ? 'text-green-300' : 'text-red-300'}`}>
              {message.text}
            </p>
          </div>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('auth.forgotPassword.email')}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors"
              placeholder={t('auth.forgotPassword.emailPlaceholder')}
            />
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={!isValidEmail || isLoading}
          whileHover={{ scale: isValidEmail && !isLoading ? 1.02 : 1 }}
          whileTap={{ scale: isValidEmail && !isLoading ? 0.98 : 1 }}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            isValidEmail && !isLoading
              ? 'bg-orange-600 hover:bg-orange-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{t('auth.forgotPassword.sending')}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Send className="h-5 w-5" />
              <span>{t('auth.forgotPassword.sendLink')}</span>
            </div>
          )}
        </motion.button>
      </form>

      {/* Back to Login */}
      <div className="mt-6 text-center">
        <button
          onClick={onBack}
          className="flex items-center justify-center space-x-2 text-blue-400 hover:text-blue-300 font-medium transition-colors mx-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t('auth.forgotPassword.backToLogin')}</span>
        </button>
      </div>

      {/* Security Notice */}
      <div className="mt-6 p-3 bg-slate-700/30 border border-slate-600/30 rounded-lg">
        <p className="text-gray-300 text-xs text-center">
          {t('auth.forgotPassword.securityNotice')}
        </p>
      </div>
    </motion.div>
  );
};

export default ForgotPassword;