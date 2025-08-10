import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, Eye, EyeOff, UserPlus, User, Shield, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SocialLogin from './SocialLogin';

interface RegisterProps {
  onRegister: (token: string, user: any) => void;
  onSwitchToLogin: () => void;
  apiUrl: string;
}

interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  gdprConsent: boolean;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onSwitchToLogin, apiUrl }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gdprConsent: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({
    hasLower: false,
    hasUpper: false,
    hasNumber: false,
    hasSpecial: false,
    hasLength: false
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Check password strength
    if (name === 'password') {
      setPasswordStrength({
        hasLower: /[a-z]/.test(value),
        hasUpper: /[A-Z]/.test(value),
        hasNumber: /\d/.test(value),
        hasSpecial: /[@$!%*?&]/.test(value),
        hasLength: value.length >= 8
      });
    }

    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.register.validation.passwordsMatch'));
      setIsLoading(false);
      return;
    }

    // Validate GDPR consent
    if (!formData.gdprConsent) {
      setError(t('auth.register.validation.gdprRequired'));
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          gdprConsent: formData.gdprConsent
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store token in localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        onRegister(data.token, data.user);
      } else {
        // Handle validation errors with detailed messages
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map(detail => detail.msg).join('. ');
          setError(errorMessages);
        } else {
          setError(data.error || t('auth.errors.userExists'));
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(t('auth.errors.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const isPasswordStrong = Object.values(passwordStrength).every(Boolean);
  const isFormValid = 
    formData.firstName &&
    formData.lastName &&
    formData.email &&
    formData.password &&
    formData.confirmPassword &&
    formData.gdprConsent &&
    isPasswordStrong &&
    formData.password === formData.confirmPassword;

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
            <UserPlus className="h-6 w-6 text-green-400" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{t('auth.register.title')}</h2>
        <p className="text-gray-400">{t('auth.register.subtitle')}</p>
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

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('auth.register.firstName')}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-colors"
                placeholder={t('auth.register.firstNamePlaceholder')}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('auth.register.lastName')}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-colors"
                placeholder={t('auth.register.lastNamePlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('auth.register.email')}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-colors"
              placeholder={t('auth.register.emailPlaceholder')}
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('auth.register.password')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-colors"
              placeholder={t('auth.register.passwordPlaceholder')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          
          {/* Password Strength Indicator */}
          {formData.password && (
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
                <div className={`flex items-center space-x-2 ${passwordStrength.hasLength ? 'text-green-400' : 'text-gray-400'}`}>
                  <CheckCircle className="h-3 w-3" />
                  <span>{t('auth.register.passwordStrength.length')}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4">
                  <div className={`flex items-center space-x-2 ${passwordStrength.hasLower ? 'text-green-400' : 'text-gray-400'}`}>
                    <CheckCircle className="h-3 w-3" />
                    <span>{t('auth.register.passwordStrength.lowercase')}</span>
                  </div>
                  <div className={`flex items-center space-x-2 ${passwordStrength.hasUpper ? 'text-green-400' : 'text-gray-400'}`}>
                    <CheckCircle className="h-3 w-3" />
                    <span>{t('auth.register.passwordStrength.uppercase')}</span>
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

        {/* Confirm Password Field */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {t('auth.register.confirmPassword')}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={`w-full pl-10 pr-12 py-3 bg-slate-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                formData.confirmPassword && formData.password !== formData.confirmPassword
                  ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50'
                  : 'border-slate-600/50 focus:ring-green-500/50 focus:border-green-500/50'
              }`}
              placeholder={t('auth.register.confirmPasswordPlaceholder')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <p className="mt-1 text-red-400 text-xs">{t('auth.register.validation.passwordsMatch')}</p>
          )}
        </div>

        {/* GDPR Consent */}
        <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="gdprConsent"
              name="gdprConsent"
              checked={formData.gdprConsent}
              onChange={handleChange}
              className="mt-1 w-4 h-4 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500 focus:ring-2"
            />
            <div>
              <label htmlFor="gdprConsent" className="text-sm text-green-300 cursor-pointer">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">{t('auth.register.gdprConsent.title')}</span>
                </div>
                <p className="text-xs text-green-200 leading-relaxed">
                  {t('auth.register.gdprConsent.text')}
                </p>
              </label>
            </div>
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
              ? 'bg-green-600 hover:bg-green-700 text-white'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>{t('auth.register.creatingAccount')}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <UserPlus className="h-5 w-5" />
              <span>{t('auth.register.createAccount')}</span>
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
            onSuccess={onRegister}
            onError={setError}
            mode="register"
          />
        </div>
      </div>

      {/* Login Link */}
      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          {t('auth.register.hasAccount')}{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            {t('auth.register.signIn')}
          </button>
        </p>
      </div>
    </motion.div>
  );
};

export default Register;