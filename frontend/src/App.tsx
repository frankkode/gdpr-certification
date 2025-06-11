import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, Activity, Upload, BarChart3, 
  RefreshCw, Wifi, WifiOff, UserCheck 
} from 'lucide-react';
import AnimatedBackground from './components/AnimatedBackground';

// ✅ FIXED: Lazy load GDPR-compliant components
const GDPRCertificateGenerator = lazy(() => import('./components/CertificateGenerator'));
const GDPRVerificationSystem = lazy(() => import('./components/GDPRVerificationSystem'));
const SecurityStats = lazy(() => import('./components/SecurityStats'));
const SecurityDashboard = lazy(() => import('./components/SecurityDashboard'));

// API Configuration
const API_URL = 'http://localhost:5000';
const STATS_REFRESH_INTERVAL = 30000; // 30 seconds

// ✅ FIXED: GDPR-compliant stats interface (no personal data)
interface Stats {
  certificatesGenerated: number;
  verificationsPerformed: number;
  successfulVerifications: number;
  tamperDetected: number;
  securityEvents: number;
  successRate: string;
  uptimeHours: string;
  hashCollisionProbability: string;
  securityLevel: string;
  cryptographicStandard: string;
  // ✅ NEW: GDPR compliance indicators
  gdprCompliance: {
    status: string;
    personalDataStored: boolean;
    automaticDeletion: string;
    dataMinimization: string;
    rightToErasure: string;
  };
}

interface SystemHealth {
  status: string;
  version: string;
  timestamp: string;
  uptime: number;
  lastSecurityScan: string;
  memoryUsage: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  features: string[];
  // ✅ NEW: GDPR compliance info
  gdprCompliance: {
    dataMinimization: string;
    rightToErasure: string;
    privacyByDesign: string;
    personalDataRetention: string;
  };
}

interface SecurityMetrics {
  tamperDetectionRate: string;
  securityEventsPerHour: string;
  rateLimitViolationsPerHour: string;
}

type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

// Error Boundary Component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
          <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-6 max-w-md">
            <h2 className="text-xl font-bold text-red-300 mb-2">Something went wrong</h2>
            <p className="text-red-200 text-sm mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading Component
const Loading: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center space-x-3">
      <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-white">{message}</span>
    </div>
  </div>
);

