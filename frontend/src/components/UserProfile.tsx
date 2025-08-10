import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Calendar, 
  Shield, 
  Key, 
  Edit3, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  Lock,
  CheckCircle,
  AlertCircle,
  Settings,
  Award,
  Download,
  FileText,
  Search,
  Filter,
  Crown,
  Star,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import TwoFactorManagement from './TwoFactorManagement';

interface UserProfileProps {
  user: any;
  token: string;
  apiUrl: string;
  onUserUpdate: (updatedUser: any) => void;
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
}

interface PasswordResetData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, token, apiUrl, onUserUpdate }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'certificates' | 'subscription'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Certificate history state
  const [certificates, setCertificates] = useState<any[]>([]);
  const [certificatesLoading, setCertificatesLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'course'>('date');

  // Subscription state
  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    tier: string;
    expires: string;
    templatesUsed: number;
    templatesLimit: number;
    certificatesUsed: number;
    certificatesLimit: number;
    certificatesRemaining: number;
    features: string[];
  } | null>(null);
  
  const [profileData, setProfileData] = useState<ProfileFormData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || ''
  });

  const [passwordData, setPasswordData] = useState<PasswordResetData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [passwordStrength, setPasswordStrength] = useState({
    hasLower: false,
    hasUpper: false,
    hasNumber: false,
    hasSpecial: false,
    hasLength: false
  });

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (activeTab === 'certificates') {
      fetchCertificates();
    } else if (activeTab === 'subscription') {
      fetchSubscriptionInfo();
    }
  }, [activeTab]);

  const fetchCertificates = async () => {
    setCertificatesLoading(true);
    try {
      const response = await fetch(`${apiUrl}/auth/certificates`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCertificates(data.certificates || []);
      } else {
        setMessage({ type: 'error', text: 'Failed to load certificates' });
      }
    } catch (error) {
      console.error('Error fetching certificates:', error);
      setMessage({ type: 'error', text: 'Network error while loading certificates' });
    } finally {
      setCertificatesLoading(false);
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
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

  const handleProfileSave = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${apiUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
        onUserUpdate(data.user);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (!Object.values(passwordStrength).every(Boolean)) {
      setMessage({ type: 'error', text: 'Password does not meet strength requirements' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setIsChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch subscription information
  const fetchSubscriptionInfo = async () => {
    if (!token) {
      console.log('No token available for subscription fetch');
      return;
    }
    
    try {
      // Use the same endpoint as CertificateGenerator for consistency
      const [subscriptionResponse, canGenerateResponse] = await Promise.all([
        fetch(`${apiUrl}/user/subscription`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`${apiUrl}/subscription/can-generate`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      ]);

      if (subscriptionResponse.ok && canGenerateResponse.ok) {
        const [subscriptionData, canGenerateData] = await Promise.all([
          subscriptionResponse.json(),
          canGenerateResponse.json()
        ]);
        
        console.log('Subscription data:', subscriptionData);
        console.log('Can generate data:', canGenerateData);
        console.log('Templates used from subscription endpoint:', subscriptionData.subscription.templatesUsed);
        console.log('Templates limit from subscription endpoint:', subscriptionData.subscription.templatesLimit);
        
        // Combine data from both endpoints for accurate display
        setSubscriptionInfo({
          tier: subscriptionData.subscription.tier,
          expires: subscriptionData.subscription.expires,
          templatesUsed: subscriptionData.subscription.templatesUsed,
          templatesLimit: subscriptionData.subscription.templatesLimit,
          // Use actual usage data from can-generate endpoint
          certificatesUsed: canGenerateData.currentUsage || 0,
          certificatesLimit: canGenerateData.limit || 0,
          certificatesRemaining: canGenerateData.remaining || 0,
          features: subscriptionData.subscription.features || []
        });
      } else if (canGenerateResponse.ok) {
        // Fallback to can-generate endpoint if subscription endpoint fails
        const canGenerateData = await canGenerateResponse.json();
        console.log('Using fallback can-generate data:', canGenerateData);
        
        // Try to determine tier from certificate limits
        let estimatedTier = 'free';
        const limit = canGenerateData.limit || 0;
        if (limit >= 200) estimatedTier = 'schools';
        else if (limit >= 100) estimatedTier = 'enterprise';
        else if (limit >= 30) estimatedTier = 'premium';
        else if (limit >= 10) estimatedTier = 'professional';
        else if (limit >= 5) estimatedTier = 'free';
        else if (limit >= 1) estimatedTier = 'free';
        
        // Get template limits for estimated tier
        let templatesLimit = 0;
        if (estimatedTier === 'professional') templatesLimit = 5;
        else if (estimatedTier === 'premium') templatesLimit = 15;
        else if (estimatedTier === 'enterprise') templatesLimit = 50;
        else if (estimatedTier === 'schools') templatesLimit = 50;
        
        // Try to get actual template count from user templates endpoint
        let templatesUsed = 0;
        try {
          const templatesResponse = await fetch(`${apiUrl}/user/templates`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          if (templatesResponse.ok) {
            const templatesData = await templatesResponse.json();
            templatesUsed = templatesData.templates ? templatesData.templates.length : 0;
          }
        } catch (error) {
          console.error('Error fetching templates count:', error);
        }
        
        setSubscriptionInfo({
          tier: estimatedTier,
          expires: null,
          templatesUsed: templatesUsed,
          templatesLimit: templatesLimit,
          certificatesUsed: canGenerateData.currentUsage || 0,
          certificatesLimit: canGenerateData.limit || 0,
          certificatesRemaining: canGenerateData.remaining || 0,
          features: ['Certificate generation available']
        });
      } else {
        console.error('Both subscription endpoints failed');
        // Set default subscription info
        setSubscriptionInfo({
          tier: 'free',
          expires: null,
          templatesUsed: 0,
          templatesLimit: 0,
          certificatesUsed: 0,
          certificatesLimit: 1,
          certificatesRemaining: 1,
          features: ['1 certificate per month', 'Admin templates only', 'No custom templates']
        });
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error);
      // Set default subscription info
      setSubscriptionInfo({
        tier: 'free',
        expires: null,
        templatesUsed: 0,
        templatesLimit: 0,
        certificatesUsed: 0,
        certificatesLimit: 1,
        certificatesRemaining: 1,
        features: ['1 certificate per month', 'Admin templates only', 'No custom templates']
      });
    }
  };

  // Navigate to pricing page
  const handleUpgradeClick = () => {
    navigate('/payment');
  };

  // Cancel subscription
  const cancelSubscription = async () => {
    const confirmMessage = `Are you sure you want to cancel your subscription?

⚠️ Important:
• You will lose access to premium features at the end of your billing period
• Your custom templates will be preserved but you won't be able to create new ones
• You can resubscribe at any time
• Your subscription expires on ${subscriptionInfo ? new Date(subscriptionInfo.expires).toLocaleDateString() : 'N/A'}

This action cannot be undone. Continue with cancellation?`;

    if (!token || !confirm(confirmMessage)) return;
    
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/user/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: `Subscription cancelled successfully. Your access will continue until ${subscriptionInfo ? new Date(subscriptionInfo.expires).toLocaleDateString() : 'your billing period ends'}.` });
        fetchSubscriptionInfo(); // Refresh subscription data
        onUserUpdate(user); // Refresh user data
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to cancel subscription' });
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      setMessage({ type: 'error', text: 'Failed to cancel subscription. Please check your internet connection and try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Fetch subscription info on component mount
  useEffect(() => {
    fetchSubscriptionInfo();
  }, [token]);

  const isPasswordStrong = Object.values(passwordStrength).every(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-slate-700/50">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-blue-500/20 rounded-full border border-blue-400/30">
            <User className="h-8 w-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">User Profile</h1>
            <p className="text-gray-400">Manage your account settings and security</p>
          </div>
        </div>
      </div>

      {/* Message */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`p-4 border-b border-slate-700/50 ${
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
      </AnimatePresence>

      {/* Tab Navigation */}
      <div className="flex border-b border-slate-700/50">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
            activeTab === 'profile'
              ? 'text-blue-400 bg-blue-500/10 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <User className="h-4 w-4" />
            <span>{t('profile.tabs.profile')}</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
            activeTab === 'security'
              ? 'text-blue-400 bg-blue-500/10 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>{t('profile.tabs.security')}</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
            activeTab === 'certificates'
              ? 'text-blue-400 bg-blue-500/10 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Award className="h-4 w-4" />
            <span>{t('profile.tabs.certificates')}</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('subscription')}
          className={`flex-1 py-4 px-6 text-sm font-medium transition-colors ${
            activeTab === 'subscription'
              ? 'text-blue-400 bg-blue-500/10 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            <Crown className="h-4 w-4" />
            <span>{t('profile.tabs.subscription')}</span>
          </div>
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'profile' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Profile Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Profile Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleProfileSave}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{loading ? 'Saving...' : 'Save'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setProfileData({
                        firstName: user?.firstName || '',
                        lastName: user?.lastName || '',
                        email: user?.email || ''
                      });
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 transition-colors ${
                      isEditing 
                        ? 'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50' 
                        : 'cursor-not-allowed opacity-60'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 transition-colors ${
                      isEditing 
                        ? 'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50' 
                        : 'cursor-not-allowed opacity-60'
                    }`}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 transition-colors ${
                      isEditing 
                        ? 'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50' 
                        : 'cursor-not-allowed opacity-60'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-medium text-white mb-3">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-400">Member since:</span>
                  <span className="text-white">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Settings className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-400">Role:</span>
                  <span className="text-white capitalize">{user?.role || 'User'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-gray-400">GDPR Consent:</span>
                  <span className="text-green-400">✓ Granted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-400">Last login:</span>
                  <span className="text-white">
                    {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Security Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Security Settings</h2>
              {!isChangingPassword ? (
                <button
                  onClick={() => setIsChangingPassword(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  <Key className="h-4 w-4" />
                  <span>Change Password</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handlePasswordReset}
                    disabled={loading || !isPasswordStrong || passwordData.newPassword !== passwordData.confirmPassword}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Save className="h-4 w-4" />
                    <span>{loading ? 'Updating...' : 'Update Password'}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>

            {/* Password Change Form */}
            <AnimatePresence>
              {isChangingPassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-colors"
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                      >
                        {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="w-full pl-10 pr-12 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition-colors"
                        placeholder="Enter a new strong password"
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
                              <span>8+ characters</span>
                            </div>
                            <div className={`flex items-center space-x-2 ${passwordStrength.hasUpper ? 'text-green-400' : 'text-gray-400'}`}>
                              <CheckCircle className="h-3 w-3" />
                              <span>Uppercase</span>
                            </div>
                            <div className={`flex items-center space-x-2 ${passwordStrength.hasLower ? 'text-green-400' : 'text-gray-400'}`}>
                              <CheckCircle className="h-3 w-3" />
                              <span>Lowercase</span>
                            </div>
                            <div className={`flex items-center space-x-2 ${passwordStrength.hasNumber ? 'text-green-400' : 'text-gray-400'}`}>
                              <CheckCircle className="h-3 w-3" />
                              <span>Number</span>
                            </div>
                            <div className={`flex items-center space-x-2 ${passwordStrength.hasSpecial ? 'text-green-400' : 'text-gray-400'}`}>
                              <CheckCircle className="h-3 w-3" />
                              <span>Special char</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className={`w-full pl-10 pr-12 py-3 bg-slate-700/50 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                          passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                            ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500/50'
                            : 'border-slate-600/50 focus:ring-green-500/50 focus:border-green-500/50'
                        }`}
                        placeholder="Confirm your new password"
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
                      <p className="mt-1 text-red-400 text-xs">Passwords do not match</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Two-Factor Authentication Management */}
            <TwoFactorManagement
              apiUrl={apiUrl}
              token={token}
            />

            {/* Security Information */}
            <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-medium text-white mb-3">Security Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-gray-400">Account Security:</span>
                  <span className="text-green-400">Protected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4 text-blue-400" />
                  <span className="text-gray-400">Password Strength:</span>
                  <span className="text-blue-400">Strong</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'certificates' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Certificates Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <h2 className="text-xl font-semibold text-white">My Certificates</h2>
              <button
                onClick={fetchCertificates}
                disabled={certificatesLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" />
                <span>{certificatesLoading ? 'Loading...' : 'Refresh'}</span>
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search certificates by name or course..."
                  className="w-full pl-10 pr-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'course')}
                  className="pl-10 pr-8 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-colors"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="course">Sort by Course</option>
                </select>
              </div>
            </div>

            {/* Certificates List */}
            <div className="space-y-4">
              {certificatesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-3 text-gray-400">Loading certificates...</span>
                </div>
              ) : certificates.length === 0 ? (
                <div className="text-center py-12">
                  <Award className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-gray-400 mb-2">No Certificates Yet</h3>
                  <p className="text-gray-500">Generate your first certificate to see it here!</p>
                </div>
              ) : (
                certificates
                  .filter(cert => 
                    searchTerm === '' || 
                    cert.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    cert.course_name.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .sort((a, b) => {
                    switch (sortBy) {
                      case 'name':
                        return a.student_name.localeCompare(b.student_name);
                      case 'course':
                        return a.course_name.localeCompare(b.course_name);
                      case 'date':
                      default:
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                    }
                  })
                  .map((certificate) => (
                    <motion.div
                      key={certificate.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-700/30 border border-slate-600/30 rounded-lg p-6 hover:bg-slate-700/50 transition-colors"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-green-500/20 rounded-lg border border-green-400/30">
                              <Award className="h-5 w-5 text-green-400" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-white">{certificate.student_name}</h3>
                              <p className="text-blue-300 font-medium">{certificate.course_name}</p>
                              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-400">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>Issued: {new Date(certificate.issue_date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <FileText className="h-4 w-4" />
                                  <span>Template: {certificate.template_id}</span>
                                </div>
                                {certificate.download_count > 0 && (
                                  <div className="flex items-center space-x-1">
                                    <Download className="h-4 w-4" />
                                    <span>Downloaded {certificate.download_count} times</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <div className="flex items-center space-x-2">
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              certificate.status === 'ACTIVE' 
                                ? 'bg-green-500/20 text-green-400 border border-green-400/30'
                                : 'bg-red-500/20 text-red-400 border border-red-400/30'
                            }`}>
                              {certificate.status}
                            </div>
                            {certificate.verification_count > 0 && (
                              <div className="px-2 py-1 bg-blue-500/20 text-blue-400 border border-blue-400/30 rounded-full text-xs font-medium">
                                {certificate.verification_count} verifications
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={() => {
                              // TODO: Implement certificate download
                              console.log('Download certificate:', certificate.certificate_id);
                            }}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            <span className="hidden sm:inline">Download</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
              )}
            </div>

            {/* Statistics */}
            {certificates.length > 0 && (
              <div className="bg-slate-700/30 rounded-lg p-4">
                <h3 className="text-lg font-medium text-white mb-3">Certificate Statistics</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-green-400" />
                    <span className="text-gray-400">Total Certificates:</span>
                    <span className="text-white font-medium">{certificates.length}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Download className="h-4 w-4 text-blue-400" />
                    <span className="text-gray-400">Total Downloads:</span>
                    <span className="text-white font-medium">
                      {certificates.reduce((sum, cert) => sum + (cert.download_count || 0), 0)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-purple-400" />
                    <span className="text-gray-400">Total Verifications:</span>
                    <span className="text-white font-medium">
                      {certificates.reduce((sum, cert) => sum + (cert.verification_count || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'subscription' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Subscription Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{t('subscription.title')}</h2>
              <button
                onClick={fetchSubscriptionInfo}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>{t('subscription.refreshData')}</span>
              </button>
            </div>

            {/* Subscription Info */}
            {subscriptionInfo ? (
              <div className="space-y-6">
                {/* Current Plan */}
                <div className="bg-slate-700/30 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-white flex items-center">
                        <Crown className="h-5 w-5 text-yellow-400 mr-2" />
                        {t('subscription.currentPlan')}: <span className="capitalize ml-2 text-blue-300">{subscriptionInfo.tier}</span>
                      </h3>
                      {subscriptionInfo.expires && (
                        <p className="text-gray-400 mt-1">
                          {t('subscription.expires')}: {new Date(subscriptionInfo.expires).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {subscriptionInfo.tier !== 'free' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={handleUpgradeClick}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          <ExternalLink className="h-4 w-4 inline mr-2" />
                          {t('subscription.managePlan')}
                        </button>
                        <button
                          onClick={cancelSubscription}
                          disabled={loading}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          {t('subscription.cancelPlan')}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Usage Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">{t('subscription.templatesUsed')}</span>
                        <span className="text-lg font-medium text-white">
                          {subscriptionInfo.templatesUsed}/{subscriptionInfo.templatesLimit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (subscriptionInfo.templatesUsed / subscriptionInfo.templatesLimit) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">{t('subscription.certificatesUsed')}</span>
                        <span className="text-lg font-medium text-white">
                          {subscriptionInfo.certificatesUsed}/{subscriptionInfo.certificatesLimit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (subscriptionInfo.certificatesUsed / subscriptionInfo.certificatesLimit) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-400">{t('subscription.remaining')}</span>
                        <span className="text-lg font-medium text-white">
                          {subscriptionInfo.certificatesRemaining}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (subscriptionInfo.certificatesRemaining / subscriptionInfo.certificatesLimit) * 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plan Features */}
                <div className="bg-slate-700/30 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-white mb-4">{t('subscription.planFeatures')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {subscriptionInfo.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-3">
                        <CheckCircle className="h-4 w-4 text-green-400 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upgrade Section for Free Users */}
                {subscriptionInfo.tier === 'free' && (
                  <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-400/30 rounded-lg p-6">
                    <div className="flex items-start space-x-4">
                      <Star className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white mb-2">{t('subscription.upgradePlan')}</h3>
                        <p className="text-gray-300 mb-4">
                          {t('subscription.upgradeDescription')}
                        </p>
                        <button
                          onClick={handleUpgradeClick}
                          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 flex items-center space-x-2"
                        >
                          <Crown className="h-4 w-4" />
                          <span>{t('subscription.viewPlans')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="h-12 w-12 text-gray-600 mx-auto mb-4 animate-spin" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">{t('subscription.loading')}</h3>
                  <p className="text-gray-500">{t('subscription.loadingDescription')}</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default UserProfile;