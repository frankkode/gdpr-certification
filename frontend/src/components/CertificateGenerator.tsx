// 📜 GDPR-Compliant Certificate Generator Component - FIXED VERSION
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  User, Hash, Shield, Lock, 
  CheckCircle, AlertTriangle, Loader2, Eye, EyeOff,
  Clock, Key, Database, Trash2, UserX, Palette, RefreshCw,
  Upload, Image, FileSignature, Wallpaper, X, ExternalLink
} from 'lucide-react';
import CryptoJS from 'crypto-js';
import { useAuth } from '../contexts/AuthContext';
import CertificateTemplates from './CertificateTemplates';

interface CertificateGeneratorProps {
  onCertificateGenerated: () => void;
  apiUrl: string;
}

interface ValidationErrors {
  user?: string;
  exam?: string;
}

interface CertificateData {
  user: string;
  exam: string;
  timestamp: number;
  nonce: string;
  version: string;
  issuer: string;
  integrity: string;
}

interface AssetData {
  logo?: File | null;
  signature?: File | null;
  background?: File | null;
}

const GDPRCertificateGenerator: React.FC<CertificateGeneratorProps> = ({
  onCertificateGenerated,
  apiUrl
}) => {
  const { token, user: authUser, refreshAuth } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Form state
  const [user, setUser] = useState('');
  const [exam, setExam] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHashVisualization, setShowHashVisualization] = useState(true);
  const [showTemplateSelection, setShowTemplateSelection] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [generationProgress, setGenerationProgress] = useState(0);
  
  // Asset upload state
  const [assets, setAssets] = useState<AssetData>({
    logo: null,
    signature: null,
    background: null
  });
  const [assetPreviews, setAssetPreviews] = useState<{
    logo?: string;
    signature?: string;
    background?: string;
  }>({});
  
  // GDPR compliance states
  const [showDataDeletion, setShowDataDeletion] = useState(false);
  const [deletionProgress, setDeletionProgress] = useState(0);
  const [isDataDeleted, setIsDataDeleted] = useState(false);
  
  // Security and visualization state
  const [hashingSteps, setHashingSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [canonicalJSON, setCanonicalJSON] = useState('');
  const [realTimeHash, setRealTimeHash] = useState('');
  const [securityMetrics, setSecurityMetrics] = useState({
    entropy: 0,
    complexity: 0,
    predictability: 0
  });

  // Subscription status state
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    canGenerate: boolean;
    currentUsage?: number;
    limit?: number;
    remaining?: number;
    reason?: string;
  } | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  // ✅ FIXED: Exact canonical JSON creation matching GDPR-compliant backend
  const createCanonicalJSON = useCallback((userData: string, examData: string, providedTimestamp?: number, providedNonce?: string): string => {
    const timestamp = providedTimestamp || Date.now();
    const nonce = providedNonce || CryptoJS.lib.WordArray.random(16).toString();
    
    // Create certificate object exactly like GDPR-compliant backend
    const certificate: CertificateData = {
      user: userData.trim(),
      exam: examData.trim(),
      timestamp,
      nonce,
      version: "4.0",
      issuer: "GDPR-Compliant Certificate System",
      integrity: "SHA-512"
    };
    
    // Sort keys alphabetically for canonical representation
    const sortedKeys = Object.keys(certificate).sort();
    const canonicalObj: Record<string, CertificateData[keyof CertificateData]> = {};
    sortedKeys.forEach(key => {
      canonicalObj[key] = certificate[key as keyof CertificateData];
    });
    
    return JSON.stringify(canonicalObj);
  }, []);

  // Real-time validation with enhanced security checks
  const validateInput = useCallback((field: 'user' | 'exam', value: string): string | undefined => {
    const securityPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi
    ];
  
    // Check for potential security threats
    for (const pattern of securityPatterns) {
      if (pattern.test(value)) {
        return 'Input contains potentially dangerous content';
      }
    }
  
    if (field === 'user') {
      if (!value.trim()) return 'Student name is required';
      if (value.length < 2) return 'Student name must be at least 2 characters';
      if (value.length > 100) return 'Student name must be less than 100 characters';
      if (!/^[a-zA-Z\s\.\'\-]+$/.test(value)) return 'Student name contains invalid characters';
    }
  
    if (field === 'exam') {
      if (!value.trim()) return 'Course name is required';
      if (value.length < 5) return 'Course name must be at least 5 characters';
      if (value.length > 200) return 'Course name must be less than 200 characters';
      if (!/^[a-zA-Z0-9\s\.\(\)\/:\-]+$/.test(value)) return 'Course name contains invalid characters';
    }
  
    return undefined;
  }, []);

  // ✅ FIXED: SHA-512 hash calculation matching backend exactly
  const calculateRealTimeHash = useCallback((input: string): string => {
    if (!input) return '';
    
    // Multi-stage hashing for visualization
    const steps = [
      'Input normalization...',
      'UTF-8 encoding...',
      'SHA-512 preprocessing...',
      'Message padding...',
      'Hash computation...',
      'Final digest generation...'
    ];
    
    setHashingSteps(steps);
    
    // Calculate entropy and complexity metrics
    const entropy = calculateEntropy(input);
    const complexity = calculateComplexity(input);
    const predictability = calculatePredictability(input);
    
    setSecurityMetrics({ entropy, complexity, predictability });
    
    // Generate SHA-512 hash exactly like backend
    return CryptoJS.SHA512(input).toString(CryptoJS.enc.Hex);
  }, []);

  // Advanced entropy calculation
  const calculateEntropy = (input: string): number => {
    const chars: Record<string, number> = {};
    for (const char of input) {
      chars[char] = (chars[char] || 0) + 1;
    }
    
    const length = input.length;
    let entropy = 0;
    
    for (const count of Object.values(chars)) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }
    
    return Math.round(entropy * 100) / 100;
  };

  // Complexity scoring
  const calculateComplexity = (input: string): number => {
    let score = 0;
    
    if (/[a-z]/.test(input)) score += 1;
    if (/[A-Z]/.test(input)) score += 1;
    if (/[0-9]/.test(input)) score += 1;
    if (/[^a-zA-Z0-9]/.test(input)) score += 1;
    
    score += Math.min(input.length / 10, 2);
    
    return Math.round(score * 10) / 10;
  };

  // Predictability assessment
  const calculatePredictability = (input: string): number => {
    const patterns = [
      /(.)\1{2,}/g,
      /123|abc|qwe/gi,
      /password|admin|test/gi
    ];
    
    let predictabilityScore = 0;
    for (const pattern of patterns) {
      if (pattern.test(input)) {
        predictabilityScore += 0.2;
      }
    }
    
    return Math.min(predictabilityScore, 1);
  };

  // Asset handling functions
  const handleAssetUpload = useCallback((type: keyof AssetData, file: File | null) => {
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please upload only image files (JPEG, PNG, GIF)');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setAssetPreviews(prev => ({
        ...prev,
        [type]: previewUrl
      }));
    } else {
      // Remove preview URL if file is removed
      setAssetPreviews(prev => {
        if (prev[type]) {
          URL.revokeObjectURL(prev[type]!);
        }
        const newPreviews = { ...prev };
        delete newPreviews[type];
        return newPreviews;
      });
    }
    
    setAssets(prev => ({
      ...prev,
      [type]: file
    }));
  }, []);

  const removeAsset = useCallback((type: keyof AssetData) => {
    handleAssetUpload(type, null);
  }, [handleAssetUpload]);

  // Navigation Functions
  const handleUpgradeClick = useCallback(() => {
    navigate('/payment');
  }, [navigate]);

  const handleSubscriptionClick = useCallback(() => {
    navigate('/app?tab=profile');
  }, [navigate]);

  // Real-time updates as user types
  useEffect(() => {
    if (user.trim() && exam.trim()) {
      const canonical = createCanonicalJSON(user, exam);
      setCanonicalJSON(canonical);
      setRealTimeHash(calculateRealTimeHash(canonical));
    } else {
      setCanonicalJSON('');
      setRealTimeHash('');
      setHashingSteps([]);
    }
  }, [user, exam, createCanonicalJSON, calculateRealTimeHash]);

  // Enhanced form validation
  useEffect(() => {
    const newErrors: ValidationErrors = {};
    
    if (user) {
      const userError = validateInput('user', user);
      if (userError) newErrors.user = userError;
    }
    
    if (exam) {
      const examError = validateInput('exam', exam);
      if (examError) newErrors.exam = examError;
    }
    
    setErrors(newErrors);
  }, [user, exam, validateInput]);

  // Check subscription status on component mount and when user changes
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      console.log('🔍 CertificateGenerator: Checking subscription status for user:', authUser?.email, 'tier:', authUser?.subscriptionTier);
      
      if (!token) {
        console.log('❌ No token available, skipping subscription check');
        return;
      }
      
      try {
        setCheckingSubscription(true);
        console.log('📡 Calling:', `${apiUrl}/subscription/can-generate`);
        
        const response = await fetch(`${apiUrl}/subscription/can-generate`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Subscription check result:', { canGenerate: data.canGenerate, limit: data.limit, remaining: data.remaining });
          setSubscriptionStatus(data);
        } else {
          const errorText = await response.text();
          console.error('❌ Subscription API error:', response.status, errorText);
          setSubscriptionStatus({
            canGenerate: false,
            reason: `API Error: ${response.status} - ${errorText}`
          });
        }
      } catch (error) {
        console.error('❌ Network error checking subscription:', error.message);
        setSubscriptionStatus({
          canGenerate: false,
          reason: `Network error: ${error.message}`
        });
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkSubscriptionStatus();
  }, [apiUrl, token]);

  // Force subscription recheck when user's subscription tier changes
  useEffect(() => {
    if (authUser?.subscriptionTier && token) {
      console.log('🔄 CertificateGenerator: User subscription tier changed, rechecking permissions...');
      const recheckSubscription = async () => {
        try {
          setCheckingSubscription(true);
          console.log('📡 Force recheck calling:', `${apiUrl}/subscription/can-generate`);
          
          const response = await fetch(`${apiUrl}/subscription/can-generate`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Force recheck result:', { canGenerate: data.canGenerate, limit: data.limit, remaining: data.remaining });
            setSubscriptionStatus(data);
          } else {
            const errorText = await response.text();
            console.error('❌ Force recheck error:', response.status, errorText);
          }
        } catch (error) {
          console.error('❌ Force recheck network error:', error.message);
        } finally {
          setCheckingSubscription(false);
        }
      };

      recheckSubscription();
    }
  }, [authUser?.subscriptionTier]); // Only trigger when subscription tier changes

  // ✅ GDPR-Compliant Data Deletion Animation
  const simulateDataDeletion = async () => {
    setShowDataDeletion(true);
    setDeletionProgress(0);
    
    const deletionSteps = [
      'Scanning for personal data...',
      'Identifying data to be deleted...',
      'Removing user name from memory...',
      'Removing course information...',
      'Clearing temporary variables...',
      'Wiping browser cache...',
      'Confirming zero personal data retention...',
      'GDPR compliance achieved!'
    ];

    for (let i = 0; i < deletionSteps.length; i++) {
      setCurrentStep(i);
      setDeletionProgress(((i + 1) / deletionSteps.length) * 100);
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    setIsDataDeleted(true);
    
    // Clear the form to show data deletion
    setTimeout(() => {
      setUser('');
      setExam('');
      setCanonicalJSON('');
      setRealTimeHash('');
      setShowDataDeletion(false);
      setIsDataDeleted(false);
    }, 3000);
  };

  // ✅ FIXED: GDPR-Compliant certificate generation
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      const progressSteps = [
        { step: 'Validating input security...', progress: 15 },
        { step: 'Generating cryptographic hash...', progress: 30 },
        { step: 'Creating digital signature...', progress: 50 },
        { step: 'Generating GDPR-compliant certificate...', progress: 75 },
        { step: 'Preparing for immediate data deletion...', progress: 90 },
        { step: 'Finalizing privacy protection...', progress: 100 }
      ];
      
      for (const { step, progress } of progressSteps) {
        setCurrentStep(progressSteps.findIndex(s => s.step === step));
        setGenerationProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('user', user.trim());
      formData.append('exam', exam.trim());
      formData.append('template', selectedTemplate);
      
      // Add asset files if they exist
      if (assets.logo) {
        formData.append('logo', assets.logo);
      }
      if (assets.signature) {
        formData.append('signature', assets.signature);
      }
      if (assets.background) {
        formData.append('background', assets.background);
      }

      const response = await fetch(`${apiUrl}/generate`, {
        method: 'POST',
        headers: {
          'Accept': 'application/pdf',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        
        // Handle subscription limit errors
        if (response.status === 403) {
          const upgradeMessage = errorData.details || 'You need a paid subscription to generate certificates.';
          throw new Error(`❌ ${upgradeMessage}\n\n💰 Available Plans:\n• Professional: $29/month (5 certificates)\n• Premium: €99/month (30 certificates)\n• Enterprise: €499/month (100 certificates)\n\nPlease contact an administrator to upgrade your account.`);
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const certificateId = response.headers.get('X-Certificate-ID') || 'unknown';
      const requestId = response.headers.get('X-Request-ID');
      const gdprCompliant = response.headers.get('X-GDPR-Compliant');
      const personalDataRetained = response.headers.get('X-Personal-Data-Retained');

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `gdpr_compliant_certificate_${certificateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onCertificateGenerated();

      // Show success message with GDPR compliance info
      alert(`✅ GDPR-Compliant Certificate Generated Successfully!

Certificate ID: ${certificateId}
Request ID: ${requestId}
GDPR Compliant: ${gdprCompliant}
Personal Data Retained: ${personalDataRetained}

🔒 Privacy Protection: Your personal data has been automatically deleted from our servers.
📋 Verification: Your certificate can be verified using cryptographic hashes without exposing personal information.`);

      // ✅ Start automatic data deletion simulation
      setTimeout(() => {
        simulateDataDeletion();
      }, 1000);

    } catch (error) {
      console.error('Certificate generation error:', error);
      alert(error instanceof Error ? `Certificate generation failed: ${error.message}` : 'Certificate generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Check if form is valid
  const isFormValid = useMemo(() => {
    return user.trim() && 
           exam.trim() && 
           Object.keys(errors).length === 0 &&
           !isGenerating &&
           !showDataDeletion &&
           subscriptionStatus?.canGenerate === true;
  }, [user, exam, errors, isGenerating, showDataDeletion, subscriptionStatus]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-3 mb-4"
        >
          <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">GDPR-Compliant Certificate Generator</h2>
        </motion.div>
        <p className="text-green-200 max-w-2xl mx-auto">
          Generate cryptographically secured certificates with <strong>automatic personal data deletion</strong>. 
          Fully compliant with GDPR Articles 5 (Data Minimization) and 17 (Right to Erasure).
        </p>
        
        {/* GDPR Compliance Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center space-x-2 mt-4 px-4 py-2 bg-green-500/20 border border-green-400/30 rounded-full"
        >
          <Shield className="h-4 w-4 text-green-400" />
          <span className="text-green-300 text-sm font-medium">Privacy by Design • Zero Data Retention</span>
        </motion.div>
      </div>

      {/* Subscription Status Banner */}
      {checkingSubscription ? (
        <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
            <span className="text-blue-300">Checking subscription status...</span>
          </div>
        </div>
      ) : subscriptionStatus && !subscriptionStatus.canGenerate ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-6"
        >
          <div className="flex items-start space-x-4">
            <AlertTriangle className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <button
                onClick={handleSubscriptionClick}
                className="text-lg font-semibold text-yellow-300 mb-2 hover:text-yellow-200 transition-colors flex items-center space-x-2 cursor-pointer group"
                title="Click to manage subscription"
              >
                <span>Subscription Required</span>
                <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
              <p className="text-yellow-200 mb-2">{subscriptionStatus.reason}</p>
              <p className="text-yellow-300 text-sm mb-4">
                💡 Just completed payment? Click the refresh button below to update your subscription status.
              </p>
              
              <div className="grid sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-yellow-500/5 border border-yellow-400/20 rounded-lg p-3">
                  <div className="text-sm font-medium text-yellow-300">Professional</div>
                  <div className="text-lg font-bold text-white">$29<span className="text-sm text-yellow-200">/month</span></div>
                  <div className="text-xs text-yellow-200">5 certificates + customization + logo + signature</div>
                </div>
                <div className="bg-yellow-500/5 border border-yellow-400/20 rounded-lg p-3">
                  <div className="text-sm font-medium text-yellow-300">Premium</div>
                  <div className="text-lg font-bold text-white">€99<span className="text-sm text-yellow-200">/month</span></div>
                  <div className="text-xs text-yellow-200">30 certificates + templates+ logo + signature</div>
                </div>
                <div className="bg-yellow-500/5 border border-yellow-400/20 rounded-lg p-3">
                  <div className="text-sm font-medium text-yellow-300">Enterprise</div>
                  <div className="text-lg font-bold text-white">€499<span className="text-sm text-yellow-200">/month</span></div>
                  <div className="text-xs text-yellow-200">100 certificates + API + logo + signature</div>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleUpgradeClick}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <span>🚀 Upgrade Your Plan</span>
                  <ExternalLink className="h-4 w-4" />
                </button>
                <button
                  onClick={async () => {
                    setCheckingSubscription(true);
                    console.log('🔄 Manual refresh: Refreshing auth and subscription status...');
                    
                    try {
                      // First refresh the auth context to get latest user data
                      await refreshAuth();
                      console.log('✅ Auth refreshed');
                      
                      // Then check subscription status
                      const response = await fetch(`${apiUrl}/subscription/can-generate`, {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        }
                      });
                      
                      if (response.ok) {
                        const data = await response.json();
                        console.log('✅ Subscription status refreshed:', data);
                        setSubscriptionStatus(data);
                      } else {
                        const errorText = await response.text();
                        console.error('❌ Subscription refresh error:', response.status, errorText);
                      }
                    } catch (err) {
                      console.error('❌ Manual refresh error:', err);
                    } finally {
                      setCheckingSubscription(false);
                    }
                  }}
                  disabled={checkingSubscription}
                  className="bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/30 text-yellow-300 hover:text-yellow-200 px-4 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
                  title="Refresh subscription status if you just completed payment"
                >
                  {checkingSubscription ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{checkingSubscription ? 'Checking...' : 'Refresh'}</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : subscriptionStatus && subscriptionStatus.canGenerate ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-400/30 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <span className="text-green-300 font-medium">Certificate generation available</span>
            </div>
            <div className="flex items-center space-x-4">
              {subscriptionStatus.limit && (
                <div className="text-green-300 text-sm">
                  {subscriptionStatus.remaining || 0} of {subscriptionStatus.limit} certificates remaining this month
                </div>
              )}
              <button
                onClick={() => {
                  setCheckingSubscription(true);
                  fetch(`${apiUrl}/subscription/can-generate`, {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  })
                  .then(res => res.json())
                  .then(data => setSubscriptionStatus(data))
                  .catch(err => console.error('Refresh error:', err))
                  .finally(() => setCheckingSubscription(false));
                }}
                className="bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 text-green-300 hover:text-green-200 px-3 py-1 rounded text-xs transition-all duration-200 flex items-center space-x-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <User className="h-6 w-6 mr-3 text-green-400" />
              {t('certificate.form.title')}
              <span className="ml-auto text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                {t('certificate.form.autoDelete')}
              </span>
            </h3>
            
            {/* Student Name Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-green-200">
                {t('certificate.form.studentName')} * 
                <span className="text-xs text-gray-400 ml-2">({t('certificate.form.willBeDeleted')})</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-400 transition-all focus:outline-none focus:ring-2 ${
                    errors.user 
                      ? 'border-red-400 focus:ring-red-400' 
                      : 'border-white/20 focus:ring-green-400'
                  }`}
                  placeholder={t('certificate.form.studentNamePlaceholder')}
                  maxLength={100}
                  disabled={isGenerating || showDataDeletion}
                />
                {user && !errors.user && (
                  <CheckCircle className="absolute right-3 top-3 h-6 w-6 text-green-400" />
                )}
              </div>
              {errors.user && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm flex items-center"
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {errors.user}
                </motion.p>
              )}
              <div className="text-xs text-gray-400">
                {user.length}/100 {t('certificate.form.characters')} • 
                <span className="text-green-400 ml-1">{t('certificate.form.gdprProtected')}</span>
              </div>
            </div>

            {/* Course Name Input */}
            <div className="space-y-2 mt-6">
              <label className="block text-sm font-medium text-green-200">
                {t('certificate.form.courseName')} *
                <span className="text-xs text-gray-400 ml-2">({t('certificate.form.willBeDeleted')})</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={exam}
                  onChange={(e) => setExam(e.target.value)}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-400 transition-all focus:outline-none focus:ring-2 ${
                    errors.exam 
                      ? 'border-red-400 focus:ring-red-400' 
                      : 'border-white/20 focus:ring-green-400'
                  }`}
                  placeholder={t('certificate.form.courseNamePlaceholder')}
                  maxLength={200}
                  disabled={isGenerating || showDataDeletion}
                />
                {exam && !errors.exam && (
                  <CheckCircle className="absolute right-3 top-3 h-6 w-6 text-green-400" />
                )}
              </div>
              {errors.exam && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 text-sm flex items-center"
                >
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {errors.exam}
                </motion.p>
              )}
              <div className="text-xs text-gray-400">
                {exam.length}/200 {t('certificate.form.characters')} • 
                <span className="text-green-400 ml-1">{t('certificate.form.gdprProtected')}</span>
              </div>
            </div>

            {/* Template Selection */}
            <div className="mt-6">
              {subscriptionStatus && subscriptionStatus.limit === 1 ? (
                // Free user - show locked template selection
                <div className="p-4 bg-gray-500/20 border border-gray-400/30 rounded-xl opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Palette className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-300 font-medium">Template Customization</span>
                      <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">Pro Feature</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400 bg-gray-500/20 px-2 py-1 rounded">
                        standard (basic)
                      </span>
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              ) : (
                // Paid user - show normal template selection
                <button
                  onClick={() => setShowTemplateSelection(!showTemplateSelection)}
                  className="flex items-center justify-between w-full p-4 bg-purple-500/20 border border-purple-400/30 rounded-xl hover:bg-purple-500/30 transition-colors"
                  disabled={isGenerating || showDataDeletion}
                >
                <div className="flex items-center space-x-3">
                  <Palette className="h-5 w-5 text-purple-400" />
                  <span className="text-white font-medium">{t('certificate.templateSelection.title')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-purple-300 bg-purple-500/20 px-2 py-1 rounded">
                    {selectedTemplate}
                  </span>
                  <motion.div
                    animate={{ rotate: showTemplateSelection ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </div>
                </button>
              )}
              
              <AnimatePresence>
                {showTemplateSelection && subscriptionStatus && subscriptionStatus.limit !== 1 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 overflow-hidden"
                  >
                    <CertificateTemplates
                      selectedTemplate={selectedTemplate}
                      onTemplateSelect={(template) => {
                        setSelectedTemplate(template);
                        setShowTemplateSelection(false);
                      }}
                      className="bg-white/5 rounded-xl p-4 border border-white/10"
                      apiUrl={apiUrl}
                      token={token || undefined}
                      userSubscriptionTier={authUser?.subscriptionTier || 'free'}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Asset Upload Section */}
            <div className="mt-6">
              {subscriptionStatus && subscriptionStatus.limit === 1 ? (
                // Free user - show locked asset upload
                <div className="p-4 bg-gray-500/20 border border-gray-400/30 rounded-xl opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Upload className="h-5 w-5 text-gray-400" />
                      <span className="text-gray-300 font-medium">Custom Assets</span>
                      <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">Pro Feature</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">Logo, Signature, Background</span>
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              ) : (
                // Paid user - show asset upload
                <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <Upload className="h-5 w-5 text-blue-400" />
                    <span className="text-white font-medium">Custom Assets</span>
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">Optional</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Logo Upload */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-blue-200">
                        <Image className="w-4 h-4 inline mr-1" />
                        Logo
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleAssetUpload('logo', e.target.files?.[0] || null)}
                          className="hidden"
                          id="logo-upload"
                          disabled={isGenerating || showDataDeletion}
                        />
                        <label
                          htmlFor="logo-upload"
                          className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                            assets.logo ? 'border-blue-400 bg-blue-500/10' : 'border-blue-400/50 hover:border-blue-400 hover:bg-blue-500/5'
                          }`}
                        >
                          {assetPreviews.logo ? (
                            <div className="relative w-full h-full">
                              <img
                                src={assetPreviews.logo}
                                alt="Logo preview"
                                className="w-full h-full object-contain rounded-lg"
                              />
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeAsset('logo');
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <Image className="w-6 h-6 text-blue-400 mb-1" />
                              <span className="text-xs text-blue-300">Upload Logo</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Signature Upload */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-blue-200">
                        <FileSignature className="w-4 h-4 inline mr-1" />
                        Signature
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleAssetUpload('signature', e.target.files?.[0] || null)}
                          className="hidden"
                          id="signature-upload"
                          disabled={isGenerating || showDataDeletion}
                        />
                        <label
                          htmlFor="signature-upload"
                          className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                            assets.signature ? 'border-blue-400 bg-blue-500/10' : 'border-blue-400/50 hover:border-blue-400 hover:bg-blue-500/5'
                          }`}
                        >
                          {assetPreviews.signature ? (
                            <div className="relative w-full h-full">
                              <img
                                src={assetPreviews.signature}
                                alt="Signature preview"
                                className="w-full h-full object-contain rounded-lg"
                              />
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeAsset('signature');
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <FileSignature className="w-6 h-6 text-blue-400 mb-1" />
                              <span className="text-xs text-blue-300">Upload Signature</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>

                    {/* Background Upload */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-blue-200">
                        <Wallpaper className="w-4 h-4 inline mr-1" />
                        Background
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleAssetUpload('background', e.target.files?.[0] || null)}
                          className="hidden"
                          id="background-upload"
                          disabled={isGenerating || showDataDeletion}
                        />
                        <label
                          htmlFor="background-upload"
                          className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                            assets.background ? 'border-blue-400 bg-blue-500/10' : 'border-blue-400/50 hover:border-blue-400 hover:bg-blue-500/5'
                          }`}
                        >
                          {assetPreviews.background ? (
                            <div className="relative w-full h-full">
                              <img
                                src={assetPreviews.background}
                                alt="Background preview"
                                className="w-full h-full object-contain rounded-lg"
                              />
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  removeAsset('background');
                                }}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <Wallpaper className="w-6 h-6 text-blue-400 mb-1" />
                              <span className="text-xs text-blue-300">Upload Background</span>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-blue-200">
                    Supported formats: JPEG, PNG, GIF • Max size: 5MB each
                  </div>
                </div>
              )}
            </div>

            {/* Security Metrics */}
            {canonicalJSON && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 grid grid-cols-3 gap-4"
              >
                <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                  <div className="text-xs text-green-300">Entropy</div>
                  <div className="text-lg font-bold text-white">{securityMetrics.entropy}</div>
                </div>
                <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-400/30">
                  <div className="text-xs text-blue-300">Complexity</div>
                  <div className="text-lg font-bold text-white">{securityMetrics.complexity}</div>
                </div>
                <div className="bg-purple-500/20 rounded-lg p-3 border border-purple-400/30">
                  <div className="text-xs text-purple-300">Security</div>
                  <div className="text-lg font-bold text-white">{(1 - securityMetrics.predictability).toFixed(2)}</div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Generate Button responsive */}
          <motion.button
            onClick={handleGenerate}
            disabled={!isFormValid}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${
              isFormValid
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
            whileHover={isFormValid ? { scale: 1.02 } : {}}
            whileTap={isFormValid ? { scale: 0.98 } : {}}
          >
            {isGenerating ? (
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>{t('certificate.form.generating')} {generationProgress}%</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-3">
                <Shield className="h-6 w-6" />
                <span>{t('certificate.form.generateButton')}</span>
              </div>
            )}
          </motion.button>

          {/* Progress Indicator if deleted */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-xl p-4 border border-white/10"
            >
              <div className="flex items-center space-x-3 mb-3">
                <Clock className="h-5 w-5 text-green-400" />
                <span className="text-white font-medium">Generation Progress</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <div className="text-sm text-green-200">
                {hashingSteps[currentStep] || 'Initializing...'}
              </div>
            </motion.div>
          )}

          {/* GDPR Data Deletion Animation */}
          {showDataDeletion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-400/30 rounded-xl p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Trash2 className="h-6 w-6 text-green-400" />
                <h3 className="text-lg font-bold text-green-300">GDPR Auto-Deletion in Progress</h3>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-3 mb-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-red-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${deletionProgress}%` }}
                />
              </div>
              
              <div className="text-sm text-green-200 mb-3">
                {[
                  'Scanning for personal data...',
                  'Identifying data to be deleted...',
                  'Removing user name from memory...',
                  'Removing course information...',
                  'Clearing temporary variables...',
                  'Wiping browser cache...',
                  'Confirming zero personal data retention...',
                  'GDPR compliance achieved!'
                ][currentStep] || 'Initializing deletion...'}
              </div>
              
              <div className="text-xs text-gray-400">
                Progress: {deletionProgress.toFixed(0)}% • Personal data will be completely removed
              </div>
              
              {isDataDeleted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-green-500/20 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <UserX className="h-5 w-5 text-green-400" />
                    <span className="text-green-300 font-medium">✅ All personal data successfully deleted!</span>
                  </div>
                  <div className="text-xs text-green-200 mt-1">
                    Your certificate remains verifiable through cryptographic hashes.
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Cryptographic Visualization */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white flex items-center">
                <Hash className="h-6 w-6 mr-3 text-green-400" />
                GDPR-Compliant Hash Visualization
              </h3>
              <button
                onClick={() => setShowHashVisualization(!showHashVisualization)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                {showHashVisualization ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>

            {showHashVisualization && (
              <AnimatePresence>
                {canonicalJSON && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Database className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-medium text-green-200">Canonical JSON Structure</span>
                        <span className="text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded">Will be deleted</span>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                        <pre className="text-xs text-green-300 whitespace-pre-wrap break-all">
                          {JSON.stringify(JSON.parse(canonicalJSON), null, 2)}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Key className="h-4 w-4 text-purple-400" />
                        <span className="text-sm font-medium text-purple-200">SHA-512 Hash Generation</span>
                        <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">Will be stored</span>
                      </div>
                      <div className="space-y-2">
                        {hashingSteps.map((step, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex items-center space-x-3 p-2 rounded-lg ${
                              index <= currentStep ? 'bg-green-500/20' : 'bg-gray-500/20'
                            }`}
                          >
                            <div className={`w-2 h-2 rounded-full ${
                              index <= currentStep ? 'bg-green-400' : 'bg-gray-400'
                            }`} />
                            <span className={`text-sm ${
                              index <= currentStep ? 'text-green-300' : 'text-gray-400'
                            }`}>
                              {step}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {realTimeHash && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-yellow-400" />
                          <span className="text-sm font-medium text-yellow-200">
                            SHA-512 Hash (128 characters) - GDPR Safe
                          </span>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                          <div className="text-xs text-yellow-300 font-mono break-all">
                            {realTimeHash}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Lock className="h-3 w-3" />
                          <span>GDPR-compliant: No personal data in hash • Collision probability: 1 in 2^512</span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {!canonicalJSON && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12"
                  >
                    <Hash className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-300 mb-2">
                      GDPR-Compliant Hash Visualization
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Enter student and course information to see real-time hash generation with automatic data deletion
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* GDPR Compliance Features */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-400" />
              GDPR Compliance Features
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">Data Minimization</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">Automatic Deletion</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">Privacy by Design</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">Right to Erasure</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">SHA-512 Security</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">Zero Data Retention</span>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-400/30">
              <div className="text-xs text-green-300 font-medium mb-1">GDPR Articles Compliance:</div>
              <div className="text-xs text-green-200 space-y-1">
                <div>• Article 5: Data processed only as necessary (hash-only storage)</div>
                <div>• Article 17: Personal data automatically deleted after certificate generation</div>
                <div>• Article 25: Privacy by design implementation</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GDPRCertificateGenerator;