import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Shield, ShieldCheck, ShieldX, RefreshCw, AlertTriangle,
  Key, Download, Eye, EyeOff, Check, X, Settings
} from 'lucide-react';
import TwoFactorSetup from './TwoFactorSetup';

interface TwoFactorManagementProps {
  apiUrl: string;
  token: string;
  onStatusChange?: (enabled: boolean) => void;
}

interface TwoFactorStatus {
  enabled: boolean;
  hasSecret: boolean;
  backupCodesRemaining: number;
}

const TwoFactorManagement: React.FC<TwoFactorManagementProps> = ({
  apiUrl,
  token,
  onStatusChange
}) => {
  const { t } = useTranslation();
  const [status, setStatus] = useState<TwoFactorStatus>({
    enabled: false,
    hasSecret: false,
    backupCodesRemaining: 0
  });
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [disableForm, setDisableForm] = useState({
    password: '',
    twoFactorCode: '',
    showPassword: false
  });
  const [newBackupCodes, setNewBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/auth/2fa/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupComplete = () => {
    setShowSetup(false);
    fetchStatus();
    onStatusChange?.(true);
  };

  const handleDisable2FA = async () => {
    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/auth/2fa/disable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          password: disableForm.password,
          twoFactorCode: disableForm.twoFactorCode
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowDisableDialog(false);
        setDisableForm({ password: '', twoFactorCode: '', showPassword: false });
        fetchStatus();
        onStatusChange?.(false);
      } else {
        setError(data.error || 'Failed to disable 2FA');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const regenerateBackupCodes = async () => {
    setActionLoading(true);
    setError('');

    const twoFactorCode = prompt('Enter your current 2FA code to regenerate backup codes:');
    if (!twoFactorCode) {
      setActionLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/auth/2fa/regenerate-backup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ twoFactorCode })
      });

      const data = await response.json();

      if (response.ok) {
        setNewBackupCodes(data.backupCodes);
        setShowBackupCodes(true);
        fetchStatus();
      } else {
        setError(data.error || 'Failed to regenerate backup codes');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const content = [
      'CertifySecure - Two-Factor Authentication Backup Codes',
      '=' .repeat(55),
      '',
      'IMPORTANT: Store these codes in a safe place!',
      'Each code can only be used once.',
      '',
      'Backup Codes:',
      ...newBackupCodes.map((code, index) => `${index + 1}. ${code}`),
      '',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      'If you lose access to your authenticator app, you can use',
      'these codes to sign in to your account.'
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'certifysecure-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="h-5 w-5 text-green-400 animate-spin" />
          <span className="text-white">Loading 2FA status...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white/5 border border-white/10 rounded-lg p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {status.enabled ? (
              <ShieldCheck className="h-6 w-6 text-green-400" />
            ) : (
              <ShieldX className="h-6 w-6 text-gray-400" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-400">
                {status.enabled 
                  ? 'Your account is protected with 2FA' 
                  : 'Add an extra layer of security to your account'
                }
              </p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            status.enabled 
              ? 'bg-green-500/20 text-green-300 border border-green-400/30'
              : 'bg-gray-500/20 text-gray-300 border border-gray-400/30'
          }`}>
            {status.enabled ? 'Enabled' : 'Disabled'}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span className="text-red-300 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Status Information */}
        {status.enabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Check className="h-4 w-4 text-green-400" />
                <span className="text-sm font-medium text-green-300">Authenticator App</span>
              </div>
              <p className="text-xs text-green-200">
                Connected and ready to generate codes
              </p>
            </div>
            <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Key className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-medium text-blue-300">Backup Codes</span>
              </div>
              <p className="text-xs text-blue-200">
                {status.backupCodesRemaining} codes remaining
              </p>
            </div>
          </div>
        )}

        {/* Security Benefits */}
        {!status.enabled && (
          <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
            <h4 className="font-medium text-blue-300 mb-2">Security Benefits</h4>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Protect against password breaches</li>
              <li>• Prevent unauthorized account access</li>
              <li>• Compatible with Google Authenticator, Authy, and more</li>
              <li>• Backup codes for emergency access</li>
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!status.enabled ? (
            <button
              onClick={() => setShowSetup(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
            >
              <Shield className="h-4 w-4" />
              <span>Enable 2FA</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowDisableDialog(true)}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-500/20 border border-red-400/30 text-red-300 rounded-lg hover:bg-red-500/30 transition"
              >
                <X className="h-4 w-4" />
                <span>Disable 2FA</span>
              </button>
              <button
                onClick={regenerateBackupCodes}
                disabled={actionLoading}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-lg hover:bg-blue-500/30 transition disabled:opacity-50"
              >
                {actionLoading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span>Regenerate Backup Codes</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {showSetup && (
        <TwoFactorSetup
          apiUrl={apiUrl}
          token={token}
          onComplete={handleSetupComplete}
          onCancel={() => setShowSetup(false)}
        />
      )}

      {/* Disable 2FA Dialog */}
      {showDisableDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-lg max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-red-400" />
                <h3 className="text-lg font-semibold text-white">Disable Two-Factor Authentication</h3>
              </div>

              <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-200">
                  Disabling 2FA will make your account less secure. You'll need to provide your password and a 2FA code.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={disableForm.showPassword ? 'text' : 'password'}
                      value={disableForm.password}
                      onChange={(e) => setDisableForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-2 pr-10 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-red-400"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setDisableForm(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {disableForm.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    2FA Code
                  </label>
                  <input
                    type="text"
                    value={disableForm.twoFactorCode}
                    onChange={(e) => setDisableForm(prev => ({ 
                      ...prev, 
                      twoFactorCode: e.target.value.replace(/\D/g, '').slice(0, 6) 
                    }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-center font-mono focus:outline-none focus:border-red-400"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowDisableDialog(false);
                    setDisableForm({ password: '', twoFactorCode: '', showPassword: false });
                    setError('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisable2FA}
                  disabled={actionLoading || !disableForm.password || disableForm.twoFactorCode.length !== 6}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 text-white rounded-lg transition flex items-center justify-center space-x-2"
                >
                  {actionLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  <span>{actionLoading ? 'Disabling...' : 'Disable 2FA'}</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* New Backup Codes Modal */}
      {showBackupCodes && newBackupCodes.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-lg max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">New Backup Codes</h3>
                <button
                  onClick={() => setShowBackupCodes(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-3 mb-4">
                <p className="text-sm text-red-200">
                  Your old backup codes are now invalid. Save these new codes in a secure location.
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-white">Backup Codes</h4>
                  <button
                    onClick={downloadBackupCodes}
                    className="flex items-center space-x-1 text-green-400 hover:text-green-300 text-sm transition"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {newBackupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="bg-black/20 p-2 rounded text-center font-mono text-sm text-white"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowBackupCodes(false)}
                className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default TwoFactorManagement;