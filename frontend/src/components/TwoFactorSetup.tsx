import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Shield, QrCode, Copy, Download, Eye, EyeOff,
  CheckCircle, AlertTriangle, RefreshCw, Smartphone,
  Lock, Key, X, Check
} from 'lucide-react';

interface TwoFactorSetupProps {
  apiUrl: string;
  token: string;
  onComplete: () => void;
  onCancel: () => void;
}

interface SetupData {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({
  apiUrl,
  token,
  onComplete,
  onCancel
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<'intro' | 'qr' | 'verify' | 'backup'>('intro');
  const [setupData, setSetupData] = useState<SetupData | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);

  const authenticatorApps = [
    { name: 'Google Authenticator', platforms: ['iOS', 'Android'] },
    { name: 'Authy', platforms: ['iOS', 'Android', 'Desktop'] },
    { name: 'Microsoft Authenticator', platforms: ['iOS', 'Android'] },
    { name: '1Password', platforms: ['iOS', 'Android', 'Desktop'] }
  ];

  const generateQRCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/auth/2fa/setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setSetupData(data);
        
        // Generate QR code image
        const qrResponse = await fetch(`${apiUrl}/auth/2fa/qr`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ otpUrl: data.qrCodeUrl })
        });

        const qrData = await qrResponse.json();
        if (qrResponse.ok) {
          setQrCodeImage(qrData.qrCode);
        }

        setStep('qr');
      } else {
        setError(data.error || 'Failed to generate setup data');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${apiUrl}/auth/2fa/enable`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: verificationCode })
      });

      const data = await response.json();

      if (response.ok) {
        setStep('backup');
      } else {
        setError(data.error || 'Invalid verification code');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadBackupCodes = () => {
    if (!setupData) return;

    const content = [
      'CertifySecure - Two-Factor Authentication Backup Codes',
      '=' .repeat(55),
      '',
      'IMPORTANT: Store these codes in a safe place!',
      'Each code can only be used once.',
      '',
      'Backup Codes:',
      ...setupData.backupCodes.map((code, index) => `${index + 1}. ${code}`),
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
    setBackupCodesSaved(true);
  };

  const completSetup = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-green-400" />
              <div>
                <h2 className="text-xl font-bold text-white">Two-Factor Authentication</h2>
                <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white transition"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              {['intro', 'qr', 'verify', 'backup'].map((stepName, index) => (
                <div key={stepName} className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    ${step === stepName ? 'bg-green-500 text-white' : 
                      ['intro', 'qr', 'verify', 'backup'].indexOf(step) > index ? 'bg-green-500 text-white' : 'bg-gray-600 text-gray-300'}
                  `}>
                    {['intro', 'qr', 'verify', 'backup'].indexOf(step) > index ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < 3 && (
                    <div className={`w-12 h-0.5 ${
                      ['intro', 'qr', 'verify', 'backup'].indexOf(step) > index ? 'bg-green-500' : 'bg-gray-600'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Introduction Step */}
          {step === 'intro' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <Smartphone className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Secure Your Account</h3>
                <p className="text-gray-400">
                  Two-factor authentication adds an extra layer of security by requiring a code from your phone.
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
                <h4 className="font-medium text-blue-300 mb-2">What you'll need:</h4>
                <ul className="text-sm text-blue-200 space-y-1">
                  <li>• An authenticator app on your phone</li>
                  <li>• Your phone to scan a QR code</li>
                  <li>• A safe place to store backup codes</li>
                </ul>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium text-white">Recommended Authenticator Apps:</h4>
                {authenticatorApps.map((app) => (
                  <div key={app.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white">{app.name}</span>
                    <span className="text-xs text-gray-400">{app.platforms.join(', ')}</span>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={generateQRCode}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                  <span>{loading ? 'Setting up...' : 'Continue'}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* QR Code Step */}
          {step === 'qr' && setupData && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Scan QR Code</h3>
                <p className="text-gray-400">
                  Open your authenticator app and scan this QR code
                </p>
              </div>

              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  {qrCodeImage ? (
                    <img src={qrCodeImage} alt="QR Code" className="w-48 h-48" />
                  ) : (
                    <div className="w-48 h-48 bg-gray-200 rounded flex items-center justify-center">
                      <RefreshCw className="h-8 w-8 text-gray-400 animate-spin" />
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-lg p-4">
                <h4 className="font-medium text-yellow-300 mb-2">Can't scan the code?</h4>
                <p className="text-sm text-yellow-200 mb-3">
                  Enter this secret key manually in your authenticator app:
                </p>
                <div className="flex items-center space-x-2">
                  <code className="flex-1 bg-black/20 p-2 rounded text-xs text-white font-mono">
                    {showSecret ? setupData.secret : '••••••••••••••••••••••••••••••••'}
                  </code>
                  <button
                    onClick={() => setShowSecret(!showSecret)}
                    className="p-2 text-yellow-400 hover:text-yellow-300 transition"
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(setupData.secret)}
                    className="p-2 text-yellow-400 hover:text-yellow-300 transition"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('intro')}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep('verify')}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                >
                  Next
                </button>
              </div>
            </motion.div>
          )}

          {/* Verification Step */}
          {step === 'verify' && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <Key className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Verify Setup</h3>
                <p className="text-gray-400">
                  Enter the 6-digit code from your authenticator app
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                    <span className="text-red-300 text-sm">{error}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => {
                    setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  placeholder="000000"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:border-green-400"
                  maxLength={6}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('qr')}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition"
                >
                  Back
                </button>
                <button
                  onClick={verifyAndEnable}
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-lg transition flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <span>{loading ? 'Verifying...' : 'Verify & Enable'}</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Backup Codes Step */}
          {step === 'backup' && setupData && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">2FA Enabled Successfully!</h3>
                <p className="text-gray-400">
                  Save these backup codes in a safe place
                </p>
              </div>

              <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-300 mb-1">Important!</h4>
                    <p className="text-sm text-red-200">
                      These backup codes can be used if you lose access to your authenticator app. 
                      Each code can only be used once. Store them securely!
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
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
                <div className="grid grid-cols-2 gap-2">
                  {setupData.backupCodes.map((code, index) => (
                    <div
                      key={index}
                      className="bg-black/20 p-2 rounded text-center font-mono text-sm text-white"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-3">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={backupCodesSaved}
                    onChange={(e) => setBackupCodesSaved(e.target.checked)}
                    className="w-4 h-4 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-green-300">
                    I have saved these backup codes in a secure location
                  </span>
                </label>
              </div>

              <button
                onClick={completSetup}
                disabled={!backupCodesSaved}
                className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white rounded-lg transition"
              >
                Complete Setup
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TwoFactorSetup;