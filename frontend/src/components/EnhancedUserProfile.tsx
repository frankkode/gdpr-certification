import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  User, Mail, Calendar, Shield, Settings, Bell, 
  Camera, Upload, Download, Trash2, Eye, EyeOff,
  Check, X, RefreshCw, AlertTriangle, Globe,
  Smartphone, Lock, Key, Activity, BarChart3,
  CreditCard, Award, Clock, Languages
} from 'lucide-react';
import TwoFactorManagement from './TwoFactorManagement';

interface EnhancedUserProfileProps {
  user: any;
  token: string;
  apiUrl: string;
  onUserUpdate: (user: any) => void;
}

interface UserPreferences {
  language: string;
  timezone: string;
  emailNotifications: {
    security: boolean;
    marketing: boolean;
    certificates: boolean;
    system: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'private';
    showActivity: boolean;
    allowAnalytics: boolean;
  };
  display: {
    theme: 'auto' | 'light' | 'dark';
    dateFormat: string;
    numberFormat: string;
  };
}

interface UserStats {
  certificatesGenerated: number;
  verificationsPerformed: number;
  accountAge: number;
  lastActive: string;
  subscriptionStatus: string;
  storageUsed: number;
  storageLimit: number;
}

const EnhancedUserProfile: React.FC<EnhancedUserProfileProps> = ({
  user,
  token,
  apiUrl,
  onUserUpdate
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'privacy' | 'data'>('profile');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>({
    language: 'en',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    emailNotifications: {
      security: true,
      marketing: false,
      certificates: true,
      system: true
    },
    privacy: {
      profileVisibility: 'private',
      showActivity: false,
      allowAnalytics: true
    },
    display: {
      theme: 'auto',
      dateFormat: 'MM/DD/YYYY',
      numberFormat: 'en-US'
    }
  });
  const [userStats, setUserStats] = useState<UserStats>({
    certificatesGenerated: 0,
    verificationsPerformed: 0,
    accountAge: 0,
    lastActive: '',
    subscriptionStatus: 'free',
    storageUsed: 0,
    storageLimit: 100
  });
  
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    bio: '',
    website: '',
    location: '',
    occupation: ''
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showPasswords: false
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user preferences and stats in parallel
      const [prefsResponse, statsResponse] = await Promise.all([
        fetch(`${apiUrl}/auth/preferences`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/auth/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (prefsResponse.ok) {
        const prefsData = await prefsResponse.json();
        setPreferences(prev => ({ ...prev, ...prefsData.preferences }));
        if (prefsData.avatar) {
          setAvatar(prefsData.avatar);
        }
        setProfileForm(prev => ({
          ...prev,
          bio: prefsData.bio || '',
          website: prefsData.website || '',
          location: prefsData.location || '',
          occupation: prefsData.occupation || ''
        }));
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setUserStats(statsData.stats);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      setError('Avatar file must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch(`${apiUrl}/auth/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setAvatar(data.avatarUrl);
        setSuccess('Avatar updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to upload avatar');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileUpdate = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileForm)
      });

      const data = await response.json();

      if (response.ok) {
        onUserUpdate(data.user);
        setSuccess('Profile updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/auth/change-password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
          showPasswords: false
        });
        setSuccess('Password changed successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setSaving(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/auth/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ preferences })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Preferences updated successfully');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to update preferences');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const exportUserData = async () => {
    try {
      const response = await fetch(`${apiUrl}/auth/export-data`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      setError('Failed to export data');
    }
  };

  const deleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    const confirmText = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmText !== 'DELETE') {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/auth/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Logout user
        window.location.href = '/';
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete account');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'privacy', label: 'Privacy', icon: Lock },
    { id: 'data', label: 'Data', icon: Download }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Account Settings</h2>
        <p className="text-gray-400">Manage your profile, security, and preferences</p>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-400" />
            <span className="text-green-300 text-sm">{success}</span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/5 p-1 rounded-lg overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-green-500/20 text-green-300'
                : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center overflow-hidden">
                  {avatar ? (
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-white" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition"
                >
                  <Camera className="h-4 w-4 text-white" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
                  className="hidden"
                />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-xl font-semibold text-white">{user?.firstName} {user?.lastName}</h3>
                <p className="text-gray-400">{user?.email}</p>
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(user?.createdAt).toLocaleDateString()}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Activity className="h-4 w-4" />
                    <span>Last active {userStats.lastActive}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* User Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <Award className="h-6 w-6 text-yellow-400 mx-auto mb-2" />
                <p className="text-lg font-semibold text-white">{userStats.certificatesGenerated}</p>
                <p className="text-xs text-gray-400">Certificates</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <Eye className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                <p className="text-lg font-semibold text-white">{userStats.verificationsPerformed}</p>
                <p className="text-xs text-gray-400">Verifications</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <Clock className="h-6 w-6 text-green-400 mx-auto mb-2" />
                <p className="text-lg font-semibold text-white">{userStats.accountAge}</p>
                <p className="text-xs text-gray-400">Days Active</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <BarChart3 className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                <p className="text-lg font-semibold text-white">
                  {Math.round((userStats.storageUsed / userStats.storageLimit) * 100)}%
                </p>
                <p className="text-xs text-gray-400">Storage Used</p>
              </div>
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Occupation</label>
                <input
                  type="text"
                  value={profileForm.occupation}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, occupation: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-400"
                  placeholder="Your job title or profession"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">Bio</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-400 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>

            <button
              onClick={handleProfileUpdate}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-lg transition"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Password Change */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Change Password</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={passwordForm.showPasswords ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-400"
                    />
                    <button
                      type="button"
                      onClick={() => setPasswordForm(prev => ({ ...prev, showPasswords: !prev.showPasswords }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {passwordForm.showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                  <input
                    type={passwordForm.showPasswords ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                  <input
                    type={passwordForm.showPasswords ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-400"
                  />
                </div>
                <button
                  onClick={handlePasswordChange}
                  disabled={saving || !passwordForm.currentPassword || !passwordForm.newPassword}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white rounded-lg transition"
                >
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Key className="h-4 w-4" />}
                  <span>{saving ? 'Changing...' : 'Change Password'}</span>
                </button>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <TwoFactorManagement
              apiUrl={apiUrl}
              token={token}
            />
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Language & Region */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Language & Region</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-400"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
                    <select
                      value={preferences.timezone}
                      onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-400"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Email Notifications</h3>
                <div className="space-y-3">
                  {Object.entries(preferences.emailNotifications).map(([key, value]) => (
                    <label key={key} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          emailNotifications: {
                            ...prev.emailNotifications,
                            [key]: e.target.checked
                          }
                        }))}
                        className="w-4 h-4 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handlePreferencesUpdate}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-lg transition"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
            </button>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Privacy Settings</h3>
              <div className="space-y-4">
                {Object.entries(preferences.privacy).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-lg cursor-pointer">
                    <div>
                      <span className="text-sm font-medium text-white capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </span>
                      <p className="text-xs text-gray-400">
                        {key === 'profileVisibility' ? 'Control who can see your profile' :
                         key === 'showActivity' ? 'Display your activity status to others' :
                         'Allow us to analyze your usage for improvements'}
                      </p>
                    </div>
                    {typeof value === 'boolean' ? (
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          privacy: {
                            ...prev.privacy,
                            [key]: e.target.checked
                          }
                        }))}
                        className="w-4 h-4 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500"
                      />
                    ) : (
                      <select
                        value={value}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          privacy: {
                            ...prev.privacy,
                            [key]: e.target.value
                          }
                        }))}
                        className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:border-green-400"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                      </select>
                    )}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handlePreferencesUpdate}
              disabled={saving}
              className="flex items-center space-x-2 px-6 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-lg transition"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>{saving ? 'Saving...' : 'Save Privacy Settings'}</span>
            </button>
          </div>
        )}

        {/* Data Tab */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Data Management</h3>
              <p className="text-gray-400 mb-6">
                Manage your personal data in compliance with GDPR regulations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Download className="h-6 w-6 text-blue-400" />
                  <h4 className="font-medium text-blue-300">Export Your Data</h4>
                </div>
                <p className="text-sm text-blue-200 mb-4">
                  Download a copy of all your personal data stored in our system.
                </p>
                <button
                  onClick={exportUserData}
                  className="w-full px-4 py-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-lg hover:bg-blue-500/30 transition"
                >
                  Export Data
                </button>
              </div>

              <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Trash2 className="h-6 w-6 text-red-400" />
                  <h4 className="font-medium text-red-300">Delete Account</h4>
                </div>
                <p className="text-sm text-red-200 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                  onClick={deleteAccount}
                  className="w-full px-4 py-2 bg-red-500/20 border border-red-400/30 text-red-300 rounded-lg hover:bg-red-500/30 transition"
                >
                  Delete Account
                </button>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-4">
              <h4 className="font-medium text-green-300 mb-2">GDPR Compliance</h4>
              <ul className="text-sm text-green-200 space-y-1">
                <li>• Right to access: Export your data anytime</li>
                <li>• Right to rectification: Update your profile information</li>
                <li>• Right to erasure: Delete your account completely</li>
                <li>• Data portability: Export data in JSON format</li>
                <li>• Data minimization: We only store necessary information</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedUserProfile;