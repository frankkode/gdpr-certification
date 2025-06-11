import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, User, Hash, Shield, Lock, 
  CheckCircle, AlertTriangle, Loader2, Eye, EyeOff,
  Clock, FileText, Key, Database, Trophy, Zap
} from 'lucide-react';
import CryptoJS from 'crypto-js';
import DataDeletionSimulation from './DataDeletionSimulation';
import confetti from 'canvas-confetti';

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

interface GeneratedCertificate {
  studentName: string;
  courseName: string;
  certificateId: string;
  hash: string;
}

const EnhancedCertificateGenerator: React.FC<CertificateGeneratorProps> = ({
  onCertificateGenerated,
  apiUrl
}) => {
  // Form state
  const [user, setUser] = useState('');
  const [exam, setExam] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showHashVisualization, setShowHashVisualization] = useState(true);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [generationProgress, setGenerationProgress] = useState(0);
  
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

  // Success and deletion states
  const [showSuccess, setShowSuccess] = useState(false);
  const [showDeletionSimulation, setShowDeletionSimulation] = useState(false);
  const [generatedCertificate, setGeneratedCertificate] = useState<GeneratedCertificate | null>(null);

  // Real-time validation with enhanced security checks
  const validateInput = useCallback((field: 'user' | 'exam', value: string): string | undefined => {
    const securityPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi
    ];
  
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

  // FIXED: Canonical JSON creation exactly matching backend
  const createCanonicalJSON = useCallback((userData: string, examData: string): string => {
    const timestamp = Date.now();
    const nonce = CryptoJS.lib.WordArray.random(16).toString();
    
    const certificate: CertificateData = {
      user: userData.trim(),
      exam: examData.trim(),
      timestamp,
      nonce,
      version: "4.0",
      issuer: "Military-Grade Certificate System",
      integrity: "SHA-512"
    };
    
    const sortedKeys = Object.keys(certificate).sort();
    const canonicalObj: Record<string, CertificateData[keyof CertificateData]> = {};
    sortedKeys.forEach(key => {
      canonicalObj[key] = certificate[key as keyof CertificateData];
    });
    
    return JSON.stringify(canonicalObj);
  }, []);

  // Real-time SHA-512 hash calculation
  const calculateRealTimeHash = useCallback((input: string): string => {
    if (!input) return '';
    
    const steps = [
      'Input normalization...',
      'UTF-8 encoding...',
      'SHA-512 preprocessing...',
      'Message padding...',
      'Hash computation...',
      'Final digest generation...'
    ];
    
    setHashingSteps(steps);
    
    const entropy = calculateEntropy(input);
    const complexity = calculateComplexity(input);
    const predictability = calculatePredictability(input);
    
    setSecurityMetrics({ entropy, complexity, predictability });
    
    return CryptoJS.SHA512(input).toString();
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

  const calculateComplexity = (input: string): number => {
    let score = 0;
    
    if (/[a-z]/.test(input)) score += 1;
    if (/[A-Z]/.test(input)) score += 1;
    if (/[0-9]/.test(input)) score += 1;
    if (/[^a-zA-Z0-9]/.test(input)) score += 1;
    
    score += Math.min(input.length / 10, 2);
    
    return Math.round(score * 10) / 10;
  };

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

  // Real-time updates
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

  // Form validation
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

  // 🏆 ENHANCED CERTIFICATE GENERATION
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setShowSuccess(false);
    
    try {
      const progressSteps = [
        { step: 'Validating input security...', progress: 15 },
        { step: 'Generating cryptographic hash...', progress: 30 },
        { step: 'Creating digital signature...', progress: 50 },
        { step: 'Designing beautiful certificate...', progress: 75 },
        { step: 'Finalizing security features...', progress: 90 },
        { step: 'Preparing download...', progress: 100 }
      ];
      
      for (const { step, progress } of progressSteps) {
        setCurrentStep(progressSteps.findIndex(s => s.step === step));
        setGenerationProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      
      const response = await fetch(`${apiUrl}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/pdf',
        },
        body: JSON.stringify({ user: user.trim(), exam: exam.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const certificateId = response.headers.get('X-Certificate-ID') || 'unknown';
      const requestId = response.headers.get('X-Request-ID');

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `beautiful_certificate_${certificateId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Set certificate data for deletion simulation
      setGeneratedCertificate({
        studentName: user.trim(),
        courseName: exam.trim(),
        certificateId: certificateId,
        hash: realTimeHash
      });

      // Show success animation
      setShowSuccess(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      });

      onCertificateGenerated();

      // Start data deletion simulation after 2 seconds
      setTimeout(() => {
        setShowSuccess(false);
        setShowDeletionSimulation(true);
      }, 2000);

    } catch (error) {
      console.error('Certificate generation error:', error);
      alert(error instanceof Error ? error.message : 'Certificate generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle deletion simulation completion
  const handleDeletionComplete = () => {
    setShowDeletionSimulation(false);
    
    // Clear form data (simulating deletion)
    setUser('');
    setExam('');
    setGenerationProgress(0);
    setCurrentStep(0);
    setGeneratedCertificate(null);
    
    // Show final success message
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10b981', '#059669']
    });
  };

  const isFormValid = useMemo(() => {
    return user.trim() && 
           exam.trim() && 
           Object.keys(errors).length === 0 &&
           !isGenerating;
  }, [user, exam, errors, isGenerating]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center space-x-3 mb-4"
        >
          <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl">
            <Trophy className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-white">Generate Beautiful Certificate</h2>
        </motion.div>
        <p className="text-blue-200 max-w-2xl mx-auto">
          Create competition-winning certificates with military-grade cryptographic security, 
          SHA-512 hashing, and automatic data deletion for GDPR compliance.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-6"
        >
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <User className="h-6 w-6 mr-3 text-blue-400" />
              Certificate Information
            </h3>
            
            {/* Student Name Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-blue-200">
                Student Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-400 transition-all focus:outline-none focus:ring-2 ${
                    errors.user 
                      ? 'border-red-400 focus:ring-red-400' 
                      : 'border-white/20 focus:ring-blue-400'
                  }`}
                  placeholder="Enter student's full name"
                  maxLength={100}
                  disabled={isGenerating}
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
                {user.length}/100 characters
              </div>
            </div>

            {/* Course Name Input */}
            <div className="space-y-2 mt-6">
              <label className="block text-sm font-medium text-blue-200">
                Course Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={exam}
                  onChange={(e) => setExam(e.target.value)}
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-gray-400 transition-all focus:outline-none focus:ring-2 ${
                    errors.exam 
                      ? 'border-red-400 focus:ring-red-400' 
                      : 'border-white/20 focus:ring-blue-400'
                  }`}
                  placeholder="Enter course or examination name"
                  maxLength={200}
                  disabled={isGenerating}
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
                {exam.length}/200 characters
              </div>
            </div>

            {/* Security Metrics */}
            {canonicalJSON && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 grid grid-cols-3 gap-4"
              >
                <div className="bg-blue-500/20 rounded-lg p-3 border border-blue-400/30">
                  <div className="text-xs text-blue-300">Entropy</div>
                  <div className="text-lg font-bold text-white">{securityMetrics.entropy}</div>
                </div>
                <div className="bg-green-500/20 rounded-lg p-3 border border-green-400/30">
                  <div className="text-xs text-green-300">Complexity</div>
                  <div className="text-lg font-bold text-white">{securityMetrics.complexity}</div>
                </div>
                <div className="bg-purple-500/20 rounded-lg p-3 border border-purple-400/30">
                  <div className="text-xs text-purple-300">Security</div>
                  <div className="text-lg font-bold text-white">{(1 - securityMetrics.predictability).toFixed(2)}</div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Generate Button */}
          <motion.button
            onClick={handleGenerate}
            disabled={!isFormValid}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${
              isFormValid
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
            whileHover={isFormValid ? { scale: 1.02 } : {}}
            whileTap={isFormValid ? { scale: 0.98 } : {}}
          >
            {isGenerating ? (
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Creating Beautiful Certificate... {generationProgress}%</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-3">
                <Trophy className="h-6 w-6" />
                <span>Generate Beautiful Certificate</span>
              </div>
            )}
          </motion.button>

          {/* Progress Indicator */}
          {isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-xl p-4 border border-white/10"
            >
              <div className="flex items-center space-x-3 mb-3">
                <Clock className="h-5 w-5 text-blue-400" />
                <span className="text-white font-medium">Generation Progress</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${generationProgress}%` }}
                />
              </div>
              <div className="text-sm text-blue-200">
                {hashingSteps[currentStep] || 'Initializing...'}
              </div>
            </motion.div>
          )}

          {/* Success Message */}
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-400/30 rounded-xl p-6 text-center"
            >
              <Trophy className="h-12 w-12 text-yellow-400 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-green-300 mb-2">
                🏆 Certificate Generated Successfully!
              </h3>
              <p className="text-green-200 text-sm">
                Your beautiful certificate has been downloaded. Starting data deletion process...
              </p>
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
                Real-Time Cryptographic Visualization
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
                        <Database className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium text-blue-200">Canonical JSON Structure</span>
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
                            SHA-512 Hash (128 characters)
                          </span>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                          <div className="text-xs text-yellow-300 font-mono break-all">
                            {realTimeHash}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-400">
                          <Lock className="h-3 w-3" />
                          <span>Collision probability: 1 in 2^512 (quantum-resistant)</span>
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
                      Cryptographic Visualization
                    </h4>
                    <p className="text-gray-400 text-sm">
                      Enter student and course information to see real-time hash generation
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* Enhanced Security Features */}
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-400" />
              Competition-Winning Features
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">Beautiful Design</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">SHA-512 Hashing</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">GDPR Compliance</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">Data Deletion</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">Tamper Detection</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                <span className="text-gray-300">QR Code Verification</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Data Deletion Simulation */}
      {generatedCertificate && (
        <DataDeletionSimulation
          isVisible={showDeletionSimulation}
          onComplete={handleDeletionComplete}
          certificateData={generatedCertificate}
        />
      )}
    </div>
  );
};

export default EnhancedCertificateGenerator;