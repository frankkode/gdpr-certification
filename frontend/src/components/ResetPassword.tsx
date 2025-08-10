import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  AlertCircle,
  Save,
  ArrowLeft
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ResetPasswordProps {
  token: string;
  onSuccess: () => void;
  onBack: () => void;
  apiUrl: string;
}

interface PasswordData {
  newPassword: string;
  confirmPassword: string;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ token, onSuccess, onBack, apiUrl }) => {
  const { t } = useTranslation();
  const [passwordData, setPasswordData] = useState<PasswordData>({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [passwordStrength, setPasswordStrength] = useState({
    hasLower: false,
    hasUpper: false,
    hasNumber: false,
    hasSpecial: false,
    hasLength: false
  });
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  useEffect(() => {
    // Verify token on component mount
    verifyToken();
  }, [token]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const verifyToken = async () => {
    try {
      // We'll verify the token when attempting to reset
      // For now, just assume it's valid until proven otherwise
      setTokenValid(true);
    } catch (error) {
      setTokenValid(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));

    if (name === 'newPassword') {
      setPasswordStrength({
        hasLower: /[a-z]/.test(value),
        hasUpper: /[A-Z]/.test(value),
        hasNumber: /\d/.test(value),
        hasSpecial: /[@$!%*?&]/.test(value),
        hasLength: value.length >= 8
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: t('auth.register.validation.passwordsMatch') });
      return;
    }

    if (!Object.values(passwordStrength).every(Boolean)) {
      setMessage({ type: 'error', text: t('auth.validation.passwordWeak') });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${apiUrl}/auth/reset-password-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: data.message });
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        if (data.code === 'INVALID_RESET_TOKEN') {
          setTokenValid(false);
        }
        setMessage({ type: 'error', text: data.error || t('auth.errors.invalidToken') });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      setMessage({ type: 'error', text: t('auth.errors.networkError') });
    } finally {
      setIsLoading(false);
    }
  };

  const isPasswordStrong = Object.values(passwordStrength).every(Boolean);
  const isFormValid = 
    passwordData.newPassword &&
    passwordData.confirmPassword &&
    isPasswordStrong &&
    passwordData.newPassword === passwordData.confirmPassword;

  // Show loading state while verifying token
  if (tokenValid === null) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-md mx-auto bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl p-6"
      >
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">{t('auth.resetPassword.invalidToken')}</p>
        </div>
      </motion.div>
    );
  }

  // Show error if token is invalid
  if (tokenValid === false) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl p-6"
      >
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-red-500/20 rounded-full border border-red-400/30">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">{t('auth.resetPassword.invalidToken')}</h2>
          <p className="text-gray-300 mb-6">
            {t('auth.resetPassword.tokenExpired')}
          </p>
          <button
            onClick={onBack}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>{t('auth.resetPassword.backToLogin')}</span>
          </button>
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
          <div className="p-3 bg-green-500/20 rounded-full border border-green-400/30">
            <Lock className="h-6 w-6 text-green-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('auth.resetPassword.title')}</h2>
        <p className="text-gray-400">{t('auth.resetPassword.subtitle')}</p>
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
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('auth.resetPassword.newPassword')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showPasswords.new ? 'text' : 'password'}
              name="newPassword"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              required
              className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-colors"
              placeholder={t('auth.resetPassword.newPasswordPlaceholder')}
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {passwordData.newPassword && (
            <div className="mt-2 space-y-1">
              <div className="flex space-x-1">
                {Object.entries(passwordStrength).map(([key, valid]) => (
                  <div
                    key={key}
                    className={`h-1 flex-1 rounded ${valid ? 'bg-green-500' : 'bg-gray-600'}`}
                  />
                ))}
              </div>
              <div className="text-xs space-y-1">
                <div className="grid grid-cols-2 gap-x-4">
                  <div className={`flex items-center space-x-2 ${passwordStrength.hasLength ? 'text-green-400' : 'text-gray-400'}`}>
                    <CheckCircle className="h-3 w-3" />
                    <span>{t('auth.register.passwordStrength.length')}</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${passwordStrength.hasUpper ? 'text-green-400' : 'text-gray-400'}`}>
                    <CheckCircle className="h-3 w-3" />
                    <span>{t('auth.register.passwordStrength.uppercase')}</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${passwordStrength.hasLower ? 'text-green-400' : 'text-gray-400'}`}>
                    <CheckCircle className="h-3 w-3" />
                    <span>{t('auth.register.passwordStrength.lowercase')}</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${passwordStrength.hasNumber ? 'text-green-400' : 'text-gray-400'}`}>
                    <CheckCircle className="h-3 w-3" />
                    <span>{t('auth.register.passwordStrength.number')}</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${passwordStrength.hasSpecial ? 'text-green-400' : 'text-gray-400'}`}>
                    <CheckCircle className="h-3 w-3" />
                    <span>{t('auth.register.passwordStrength.special')}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('auth.resetPassword.confirmPassword')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
              className={`w-full pl-10 pr-12 py-3 bg-slate-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                  ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50'
                  : 'border-slate-600/50 focus:ring-green-500/50 focus:border-green-500/50'
              }`}
              placeholder={t('auth.resetPassword.confirmPasswordPlaceholder')}
            />
            <button
              type="button"
              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
            <p className="mt-1 text-red-400 text-xs">{t('auth.register.validation.passwordsMatch')}</p>
          )}
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={!isFormValid || isLoading}
          whileHover={{ scale: isFormValid && !isLoading ? 1.02 : 1 }}
          whileTap={{ scale: isFormValid && !isLoading ? 0.98 : 1 }}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            isFormValid && !isLoading
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{t('auth.resetPassword.resettingPassword')}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Save className="h-5 w-5" />
              <span>{t('auth.resetPassword.resetPassword')}</span>
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
          <span>{t('auth.resetPassword.backToLogin')}</span>
        </button>
      </div>

      {/* Security Notice */}
      <div className="mt-6 p-3 bg-green-500/10 border border-green-400/20 rounded-lg">
        <p className="text-green-300 text-xs text-center">
          {t('auth.resetPassword.securityNotice')}
        </p>
      </div>
    </motion.div>
  );
};

export default ResetPassword;