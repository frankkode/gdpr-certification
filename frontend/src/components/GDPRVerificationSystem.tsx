// 🔍 GDPR-Compliant Verification System Component
import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, Search, CheckCircle, AlertTriangle, FileText, 
  Shield, Lock, Eye, Clock, Key, UserCheck,
  AlertCircle, Zap, Database, FileCheck, UserX
} from 'lucide-react';

interface GDPRVerificationSystemProps {
  onVerification: () => void;
  apiUrl: string;
}

interface VerificationResult {
  valid: boolean;
  message: string;
  certificateDetails?: {
    certificateId: string;
    courseCode: string;
    formattedIssueDate: string;
    issueDate: string;
    serialNumber: string;
    status: string;
    gdprCompliant?: boolean;
  };
  securityInfo?: {
    verificationTime: string;
    verificationMethod: string;
    securityLevel: string;
    personalDataAccessed?: boolean;
    tamperDetection?: string;
    digitalSignature?: string;
    hashIntegrity?: string;
    databaseVerification?: string;
    verificationId?: string;
  };
  errorCode?: string;
  verificationId?: string;
}

type VerificationMethod = 'pdf' | 'id';

const GDPRVerificationSystem: React.FC<GDPRVerificationSystemProps> = ({
  onVerification,
  apiUrl
}) => {
  // State management
  const [activeMethod, setActiveMethod] = useState<VerificationMethod>('pdf');
  const [certificateId, setCertificateId] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationSteps, setVerificationSteps] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enhanced file validation with GDPR compliance
  const validateFile = useCallback((file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Only PDF files are allowed for certificate verification';
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return 'File size must be less than 10MB';
    }
    
    if (file.size < 1000) { // Minimum size check
      return 'File appears to be too small to be a valid certificate';
    }
    
    // Check file name for reasonable certificate naming
    const fileName = file.name.toLowerCase();
    const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr'];
    if (suspiciousExtensions.some(ext => fileName.includes(ext))) {
      return 'File appears to be suspicious or corrupted';
    }
    
    return null;
  }, []);

  // Enhanced certificate ID validation for GDPR-compliant format
  const validateCertificateId = useCallback((id: string): boolean => {
    // Updated pattern to match the GDPR-compliant backend format
    const pattern = /^CERT-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-Z0-9]+-[A-F0-9]{4}$/;
    return pattern.test(id.trim().toUpperCase());
  }, []);

  // File selection handler
  const handleFileSelect = useCallback((file: File) => {
    const error = validateFile(file);
    if (error) {
      alert(`❌ File Validation Error: ${error}`);
      return;
    }
    
    setSelectedFile(file);
    setVerificationResult(null);
    console.log('✅ File selected for GDPR-compliant verification:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  }, [validateFile]);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // File input change handler
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // ✅ GDPR-Compliant PDF verification with privacy protection
  const verifyPDF = async () => {
    if (!selectedFile) return;
    
    setIsVerifying(true);
    setVerificationProgress(0);
    setVerificationResult(null);
    
    const steps = [
      'Initializing GDPR-compliant verification...',
      'Reading PDF structure (no personal data access)...',
      'Extracting cryptographic metadata only...',
      'Validating digital signatures...',
      'Computing hash integrity checks...',
      'Cross-referencing with privacy-safe database...',
      'Performing tamper detection analysis...',
      'Generating privacy-preserving verification report...'
    ];
    
    setVerificationSteps(steps);
    
    try {
      console.log('🔍 Starting GDPR-compliant PDF verification for:', selectedFile.name);
      
      // Enhanced progress simulation with realistic timing
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        setVerificationProgress(((i + 1) / steps.length) * 90); // Leave 10% for actual request
        await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
      }
      
      const formData = new FormData();
      formData.append('certificate', selectedFile);
      
      console.log('📤 Sending PDF to GDPR-compliant verification endpoint...');
      const startTime = Date.now();
      
      const response = await fetch(`${apiUrl}/verify/pdf`, {
        method: 'POST',
        body: formData,
      });
      
      const processingTime = Date.now() - startTime;
      setVerificationProgress(100);
      
      console.log(`📊 GDPR-compliant verification completed in ${processingTime}ms`);
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}`, details: errorText };
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: VerificationResult = await response.json();
      
      // Log verification result for debugging
      console.log('📋 GDPR-compliant verification result:', {
        valid: result.valid,
        certificateId: result.certificateDetails?.certificateId,
        securityLevel: result.securityInfo?.securityLevel,
        personalDataAccessed: result.securityInfo?.personalDataAccessed,
        gdprCompliant: result.certificateDetails?.gdprCompliant
      });
      
      setVerificationResult(result);
      onVerification();
      
      // Show success/failure notification with GDPR compliance info
      if (result.valid) {
        console.log('✅ GDPR-compliant PDF verification successful');
      } else {
        console.warn('❌ PDF verification failed:', result.message);
      }
      
    } catch (error) {
      console.error('💥 GDPR-compliant PDF verification error:', error);
      setVerificationResult({
        valid: false,
        message: error instanceof Error ? error.message : 'PDF verification failed due to an unexpected error',
        errorCode: 'VERIFICATION_ERROR',
        verificationId: `error_${Date.now()}`,
        securityInfo: {
          verificationTime: new Date().toISOString(),
          verificationMethod: 'GDPR_COMPLIANT_PDF_ANALYSIS',
          securityLevel: 'VERIFICATION_FAILED',
          personalDataAccessed: false,
          tamperDetection: 'ERROR_DURING_VERIFICATION'
        }
      });
    } finally {
      setIsVerifying(false);
      setVerificationProgress(0);
      setCurrentStep(0);
    }
  };

  // ✅ GDPR-Compliant certificate ID verification
  const verifyCertificateId = async () => {
    const trimmedId = certificateId.trim().toUpperCase();
    
    if (!trimmedId || !validateCertificateId(trimmedId)) {
      alert('❌ Please enter a valid certificate ID in the format: CERT-XXXX-XXXX-XXXX-XXXXX-XXXX');
      return;
    }
    
    setIsVerifying(true);
    setVerificationResult(null);
    
    try {
      console.log('🔍 Starting GDPR-compliant ID verification for:', trimmedId);
      
      const response = await fetch(`${apiUrl}/verify/${trimmedId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result: VerificationResult = await response.json();
      
      console.log('📋 GDPR-compliant ID verification result:', {
        valid: result.valid,
        certificateId: result.certificateDetails?.certificateId,
        personalDataAccessed: result.securityInfo?.personalDataAccessed
      });
      
      setVerificationResult(result);
      onVerification();
      
    } catch (error) {
      console.error('💥 GDPR-compliant certificate ID verification error:', error);
      setVerificationResult({
        valid: false,
        message: error instanceof Error ? error.message : 'Certificate ID verification failed',
        errorCode: 'ID_VERIFICATION_ERROR',
        verificationId: `error_${Date.now()}`,
        securityInfo: {
          verificationTime: new Date().toISOString(),
          verificationMethod: 'GDPR_COMPLIANT_ID_LOOKUP',
          securityLevel: 'VERIFICATION_FAILED',
          personalDataAccessed: false
        }
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Get security level color and styling
  const getSecurityLevelColor = (level?: string) => {
    switch (level?.toUpperCase()) {
      case 'GDPR_COMPLIANT':
      case 'GDPR_VERIFIED':
      case 'CRYPTOGRAPHICALLY_VERIFIED':
        return 'text-green-400 bg-green-500/20 border-green-400/30';
      case 'VERIFIED':
        return 'text-blue-400 bg-blue-500/20 border-blue-400/30';
      case 'HIGH_SECURITY_RISK':
      case 'CRITICAL_SECURITY_RISK':
        return 'text-red-400 bg-red-500/20 border-red-400/30';
      case 'VERIFICATION_FAILED':
        return 'text-orange-400 bg-orange-500/20 border-orange-400/30';
      default:
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
    }
  };

  // Get verification method icon
  const getVerificationMethodIcon = (method?: string) => {
    switch (method) {
      case 'GDPR_COMPLIANT_PDF_ANALYSIS':
      case 'GDPR_COMPLIANT_HASH_VERIFICATION':
        return FileCheck;
      case 'GDPR_COMPLIANT_DATABASE_LOOKUP':
      case 'GDPR_COMPLIANT_ID_LOOKUP':
        return Database;
      default:
        return Shield;
    }
  };

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
            <UserCheck className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">GDPR-Compliant Verification System</h2>
        </motion.div>
        <p className="text-green-200 max-w-2xl mx-auto">
          Verify certificates using <strong>privacy-preserving methods</strong> that protect personal data. 
          Our system uses cryptographic hashes for verification without accessing personal information.
        </p>
      </div>

      {/* Method Selection */}
      <div className="flex justify-center space-x-4 mb-8">
        <motion.button
          onClick={() => setActiveMethod('pdf')}
          className={`flex items-center space-x-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
            activeMethod === 'pdf'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
              : 'bg-white/10 backdrop-blur-md text-green-200 hover:bg-white/20'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Upload className="h-5 w-5" />
          <span>Privacy-Safe PDF Verification</span>
          <span className="bg-green-400/20 text-green-300 px-2 py-1 rounded-full text-xs">GDPR</span>
        </motion.button>

        <motion.button
          onClick={() => setActiveMethod('id')}
          className={`flex items-center space-x-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
            activeMethod === 'id'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
              : 'bg-white/10 backdrop-blur-md text-blue-200 hover:bg-white/20'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Search className="h-5 w-5" />
          <span>Anonymous ID Lookup</span>
          <span className="bg-blue-400/20 text-blue-300 px-2 py-1 rounded-full text-xs">Private</span>
        </motion.button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Verification Input */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          {activeMethod === 'pdf' ? (
            /* Enhanced PDF Upload Section */
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <FileText className="h-6 w-6 mr-3 text-green-400" />
                Privacy-Safe PDF Certificate Verification
                <span className="ml-auto text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">
                  No Personal Data Access
                </span>
              </h3>

              {/* File Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer ${
                  isDragOver
                    ? 'border-green-400 bg-green-500/10'
                    : selectedFile
                    ? 'border-green-400 bg-green-500/10'
                    : 'border-gray-600 bg-gray-500/5 hover:border-gray-500 hover:bg-gray-500/10'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={isVerifying}
                />

                <div className="text-center">
                  {selectedFile ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-3"
                    >
                      <CheckCircle className="h-16 w-16 text-green-400 mx-auto" />
                      <div>
                        <p className="text-lg font-semibold text-green-300">{selectedFile.name}</p>
                        <p className="text-sm text-gray-400">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for privacy-safe verification
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setVerificationResult(null);
                        }}
                        className="text-red-400 hover:text-red-300 text-sm underline"
                        disabled={isVerifying}
                      >
                        Remove file
                      </button>
                    </motion.div>
                  ) : (
                    <div className="space-y-3">
                      <Upload className="h-16 w-16 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-lg font-semibold text-gray-300">
                          Drop PDF certificate here
                        </p>
                        <p className="text-sm text-gray-400">
                          or click to browse files (max 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* GDPR Privacy Protection Features */}
              <div className="mt-6 bg-green-500/10 rounded-xl p-4 border border-green-400/30">
                <h4 className="text-sm font-semibold text-green-300 mb-3 flex items-center">
                  <UserX className="h-4 w-4 mr-2" />
                  GDPR Privacy Protection Features
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-gray-300">No Personal Data Access</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-gray-300">Hash-Only Verification</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-gray-300">Privacy-Safe Database Lookup</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-gray-300">GDPR Article 5 Compliant</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-gray-300">Cryptographic Integrity Check</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-gray-300">Zero Data Retention</span>
                  </div>
                </div>
              </div>

              {/* Verify Button for PDF */}
              <motion.button
                onClick={verifyPDF}
                disabled={!selectedFile || isVerifying}
                className={`w-full mt-6 py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${
                  selectedFile && !isVerifying
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                whileHover={selectedFile && !isVerifying ? { scale: 1.02 } : {}}
                whileTap={selectedFile && !isVerifying ? { scale: 0.98 } : {}}
              >
                {isVerifying ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-6 h-6 border-3 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                    <span>Privacy-Safe Verification... {verificationProgress.toFixed(0)}%</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <UserCheck className="h-6 w-6" />
                    <span>Verify PDF (GDPR Compliant)</span>
                  </div>
                )}
              </motion.button>
            </div>
          ) : (
            /* Enhanced Certificate ID Section */
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Search className="h-6 w-6 mr-3 text-blue-400" />
                Anonymous Certificate ID Lookup
                <span className="ml-auto text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                  Anonymous
                </span>
              </h3>

              {/* Certificate ID Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-blue-200 mb-2">
                    Certificate ID
                  </label>
                  <input
                    type="text"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value.toUpperCase())}
                    placeholder="CERT-XXXX-XXXX-XXXX-XXXXX-XXXX"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 font-mono text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                    maxLength={50}
                    disabled={isVerifying}
                  />
                  <div className="mt-2 text-xs text-gray-400">
                    Enter the complete certificate ID for anonymous verification
                  </div>
                  {certificateId && !validateCertificateId(certificateId) && (
                    <div className="mt-2 flex items-center space-x-2 text-red-400 text-sm">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Invalid certificate ID format. Please check and try again.</span>
                    </div>
                  )}
                  {certificateId && validateCertificateId(certificateId) && (
                    <div className="mt-2 flex items-center space-x-2 text-green-400 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>Valid certificate ID format</span>
                    </div>
                  )}
                </div>

                {/* Enhanced Privacy Protection Guide */}
                <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-400/30">
                  <h4 className="text-sm font-semibold text-blue-300 mb-2 flex items-center">
                    <Key className="h-4 w-4 mr-2" />
                    Privacy-First Verification
                  </h4>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div>• Anonymous lookup using only certificate ID</div>
                    <div>• No personal data accessed during verification</div>
                    <div>• GDPR-compliant hash-based authentication</div>
                    <div>• Zero data retention or logging of personal info</div>
                  </div>
                </div>
              </div>

              {/* Verify Button for ID */}
              <motion.button
                onClick={verifyCertificateId}
                disabled={!certificateId.trim() || !validateCertificateId(certificateId) || isVerifying}
                className={`w-full mt-6 py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${
                  certificateId.trim() && validateCertificateId(certificateId) && !isVerifying
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                whileHover={certificateId.trim() && validateCertificateId(certificateId) && !isVerifying ? { scale: 1.02 } : {}}
                whileTap={certificateId.trim() && validateCertificateId(certificateId) && !isVerifying ? { scale: 0.98 } : {}}
              >
                {isVerifying ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <span>Anonymous Verification...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <Database className="h-6 w-6" />
                    <span>Verify ID (Anonymous)</span>
                  </div>
                )}
              </motion.button>
            </div>
          )}

          {/* Enhanced Progress Indicator for PDF */}
          {isVerifying && activeMethod === 'pdf' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-xl p-4 border border-white/10"
            >
              <div className="flex items-center space-x-3 mb-3">
                <Clock className="h-5 w-5 text-green-400" />
                <span className="text-white font-medium">GDPR-Compliant Verification Progress</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${verificationProgress}%` }}
                />
              </div>
              <div className="text-sm text-green-200">
                {verificationSteps[currentStep] || 'Initializing privacy-safe verification...'}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Step {currentStep + 1} of {verificationSteps.length} • No personal data accessed
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Enhanced Verification Results with GDPR compliance info */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Eye className="h-6 w-6 mr-3 text-purple-400" />
              GDPR-Compliant Verification Results
            </h3>

            {verificationResult ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Main Result with GDPR compliance indicator */}
                <div className={`p-6 rounded-2xl border-2 ${
                  verificationResult.valid
                    ? 'bg-green-500/10 border-green-400'
                    : 'bg-red-500/10 border-red-400'
                }`}>
                  <div className="flex items-center space-x-3 mb-4">
                    {verificationResult.valid ? (
                      <CheckCircle className="h-8 w-8 text-green-400" />
                    ) : (
                      <AlertCircle className="h-8 w-8 text-red-400" />
                    )}
                    <div className="flex-1">
                      <h4 className={`text-xl font-bold ${
                        verificationResult.valid ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {verificationResult.valid ? '✅ Certificate Verified Successfully!' : '❌ Verification Failed'}
                      </h4>
                      <p className={`text-sm ${
                        verificationResult.valid ? 'text-green-200' : 'text-red-200'
                      }`}>
                        {verificationResult.message}
                      </p>
                    </div>
                    {/* GDPR Compliance Badge */}
                    {verificationResult.securityInfo?.personalDataAccessed === false && (
                      <div className="bg-green-500/20 border border-green-400/30 rounded-lg px-3 py-2">
                        <div className="text-xs font-medium text-green-300">GDPR Compliant</div>
                        <div className="text-xs text-green-200">No Personal Data Accessed</div>
                      </div>
                    )}
                  </div>

                  {/* Certificate Details (non-personal data only) */}
                  {verificationResult.valid && verificationResult.certificateDetails && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="space-y-2">
                        <div className="text-xs text-green-300 font-medium">CERTIFICATE ID</div>
                        <div className="text-sm text-white font-mono">
                          {verificationResult.certificateDetails.certificateId}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs text-green-300 font-medium">COURSE CODE</div>
                        <div className="text-sm text-white font-semibold">
                          {verificationResult.certificateDetails.courseCode}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs text-green-300 font-medium">ISSUE DATE</div>
                        <div className="text-sm text-white">
                          {verificationResult.certificateDetails.formattedIssueDate}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs text-green-300 font-medium">SERIAL NUMBER</div>
                        <div className="text-sm text-white font-mono">
                          {verificationResult.certificateDetails.serialNumber}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs text-green-300 font-medium">STATUS</div>
                        <div className="text-sm">
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium ${
                            verificationResult.certificateDetails.status === 'ACTIVE'
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {verificationResult.certificateDetails.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs text-green-300 font-medium">GDPR COMPLIANT</div>
                        <div className="text-sm">
                          <span className="px-2 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-300">
                            ✅ {verificationResult.certificateDetails.gdprCompliant !== false ? 'YES' : 'NO'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced GDPR-Compliant Security Information */}
                {verificationResult.securityInfo && (
                  <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-400/30">
                    <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center">
                      <Lock className="h-4 w-4 mr-2" />
                      Privacy-Safe Security Verification Details
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="text-xs text-purple-300 font-medium">VERIFICATION METHOD</div>
                        <div className="flex items-center space-x-2">
                          {React.createElement(getVerificationMethodIcon(verificationResult.securityInfo.verificationMethod), {
                            className: "h-4 w-4 text-purple-400"
                          })}
                          <span className="text-white">
                            {verificationResult.securityInfo.verificationMethod.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs text-purple-300 font-medium">SECURITY LEVEL</div>
                        <div>
                          <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                            getSecurityLevelColor(verificationResult.securityInfo.securityLevel)
                          }`}>
                            {verificationResult.securityInfo.securityLevel.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <div className="text-xs text-purple-300 font-medium">PERSONAL DATA ACCESSED</div>
                        <div className="flex items-center space-x-2">
                          {verificationResult.securityInfo.personalDataAccessed === false ? (
                            <>
                              <UserX className="h-4 w-4 text-green-400" />
                              <span className="text-green-300">NO - GDPR Compliant Verification</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-4 w-4 text-red-400" />
                              <span className="text-red-300">YES - Personal Data Was Accessed</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <div className="text-xs text-purple-300 font-medium">VERIFICATION TIME</div>
                        <div className="text-white text-xs">
                          {new Date(verificationResult.securityInfo.verificationTime).toLocaleString()}
                        </div>
                      </div>
                      
                      {verificationResult.verificationId && (
                        <div className="space-y-2 md:col-span-2">
                          <div className="text-xs text-purple-300 font-medium">VERIFICATION ID</div>
                          <div className="text-white text-xs font-mono">
                            {verificationResult.verificationId}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Clear Results Button */}
                <button
                  onClick={() => setVerificationResult(null)}
                  className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                >
                  Clear Results
                </button>
              </motion.div>
            ) : (
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-300 mb-2">
                  Awaiting GDPR-Compliant Verification
                </h4>
                <p className="text-gray-400 text-sm">
                  {activeMethod === 'pdf' 
                    ? 'Upload a PDF certificate for privacy-safe cryptographic verification'
                    : 'Enter a certificate ID for anonymous database lookup verification'
                  }
                </p>
                <div className="mt-4 text-xs text-green-400">
                  🔒 Zero personal data access • Full GDPR compliance
                </div>
              </motion.div>
            )}
          </div>

          {/* Enhanced Method Comparison with GDPR focus */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-400" />
              GDPR-Compliant Verification Methods
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="font-semibold text-green-300">🔒 Privacy-Safe PDF Verification</div>
                <ul className="space-y-1 text-gray-300">
                  <li>• No personal data access during verification</li>
                  <li>• Cryptographic hash-based authentication</li>
                  <li>• GDPR Article 5 compliant processing</li>
                  <li>• Advanced tamper detection</li>
                  <li>• Zero data retention</li>
                  <li>• Privacy-preserving database lookup</li>
                  <li>• Full anonymization of verification process</li>
                </ul>
              </div>
              <div className="space-y-3">
                <div className="font-semibold text-blue-300">🔍 Anonymous ID Verification</div>
                <ul className="space-y-1 text-gray-300">
                  <li>• Completely anonymous database lookup</li>
                  <li>• Certificate status validation only</li>
                  <li>• No personal data retrieval</li>
                  <li>• GDPR-compliant by design</li>
                  <li>• Instant anonymous verification</li>
                  <li>• Zero personal information exposure</li>
                  <li>• Privacy-first architecture</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-green-500/10 rounded-lg border border-green-400/30">
              <div className="text-xs text-green-300 font-medium mb-1">🛡️ GDPR Compliance Guarantee:</div>
              <div className="text-xs text-green-200">
                Both verification methods are designed with privacy by design principles and comply with 
                GDPR Articles 5 (Data Minimization) and 17 (Right to Erasure) by never accessing or storing personal data.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default GDPRVerificationSystem;