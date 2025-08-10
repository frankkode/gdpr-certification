import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Linkedin, Mail, AlertTriangle, CheckCircle } from 'lucide-react';

interface SocialLoginProps {
  apiUrl: string;
  onSuccess: (token: string, user: any) => void;
  onError: (error: string) => void;
  mode?: 'login' | 'register';
}

interface SocialProvider {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
}

const SocialLogin: React.FC<SocialLoginProps> = ({ 
  apiUrl, 
  onSuccess, 
  onError, 
  mode = 'login' 
}) => {
  const [loading, setLoading] = useState<string | null>(null);

  const providers: SocialProvider[] = [
    {
      id: 'google',
      name: 'Google',
      icon: Mail,
      color: 'text-red-400',
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-400/30'
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20',
      borderColor: 'border-gray-400/30'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      borderColor: 'border-blue-400/30'
    }
  ];

  const initiateSocialAuth = async (providerId: string) => {
    setLoading(providerId);
    
    try {
      // Create a popup window for OAuth
      const popup = window.open(
        `${apiUrl}/auth/social/${providerId}?mode=${mode}`,
        'socialAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Listen for messages from the popup
      const handleMessage = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        const { type, data } = event.data;

        if (type === 'SOCIAL_AUTH_SUCCESS') {
          popup.close();
          onSuccess(data.token, data.user);
          window.removeEventListener('message', handleMessage);
        } else if (type === 'SOCIAL_AUTH_ERROR') {
          popup.close();
          onError(data.error || event.data.error || 'Social authentication failed');
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

      // Check if popup is closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          setLoading(null);
        }
      }, 1000);

    } catch (error) {
      onError(error instanceof Error ? error.message : 'Social authentication failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-center">
        <span className="text-sm text-gray-400">
          {mode === 'login' ? 'Or sign in with' : 'Or sign up with'}
        </span>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        {providers.map((provider) => (
          <motion.button
            key={provider.id}
            onClick={() => initiateSocialAuth(provider.id)}
            disabled={loading === provider.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              flex items-center justify-center space-x-3 w-full px-4 py-3 
              ${provider.bgColor} ${provider.borderColor} border rounded-lg 
              ${provider.color} font-medium transition-all
              hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <provider.icon className="h-5 w-5" />
            <span>
              {loading === provider.id ? 'Connecting...' : `${mode === 'login' ? 'Sign in' : 'Sign up'} with ${provider.name}`}
            </span>
            {loading === provider.id && (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
          </motion.button>
        ))}
      </div>

      <div className="text-xs text-gray-500 text-center mt-4">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </div>
    </div>
  );
};

export default SocialLogin;