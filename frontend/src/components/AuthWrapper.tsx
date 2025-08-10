import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Shield, UserCheck } from 'lucide-react';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import LanguageSwitcher from './LanguageSwitcher';
import { useAuth } from '../contexts/AuthContext';

interface AuthWrapperProps {
  children: React.ReactNode;
  apiUrl: string;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children, apiUrl }) => {
  const { isAuthenticated, isLoading, login, user } = useAuth();
  const { t } = useTranslation();
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot-password' | 'reset-password'>('login');
  const [resetToken, setResetToken] = useState<string | null>(null);

  // Check for reset token in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    if (token) {
      setResetToken(token);
      setAuthMode('reset-password');
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-white text-lg">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Show authenticated content if user is logged in
  if (isAuthenticated && user) {
    return (
      <div>
        {/* User info bar */}
        <div className="bg-green-500/10 border-b border-green-400/20 px-4 py-2">
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <UserCheck className="h-5 w-5 text-green-400" />
              <span className="text-green-300 text-sm">
                {t('auth.profile.welcome', { firstName: user.firstName, lastName: user.lastName })}
              </span>
              <span className="text-green-400 text-xs px-2 py-1 bg-green-500/20 rounded-full">
                {user.role}
              </span>
            </div>
            <div className="text-xs text-green-200">
              {t('header.badges.gdprCompliant')} • {t('gdpr.terms.dataProtection')}
            </div>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // Show authentication forms if not authenticated
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl animate-bounce"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col justify-center py-12 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-blue-500/20 rounded-full border border-blue-400/30">
              <Shield className="h-12 w-12 text-blue-400" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            {t('header.title')}
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            {t('header.subtitle')}
          </p>
        </div>

        {/* Language Switcher */}
        <div className="flex justify-center mb-8">
          <LanguageSwitcher />
        </div>

        {/* Authentication Forms */}
        <div className="flex justify-center">
          <AnimatePresence mode="wait">
            {authMode === 'login' && (
              <Login
                key="login"
                onLogin={login}
                onSwitchToRegister={() => setAuthMode('register')}
                onForgotPassword={() => setAuthMode('forgot-password')}
                apiUrl={apiUrl}
              />
            )}
            
            {authMode === 'register' && (
              <Register
                key="register"
                onRegister={login}
                onSwitchToLogin={() => setAuthMode('login')}
                apiUrl={apiUrl}
              />
            )}
            
            {authMode === 'forgot-password' && (
              <ForgotPassword
                key="forgot-password"
                onBack={() => setAuthMode('login')}
                apiUrl={apiUrl}
              />
            )}
            
            {authMode === 'reset-password' && resetToken && (
              <ResetPassword
                key="reset-password"
                token={resetToken}
                onSuccess={() => {
                  setAuthMode('login');
                  setResetToken(null);
                }}
                onBack={() => {
                  setAuthMode('login');
                  setResetToken(null);
                }}
                apiUrl={apiUrl}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Features List */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl"
            >
              <div className="flex justify-center mb-4">
                <Shield className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">GDPR Compliant</h3>
              <p className="text-gray-400 text-sm">
                Full compliance with EU data protection regulations. Your privacy is our priority.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl"
            >
              <div className="flex justify-center mb-4">
                <div className="w-8 h-8 border-2 border-blue-400 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Secure Authentication</h3>
              <p className="text-gray-400 text-sm">
                JWT-based authentication with secure password hashing and session management.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-center p-6 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl"
            >
              <div className="flex justify-center mb-4">
                <div className="w-8 h-8 bg-purple-500/20 border border-purple-400/30 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-purple-400 rounded"></div>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Cryptographic Security</h3>
              <p className="text-gray-400 text-sm">
                SHA-512 hashing and digital signatures ensure certificate integrity and authenticity.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            Protected by industry-standard encryption • GDPR Article 25 Compliant • Privacy by Design
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthWrapper;