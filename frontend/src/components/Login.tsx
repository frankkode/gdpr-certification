import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SocialLogin from './SocialLogin';

interface LoginProps {
  onLogin: (token: string, user: any) => void;
  onSwitchToRegister: () => void;
  onForgotPassword?: () => void;
  apiUrl: string;
}

interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, onSwitchToRegister, onForgotPassword, apiUrl }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token in localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        onLogin(data.token, data.user);
      } else {
        setError(data.error || t('auth.errors.invalidCredentials'));
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(t('auth.errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.email && formData.password;

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
          <div className="p-3 bg-blue-500/20 rounded-full border border-blue-400/30">
            <LogIn className="h-6 w-6 text-blue-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('auth.login.title')}</h2>
        <p className="text-gray-400">{t('auth.login.subtitle')}</p>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg"
        >
          <p className="text-red-300 text-sm">{error}</p>
        </motion.div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('auth.login.email')}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
              placeholder={t('auth.login.emailPlaceholder')}
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('auth.login.password')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
              placeholder={t('auth.login.passwordPlaceholder')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          type="submit"
          disabled={!isFormValid || isLoading}
          whileHover={{ scale: isFormValid && !isLoading ? 1.02 : 1 }}
          whileTap={{ scale: isFormValid && !isLoading ? 0.98 : 1 }}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
            isFormValid && !isLoading
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{t('auth.login.signingIn')}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <LogIn className="h-5 w-5" />
              <span>{t('auth.login.signIn')}</span>
            </div>
          )}
        </motion.button>
      </form>

      {/* Social Login */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-slate-800 text-gray-400">{t('common.or', 'or')}</span>
          </div>
        </div>
        <div className="mt-6">
          <SocialLogin
            apiUrl={apiUrl}
            onSuccess={onLogin}
            onError={setError}
            mode="login"
          />
        </div>
      </div>

      {/* Forgot Password Link */}
      {onForgotPassword && (
        <div className="mt-4 text-center">
          <button
            onClick={onForgotPassword}
            className="text-orange-400 hover:text-orange-300 text-sm font-medium transition-colors"
          >
            {t('auth.login.forgotPassword')}
          </button>
        </div>
      )}

      {/* Register Link */}
      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          {t('auth.login.noAccount')}{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            {t('auth.login.createAccount')}
          </button>
        </p>
      </div>

      {/* GDPR Notice */}
      <div className="mt-4 p-3 bg-green-500/10 border border-green-400/20 rounded-lg">
        <p className="text-green-300 text-xs text-center">
          {t('auth.login.gdprNotice')}
        </p>
      </div>
    </motion.div>
  );
};

export default Login;