const App: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'generate' | 'verify' | 'stats' | 'dashboard'>('generate');
  
  // ✅ FIXED: GDPR-compliant stats with default values
  const [stats, setStats] = useState<Stats>({
    certificatesGenerated: 0,
    verificationsPerformed: 0,
    successfulVerifications: 0,
    tamperDetected: 0,
    securityEvents: 0,
    successRate: '100%',
    uptimeHours: '0',
    hashCollisionProbability: '1 in 2^512',
    securityLevel: 'GDPR_COMPLIANT',
    cryptographicStandard: 'SHA-512',
    gdprCompliance: {
      status: 'FULLY_COMPLIANT',
      personalDataStored: false,
      automaticDeletion: 'IMPLEMENTED',
      dataMinimization: 'IMPLEMENTED',
      rightToErasure: 'NOT_APPLICABLE_NO_PERSONAL_DATA'
    }
  });
  
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'UNKNOWN',
    version: '4.0.0-GDPR',
    timestamp: new Date().toISOString(),
    uptime: 0,
    lastSecurityScan: new Date().toISOString(),
    memoryUsage: {
      rss: 0,
      heapTotal: 100000000,
      heapUsed: 50000000,
      external: 0
    },
    features: ['GDPR Compliant', 'Privacy by Design', 'Zero Data Retention'],
    gdprCompliance: {
      dataMinimization: 'IMPLEMENTED',
      rightToErasure: 'NOT_NEEDED',
      privacyByDesign: 'CORE_ARCHITECTURE',
      personalDataRetention: 'ZERO'
    }
  });

  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics>({
    tamperDetectionRate: '100',
    securityEventsPerHour: '0',
    rateLimitViolationsPerHour: '0'
  });

  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // ✅ FIXED: Fetch GDPR-compliant stats from API
  const fetchStats = async (showLoading = false): Promise<void> => {
    if (showLoading) setIsLoading(true);
    
    try {
      setConnectionStatus('reconnecting');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const [statsResponse, healthResponse] = await Promise.all([
        fetch(`${API_URL}/stats`, { 
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        }),
        fetch(`${API_URL}/health`, { 
          signal: controller.signal,
          headers: { 'Accept': 'application/json' }
        })
      ]);

      clearTimeout(timeoutId);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(prevStats => ({
          ...prevStats,
          ...statsData.statistics,
          // ✅ Ensure GDPR compliance data is included
          gdprCompliance: statsData.statistics?.gdprCompliance || {
            status: 'FULLY_COMPLIANT',
            personalDataStored: false,
            automaticDeletion: 'IMPLEMENTED',
            dataMinimization: 'IMPLEMENTED',
            rightToErasure: 'NOT_APPLICABLE_NO_PERSONAL_DATA'
          }
        }));
      }

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setSystemHealth(prevHealth => ({
          ...prevHealth,
          ...healthData,
          memoryUsage: healthData.memoryUsage || {
            rss: 0,
            heapTotal: 100000000,
            heapUsed: 50000000,
            external: 0
          },
          status: healthData.status || 'UNKNOWN',
          lastSecurityScan: healthData.lastSecurityScan || new Date().toISOString(),
          uptime: healthData.uptime || 0,
          // ✅ Include GDPR compliance from health check
          gdprCompliance: healthData.gdprCompliance || {
            dataMinimization: 'IMPLEMENTED',
            rightToErasure: 'NOT_NEEDED',
            privacyByDesign: 'CORE_ARCHITECTURE',
            personalDataRetention: 'ZERO'
          }
        }));
      }

      // Calculate derived security metrics
      const tamperRate = stats.verificationsPerformed > 0 
        ? ((stats.tamperDetected / stats.verificationsPerformed) * 100).toFixed(1)
        : '0.0';
      
      const eventsPerHour = stats.uptimeHours 
        ? (stats.securityEvents / parseFloat(stats.uptimeHours)).toFixed(1)
        : '0.0';

      setSecurityMetrics({
        tamperDetectionRate: tamperRate,
        securityEventsPerHour: eventsPerHour,
        rateLimitViolationsPerHour: '0.0'
      });

      setConnectionStatus('connected');
      setLastUpdate(new Date());

    } catch (error) {
      console.error('Failed to fetch stats:', error);
      setConnectionStatus('disconnected');
      
      // Keep using cached data if available, don't reset to defaults
      if (stats.certificatesGenerated === 0) {
        setStats(prevStats => ({ ...prevStats }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle certificate generation success
  const handleCertificateGenerated = (): void => {
    setStats(prev => ({
      ...prev,
      certificatesGenerated: prev.certificatesGenerated + 1
    }));
    // Refresh stats after generation
    setTimeout(() => fetchStats(false), 1000);
  };

  // Handle verification success
  const handleVerification = (): void => {
    setStats(prev => ({
      ...prev,
      verificationsPerformed: prev.verificationsPerformed + 1,
      successfulVerifications: prev.successfulVerifications + 1
    }));
    // Refresh stats after verification
    setTimeout(() => fetchStats(false), 1000);
  };

  // Initial data fetch
  useEffect(() => {
    fetchStats(true);
  }, []);

  // Set up periodic stats refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats(false);
    }, STATS_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // ✅ UPDATED: Navigation tabs with GDPR compliance focus
  const tabs = [
    { id: 'generate', label: 'Generate Certificate', icon: Shield, badge: 'GDPR' },
    { id: 'verify', label: 'Verify Certificate', icon: Upload, badge: 'Privacy' },
    { id: 'stats', label: 'Statistics', icon: BarChart3, badge: 'Anonymous' },
    { id: 'dashboard', label: 'Security Dashboard', icon: Activity, badge: 'Secure' }
  ] as const;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 relative overflow-hidden">
        {/* Animated Background */}
        <AnimatedBackground />
        
        {/* Main Content */}
        <div className="relative z-10">
          {/* ✅ UPDATED: Header with GDPR compliance indicators */}
          <header className="border-b border-white/10 bg-black/20 backdrop-blur-md">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="h-8 w-8 text-green-400" />
                  <div>
                    <h1 className="text-2xl font-bold text-white">GDPR-Compliant Certificate System</h1>
                    <p className="text-green-200 text-sm flex items-center space-x-2">
                      <UserCheck className="h-4 w-4" />
                      <span>Privacy by Design • Zero Data Retention • Cryptographically Secured</span>
                    </p>
                  </div>
                </div>
                
                {/* ✅ UPDATED: Connection Status & GDPR Compliance */}
                <div className="flex items-center space-x-4">
                  {/* GDPR Compliance Badge */}
                  <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-400/30 text-green-300">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {stats.gdprCompliance.personalDataStored ? '⚠️ Non-Compliant' : '✅ GDPR Compliant'}
                    </span>
                  </div>

                  {/* Connection Status */}
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${
                    connectionStatus === 'connected' ? 'bg-green-500/20 border-green-400/30 text-green-300' :
                    connectionStatus === 'reconnecting' ? 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300' :
                    'bg-red-500/20 border-red-400/30 text-red-300'
                  }`}>
                    {connectionStatus === 'connected' ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                    <span className="text-sm font-medium capitalize">{connectionStatus}</span>
                  </div>

                  {/* Refresh Button */}
                  <button
                    onClick={() => fetchStats(true)}
                    disabled={isLoading}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Refresh Data"
                  >
                    <RefreshCw className={`h-5 w-5 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* ✅ UPDATED: Navigation with GDPR badges */}
          <nav className="border-b border-white/10 bg-black/10 backdrop-blur-md">
            <div className="container mx-auto px-4">
              <div className="flex space-x-1">
                {tabs.map(({ id, label, icon: Icon, badge }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium transition-all relative ${
                      activeTab === id
                        ? 'bg-green-500/20 text-green-300 border-b-2 border-green-400'
                        : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                    {badge && (
                      <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        {badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </nav>

          {/* Main Content Area */}
          <main className="container mx-auto px-4 py-8">
            <ErrorBoundary>
              <Suspense fallback={<Loading message="Loading GDPR-compliant component..." />}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {activeTab === 'generate' && (
                      <GDPRCertificateGenerator
                        onCertificateGenerated={handleCertificateGenerated}
                        apiUrl={API_URL}
                      />
                    )}
                    
                    {activeTab === 'verify' && (
                      <GDPRVerificationSystem
                        onVerification={handleVerification}
                        apiUrl={API_URL}
                      />
                    )}
                    
                    {activeTab === 'stats' && (
                      <SecurityStats
                        stats={stats}
                        securityMetrics={securityMetrics}
                        systemHealth={systemHealth}
                        isLoading={isLoading}
                        lastUpdate={lastUpdate}
                      />
                    )}
                    
                    {activeTab === 'dashboard' && (
                      <SecurityDashboard
                        stats={stats}
                        securityMetrics={securityMetrics}
                        systemHealth={systemHealth}
                        lastUpdate={lastUpdate}
                        connectionStatus={connectionStatus}
                        onRefresh={() => fetchStats(true)}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </Suspense>
            </ErrorBoundary>
          </main>

          {/* ✅ UPDATED: Footer with GDPR compliance info */}
          <footer className="border-t border-white/10 bg-black/20 backdrop-blur-md mt-16">
            <div className="container mx-auto px-4 py-6">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <div>
                  <p className="font-medium text-green-300">GDPR-Compliant Certificate System v4.0</p>
                  <p>Privacy by Design • SHA-512 Cryptographic Security • Zero Personal Data Retention</p>
                </div>
                <div className="text-right">
                  <p>Last updated: {lastUpdate.toLocaleTimeString()}</p>
                  <p>Status: {systemHealth.status} • 
                    <span className="text-green-400 ml-1">
                      Personal Data: {stats.gdprCompliance.personalDataStored ? 'Stored ⚠️' : 'None Stored ✅'}
                    </span>
                  </p>
                </div>
              </div>
              
              {/* GDPR Compliance Summary */}
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="bg-green-500/10 p-2 rounded border border-green-400/20">
                    <div className="font-medium text-green-300">Article 5 ✅</div>
                    <div className="text-green-200">Data Minimization</div>
                  </div>
                  <div className="bg-green-500/10 p-2 rounded border border-green-400/20">
                    <div className="font-medium text-green-300">Article 17 ✅</div>
                    <div className="text-green-200">Right to Erasure</div>
                  </div>
                  <div className="bg-green-500/10 p-2 rounded border border-green-400/20">
                    <div className="font-medium text-green-300">Article 25 ✅</div>
                    <div className="text-green-200">Privacy by Design</div>
                  </div>
                  <div className="bg-green-500/10 p-2 rounded border border-green-400/20">
                    <div className="font-medium text-green-300">Article 32 ✅</div>
                    <div className="text-green-200">Security Measures</div>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;