// 🔍 Professional Dual Verification System Component - Enhanced Version
import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, Search, CheckCircle, AlertTriangle, FileText, 
  Shield, Lock, Eye, Clock, Key,
  AlertCircle, Zap, Database, Scan, FileCheck
} from 'lucide-react';

interface DualVerificationSystemProps {
  onVerification: () => void;
  apiUrl: string;
}

interface VerificationResult {
  valid: boolean;
  message: string;
  certificateDetails?: {
    certificateId: string;
    studentName: string;
    courseName: string;
    formattedIssueDate: string;
    serialNumber: string;
    status: string;
    securityLevel?: string;
    verificationMethod: string;
  };
  securityInfo?: {
    verificationTime: string;
    verificationMethod: string;
    securityLevel: string;
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

const DualVerificationSystem: React.FC<DualVerificationSystemProps> = ({
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

  // Enhanced file validation
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

  // Enhanced certificate ID validation
  const validateCertificateId = useCallback((id: string): boolean => {
    // Updated pattern to match the fixed backend format
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
    console.log('✅ File selected for verification:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)} MB)`);
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

  // Enhanced PDF verification with detailed progress tracking
  const verifyPDF = async () => {
    if (!selectedFile) return;
    
    setIsVerifying(true);
    setVerificationProgress(0);
    setVerificationResult(null);
    
    const steps = [
      'Initializing security scanner...',
      'Reading PDF file structure...',
      'Extracting embedded metadata...',
      'Validating cryptographic signatures...',
      'Computing integrity hashes...',
      'Cross-referencing with database...',
      'Performing tamper detection analysis...',
      'Generating comprehensive verification report...'
    ];
    
    setVerificationSteps(steps);
    
    try {
      console.log('🔍 Starting enhanced PDF verification for:', selectedFile.name);
      
      // Enhanced progress simulation with realistic timing
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(i);
        setVerificationProgress(((i + 1) / steps.length) * 90); // Leave 10% for actual request
        await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400));
      }
      
      const formData = new FormData();
      formData.append('certificate', selectedFile);
      
      console.log('📤 Sending PDF to verification endpoint...');
      const startTime = Date.now();
      
      const response = await fetch(`${apiUrl}/verify/pdf`, {
        method: 'POST',
        body: formData,
      });
      
      const processingTime = Date.now() - startTime;
      setVerificationProgress(100);
      
      console.log(`📊 Verification completed in ${processingTime}ms`);
      
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
      console.log('📋 Verification result:', {
        valid: result.valid,
        certificateId: result.certificateDetails?.certificateId,
        securityLevel: result.securityInfo?.securityLevel,
        verificationMethod: result.securityInfo?.verificationMethod
      });
      
      setVerificationResult(result);
      onVerification();
      
      // Show success/failure notification
      if (result.valid) {
        console.log('✅ PDF verification successful');
      } else {
        console.warn('❌ PDF verification failed:', result.message);
      }
      
    } catch (error) {
      console.error('💥 PDF verification error:', error);
      setVerificationResult({
        valid: false,
        message: error instanceof Error ? error.message : 'PDF verification failed due to an unexpected error',
        errorCode: 'VERIFICATION_ERROR',
        verificationId: `error_${Date.now()}`,
        securityInfo: {
          verificationTime: new Date().toISOString(),
          verificationMethod: 'PDF_ENHANCED_ANALYSIS',
          securityLevel: 'VERIFICATION_FAILED',
          tamperDetection: 'ERROR_DURING_VERIFICATION'
        }
      });
    } finally {
      setIsVerifying(false);
      setVerificationProgress(0);
      setCurrentStep(0);
    }
  };

  // Enhanced certificate ID verification
  const verifyCertificateId = async () => {
    const trimmedId = certificateId.trim().toUpperCase();
    
    if (!trimmedId || !validateCertificateId(trimmedId)) {
      alert('❌ Please enter a valid certificate ID in the format: CERT-XXXX-XXXX-XXXX-XXXXX-XXXX');
      return;
    }
    
    setIsVerifying(true);
    setVerificationResult(null);
    
    try {
      console.log('🔍 Starting ID verification for:', trimmedId);
      
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
      
      console.log('📋 ID verification result:', {
        valid: result.valid,
        certificateId: result.certificateDetails?.certificateId
      });
      
      setVerificationResult(result);
      onVerification();
      
    } catch (error) {
      console.error('💥 Certificate ID verification error:', error);
      setVerificationResult({
        valid: false,
        message: error instanceof Error ? error.message : 'Certificate ID verification failed',
        errorCode: 'ID_VERIFICATION_ERROR',
        verificationId: `error_${Date.now()}`
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Get security level color and styling
  const getSecurityLevelColor = (level?: string) => {
    switch (level?.toUpperCase()) {
      case 'PROFESSIONAL_GRADE':
      case 'MILITARY_GRADE':
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
      case 'PDF_ENHANCED_ANALYSIS':
      case 'PDF_CRYPTOGRAPHIC_ANALYSIS':
        return FileCheck;
      case 'DATABASE_LOOKUP':
      case 'ID_LOOKUP':
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
          <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
            <Scan className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Professional Verification System</h2>
        </motion.div>
        <p className="text-purple-200 max-w-2xl mx-auto">
          Verify certificates using two independent methods: comprehensive PDF analysis with 
          enhanced cryptographic validation, or direct database lookup using certificate ID.
        </p>
      </div>

      {/* Method Selection */}
      <div className="flex justify-center space-x-4 mb-8">
        <motion.button
          onClick={() => setActiveMethod('pdf')}
          className={`flex items-center space-x-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
            activeMethod === 'pdf'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
              : 'bg-white/10 backdrop-blur-md text-blue-200 hover:bg-white/20'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Upload className="h-5 w-5" />
          <span>Enhanced PDF Verification</span>
        </motion.button>

        <motion.button
          onClick={() => setActiveMethod('id')}
          className={`flex items-center space-x-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
            activeMethod === 'id'
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
              : 'bg-white/10 backdrop-blur-md text-green-200 hover:bg-white/20'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Search className="h-5 w-5" />
          <span>Certificate ID Lookup</span>
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
                <FileText className="h-6 w-6 mr-3 text-blue-400" />
                Enhanced PDF Certificate Verification
              </h3>

              {/* File Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 cursor-pointer ${
                  isDragOver
                    ? 'border-blue-400 bg-blue-500/10'
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
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for enhanced verification
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

              {/* Enhanced Security Features for PDF */}
              <div className="mt-6 bg-blue-500/10 rounded-xl p-4 border border-blue-400/30">
                <h4 className="text-sm font-semibold text-blue-300 mb-3 flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Enhanced PDF Verification Features
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-gray-300">Multiple Metadata Extraction</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-gray-300">SHA-512 Hash Verification</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-gray-300">Digital Signature Validation</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-gray-300">Tamper Detection Analysis</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-gray-300">Database Cross-Reference</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-3 w-3 text-green-400" />
                    <span className="text-gray-300">Professional Grade Security</span>
                  </div>
                </div>
              </div>

              {/* Verify Button for PDF */}
              <motion.button
                onClick={verifyPDF}
                disabled={!selectedFile || isVerifying}
                className={`w-full mt-6 py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${
                  selectedFile && !isVerifying
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                whileHover={selectedFile && !isVerifying ? { scale: 1.02 } : {}}
                whileTap={selectedFile && !isVerifying ? { scale: 0.98 } : {}}
              >
                {isVerifying ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <span>Verifying PDF... {verificationProgress.toFixed(0)}%</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <FileCheck className="h-6 w-6" />
                    <span>Verify PDF Certificate</span>
                  </div>
                )}
              </motion.button>
            </div>
          ) : (
            /* Enhanced Certificate ID Section */
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Search className="h-6 w-6 mr-3 text-green-400" />
                Certificate ID Database Lookup
              </h3>

              {/* Certificate ID Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-green-200 mb-2">
                    Certificate ID
                  </label>
                  <input
                    type="text"
                    value={certificateId}
                    onChange={(e) => setCertificateId(e.target.value.toUpperCase())}
                    placeholder="CERT-XXXX-XXXX-XXXX-XXXXX-XXXX"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 font-mono text-sm transition-all focus:outline-none focus:ring-2 focus:ring-green-400"
                    maxLength={50}
                    disabled={isVerifying}
                  />
                  <div className="mt-2 text-xs text-gray-400">
                    Enter the complete certificate ID from your certificate document
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

                {/* Enhanced ID Format Guide */}
                <div className="bg-green-500/10 rounded-xl p-4 border border-green-400/30">
                  <h4 className="text-sm font-semibold text-green-300 mb-2 flex items-center">
                    <Key className="h-4 w-4 mr-2" />
                    Certificate ID Format Guide
                  </h4>
                  <div className="text-xs text-gray-300 space-y-1">
                    <div>• Standard Format: CERT-XXXX-XXXX-XXXX-XXXXX-XXXX</div>
                    <div>• Example: CERT-A1B2-C3D4-E5F6-G7H8I-J9K0</div>
                    <div>• Location: Found on your certificate document</div>
                    <div>• Case: Automatically converted to uppercase</div>
                  </div>
                </div>
              </div>

              {/* Verify Button for ID */}
              <motion.button
                onClick={verifyCertificateId}
                disabled={!certificateId.trim() || !validateCertificateId(certificateId) || isVerifying}
                className={`w-full mt-6 py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${
                  certificateId.trim() && validateCertificateId(certificateId) && !isVerifying
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
                whileHover={certificateId.trim() && validateCertificateId(certificateId) && !isVerifying ? { scale: 1.02 } : {}}
                whileTap={certificateId.trim() && validateCertificateId(certificateId) && !isVerifying ? { scale: 0.98 } : {}}
              >
                {isVerifying ? (
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-6 h-6 border-3 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                    <span>Verifying Certificate ID...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <Database className="h-6 w-6" />
                    <span>Verify Certificate ID</span>
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
                <Clock className="h-5 w-5 text-blue-400" />
                <span className="text-white font-medium">Enhanced Verification Progress</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${verificationProgress}%` }}
                />
              </div>
              <div className="text-sm text-blue-200">
                {verificationSteps[currentStep] || 'Initializing verification process...'}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Step {currentStep + 1} of {verificationSteps.length}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Enhanced Verification Results */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <Eye className="h-6 w-6 mr-3 text-purple-400" />
              Verification Results
            </h3>

            {verificationResult ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Main Result */}
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
                    <div>
                      <h4 className={`text-xl font-bold ${
                        verificationResult.valid ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {verificationResult.valid ? 'Certificate Verified Successfully!' : 'Verification Failed'}
                      </h4>
                      <p className={`text-sm ${
                        verificationResult.valid ? 'text-green-200' : 'text-red-200'
                      }`}>
                        {verificationResult.message}
                      </p>
                    </div>
                  </div>

                  {/* Certificate Details */}
                  {verificationResult.valid && verificationResult.certificateDetails && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="space-y-2">
                        <div className="text-xs text-green-300 font-medium">STUDENT NAME</div>
                        <div className="text-sm text-white font-semibold">
                          {verificationResult.certificateDetails.studentName}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs text-green-300 font-medium">COURSE NAME</div>
                        <div className="text-sm text-white font-semibold">
                          {verificationResult.certificateDetails.courseName}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs text-green-300 font-medium">CERTIFICATE ID</div>
                        <div className="text-sm text-white font-mono">
                          {verificationResult.certificateDetails.certificateId}
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
                    </div>
                  )}
                </div>

                {/* Enhanced Security Information */}
                {verificationResult.securityInfo && (
                  <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-400/30">
                    <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center">
                      <Lock className="h-4 w-4 mr-2" />
                      Security Verification Details
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
                      
                      {verificationResult.securityInfo.tamperDetection && (
                        <div className="space-y-2">
                          <div className="text-xs text-purple-300 font-medium">TAMPER DETECTION</div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-green-300">
                              {verificationResult.securityInfo.tamperDetection.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {verificationResult.securityInfo.digitalSignature && (
                        <div className="space-y-2">
                          <div className="text-xs text-purple-300 font-medium">DIGITAL SIGNATURE</div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-green-300">
                              {verificationResult.securityInfo.digitalSignature.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {verificationResult.securityInfo.hashIntegrity && (
                        <div className="space-y-2">
                          <div className="text-xs text-purple-300 font-medium">HASH INTEGRITY</div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-green-300">
                              {verificationResult.securityInfo.hashIntegrity.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {verificationResult.securityInfo.databaseVerification && (
                        <div className="space-y-2">
                          <div className="text-xs text-purple-300 font-medium">DATABASE VERIFICATION</div>
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            <span className="text-green-300">
                              {verificationResult.securityInfo.databaseVerification.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </div>
                      )}
                      
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

                {/* Enhanced Error Information */}
                {!verificationResult.valid && verificationResult.errorCode && (
                  <div className="bg-red-500/10 rounded-xl p-4 border border-red-400/30">
                    <h4 className="text-sm font-semibold text-red-300 mb-2 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Error Details
                    </h4>
                    <div className="text-sm text-red-200 space-y-1">
                      <div>
                        <span className="font-medium">Error Code:</span> {verificationResult.errorCode}
                      </div>
                      {verificationResult.verificationId && (
                        <div>
                          <span className="font-medium">Verification ID:</span> {verificationResult.verificationId}
                        </div>
                      )}
                      <div className="text-xs text-red-300 mt-2">
                        Please contact support if this error persists.
                      </div>
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
              /* Enhanced Empty State */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Eye className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-300 mb-2">
                  Awaiting Verification
                </h4>
                <p className="text-gray-400 text-sm">
                  {activeMethod === 'pdf' 
                    ? 'Upload a PDF certificate to begin enhanced cryptographic verification'
                    : 'Enter a certificate ID to perform database lookup verification'
                  }
                </p>
              </motion.div>
            )}
          </div>

          {/* Enhanced Method Comparison */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Zap className="h-5 w-5 mr-2 text-yellow-400" />
              Verification Method Comparison
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-3">
                <div className="font-semibold text-blue-300">📄 Enhanced PDF Verification</div>
                <ul className="space-y-1 text-gray-300">
                  <li>• Complete cryptographic analysis</li>
                  <li>• Multiple metadata extraction methods</li>
                  <li>• SHA-512 hash integrity verification</li>
                  <li>• Digital signature validation</li>
                  <li>• Advanced tamper detection</li>
                  <li>• Database cross-reference</li>
                  <li>• Professional grade security</li>
                </ul>
              </div>
              <div className="space-y-3">
                <div className="font-semibold text-green-300">🔍 ID Database Verification</div>
                <ul className="space-y-1 text-gray-300">
                  <li>• Instant database lookup</li>
                  <li>• Certificate status validation</li>
                  <li>• Basic information retrieval</li>
                  <li>• Lightweight verification</li>
                  <li>• Quick validation process</li>
                  <li>• Real-time status check</li>
                  <li>• Fast and reliable</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default DualVerificationSystem;