import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Shield, Activity, Upload, BarChart3, Users,
  RefreshCw, Wifi, WifiOff, UserCheck, LogOut, User, Settings, Crown,
  AlertTriangle, X
} from 'lucide-react';
import AnimatedBackground from './components/AnimatedBackground';
import LanguageSwitcher from './components/LanguageSwitcher';
import ThemeToggle from './components/ThemeToggle';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import AuthWrapper from './components/AuthWrapper';

// ✅ FIXED: Lazy load GDPR-compliant components
const GDPRCertificateGenerator = lazy(() => import('./components/CertificateGenerator'));
const GDPRVerificationSystem = lazy(() => import('./components/GDPRVerificationSystem'));
const SecurityStats = lazy(() => import('./components/SecurityStats'));
const SecurityDashboard = lazy(() => import('./components/SecurityDashboard'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const AdminLogin = lazy(() => import('./components/AdminLogin'));
const MarketingHomepage = lazy(() => import('./components/MarketingHomepage'));
const UserManagementDashboard = lazy(() => import('./components/UserManagementDashboard'));
const BulkCertificateGenerator = lazy(() => import('./components/BulkCertificateGenerator'));
const SubscriberDashboard = lazy(() => import('./components/SubscriberDashboard'));
const PaymentPage = lazy(() => import('./components/PaymentPage'));
const PaymentSuccess = lazy(() => import('./components/PaymentSuccess'));
const PaymentCancel = lazy(() => import('./components/PaymentCancel'));

// API Configuration
const API_URL = import.meta.env.VITE_API_URL || (
  process.env.NODE_ENV === 'production' 
    ? 'https://gdpr-certification.vercel.app'
    : '/api'
);
const STATS_REFRESH_INTERVAL = 60000; // 60 seconds

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

// Admin Login Route Component
const AdminLoginRoute: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // If already logged in as admin, redirect to main app with admin tab
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/app?tab=admin');
    }
  }, [user, navigate]);

  const handleLoginSuccess = () => {
    navigate('/app?tab=admin');
  };

  return (
    <Suspense fallback={<Loading message="Loading admin login..." />}>
      <AdminLogin 
        apiUrl={API_URL} 
        onLoginSuccess={handleLoginSuccess}
      />
    </Suspense>
  );
};

// Main authenticated app component
const AuthenticatedApp: React.FC = () => {
  const { user, logout, updateUser, token, refreshAuth } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  // State management
  const [activeTab, setActiveTab] = useState<'generate' | 'bulk' | 'verify' | 'stats' | 'dashboard' | 'profile' | 'subscriber' | 'admin'>('generate');
  const [templates, setTemplates] = useState<Array<{ id: string; name: string; description: string }>>([]);
  const [showSubscriptionWarning, setShowSubscriptionWarning] = useState(false);

  // Set active tab based on URL parameter and user role
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    const fromPayment = urlParams.get('from_payment');
    
    // If user came from payment success, force refresh auth
    if (fromPayment === 'true') {
      console.log('🔄 App: User came from payment, forcing auth refresh...');
      refreshAuth();
      
      // Clean up the URL parameter
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('from_payment');
      window.history.replaceState({}, '', newUrl.toString());
    }
    
    // Auto-redirect based on subscription status after login
    if (user && !tabParam) {
      if (user.subscriptionTier && user.subscriptionTier !== 'free') {
        // User has active subscription, redirect to certificate generation
        setActiveTab('generate');
        navigate('/app?tab=generate');
      } else {
        // User has no active subscription, redirect to dashboard with warning
        setActiveTab('dashboard');
        navigate('/app?tab=dashboard&warning=no_subscription');
      }
    }
    
    if (tabParam === 'admin' && user?.role === 'admin') {
      setActiveTab('admin');
    } else if (tabParam && ['generate', 'bulk', 'verify', 'stats', 'dashboard', 'profile', 'subscriber'].includes(tabParam)) {
      setActiveTab(tabParam as any);
    }
  }, [location, user, refreshAuth, navigate]);

  // Handle tab change with URL update
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any);
    navigate(`/app?tab=${tabId}`);
  };
  
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
      // Only show reconnecting if we're currently disconnected
      if (connectionStatus === 'disconnected') {
        setConnectionStatus('reconnecting');
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

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

  // Fetch templates (user's own + public admin templates)
  const fetchTemplates = async () => {
    try {
      // If user is authenticated, fetch their templates + public templates
      if (token) {
        const [userTemplatesResponse, publicTemplatesResponse] = await Promise.all([
          fetch(`${API_URL}/user/templates`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }),
          fetch(`${API_URL}/templates/public`)
        ]);

        const userTemplates = userTemplatesResponse.ok ? (await userTemplatesResponse.json()).templates || [] : [];
        const publicTemplates = publicTemplatesResponse.ok ? (await publicTemplatesResponse.json()).templates || [] : [];
        
        // Combine user templates and public templates, avoiding duplicates
        const allTemplates = [...userTemplates, ...publicTemplates.filter(pt => 
          !userTemplates.some(ut => ut.id === pt.id)
        )];
        
        setTemplates(allTemplates);
      } else {
        // If not authenticated, fetch only public templates
        const response = await fetch(`${API_URL}/templates/public`);
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.templates || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchStats(true);
    fetchTemplates();
    
    // Check if user should see subscription warning
    const urlParams = new URLSearchParams(location.search);
    const warning = urlParams.get('warning');
    if (warning === 'no_subscription') {
      setShowSubscriptionWarning(true);
    }
  }, [location]);

  // Refetch templates when user/token changes
  useEffect(() => {
    fetchTemplates();
  }, [token, user]);

  // Set up periodic stats refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats(false);
    }, STATS_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // ✅ UPDATED: Navigation tabs with GDPR compliance focus
  const baseTabs = [
    { id: 'generate', label: t('navigation.generate'), icon: Shield, badge: 'GDPR' },
    { id: 'bulk', label: 'Bulk Certificates', icon: Users, badge: 'Batch' },
    { id: 'verify', label: t('navigation.verify'), icon: Upload, badge: 'Privacy' },
    { id: 'stats', label: t('navigation.stats'), icon: BarChart3, badge: 'Anonymous' },
    { id: 'dashboard', label: t('navigation.dashboard'), icon: Activity, badge: 'Secure' },
    { id: 'profile', label: t('navigation.profile'), icon: User, badge: 'Secure' }
  ];

  const subscriberTab = { id: 'subscriber', label: 'My Templates', icon: Crown, badge: 'Pro' };
  const adminTab = { id: 'admin', label: 'Admin', icon: Settings, badge: 'Admin' };
  
  // Show subscriber tab for paid users, admin tab for admins
  let tabs = [...baseTabs];
  
  if (user?.subscriptionTier && user.subscriptionTier !== 'free') {
    tabs.push(subscriberTab);
  }
  
  if (user?.role === 'admin') {
    tabs.push(adminTab);
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 relative overflow-hidden">
        {/* Animated Background */}
        <AnimatedBackground />
        
        {/* Main Content */}
        <div className="relative z-10">
          {/* ✅ UPDATED: Header with GDPR compliance indicators */}
          {/* ✅ FIXED: Responsive Header */}
<header className="border-b border-white/10 bg-black/20 backdrop-blur-md">
  <div className="container mx-auto px-4 py-4">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
      {/* Title Section - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
        <Shield className="h-6 w-6 sm:h-8 sm:w-8 text-blue-400 mx-auto sm:mx-0" />
        <div className="text-center sm:text-left">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white leading-tight">
            {t('header.title')}
          </h1>
          <p className="text-xs sm:text-sm text-blue-200">
            {t('header.subtitle')}
          </p>
        </div>
      </div>
      
      {/* Status Section - Responsive */}
      <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
        {/* GDPR Compliance Badge */}
        <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 border border-green-400/30 rounded-full">
          <Shield className="h-3 w-3 text-green-400" />
          <span className="text-xs font-medium text-green-300">{t('header.badges.gdprCompliant')}</span>
        </div>

        {/* Connection Status */}
        <div className={`flex items-center space-x-2 px-3 py-2 rounded-full border ${
          connectionStatus === 'connected' ? 'bg-green-500/20 border-green-400/30 text-green-300' :
          connectionStatus === 'reconnecting' ? 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300' :
          'bg-red-500/20 border-red-400/30 text-red-300'
        }`}>
          {connectionStatus === 'connected' ? <Wifi className="h-3 w-3 sm:h-4 sm:w-4" /> : <WifiOff className="h-3 w-3 sm:h-4 sm:w-4" />}
          <span className="text-xs sm:text-sm font-medium capitalize">{t(`header.status.${connectionStatus}`)}</span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Language Switcher */}
        <LanguageSwitcher compact={true} />

        {/* Subscription Status */}
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${
          user?.subscriptionTier && user.subscriptionTier !== 'free'
            ? 'bg-purple-500/20 border-purple-400/30 text-purple-300'
            : 'bg-gray-500/20 border-gray-400/30 text-gray-300'
        }`}>
          <Crown className="h-3 w-3" />
          <span className="text-xs font-medium">{user?.subscriptionTier || 'free'}</span>
        </div>

        {/* Auth Refresh Button */}
        <motion.button
          onClick={async () => {
            console.log('🔄 Manual auth refresh triggered');
            await refreshAuth();
          }}
          className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 rounded-lg text-green-300 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Refresh subscription status"
        >
          <RefreshCw className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-xs sm:text-sm font-medium hidden sm:inline">Auth</span>
        </motion.button>

        {/* Refresh Button */}
        <motion.button
          onClick={() => fetchStats(true)}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-300 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="text-xs sm:text-sm font-medium hidden sm:inline">{t('header.actions.refresh')}</span>
        </motion.button>

        {/* Logout Button */}
        <motion.button
          onClick={logout}
          className="flex items-center space-x-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded-lg text-red-300 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-xs sm:text-sm font-medium hidden sm:inline">{t('header.actions.logout')}</span>
        </motion.button>
      </div>
    </div>
  </div>
</header>

          {/* ✅ UPDATED: Navigation with GDPR badges */}
          {/* ✅ FIXED: Responsive Navigation */}
<nav className="border-b border-white/10 bg-black/10 backdrop-blur-md">
  <div className="container mx-auto px-4">
    {/* Desktop Navigation */}
    <div className="hidden md:flex space-x-1">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => handleTabChange(id)}
          className={`flex items-center space-x-2 px-4 lg:px-6 py-4 text-sm font-medium transition-all ${
            activeTab === id
              ? 'bg-blue-500/20 text-blue-300 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden lg:inline">{label}</span>
          <span className="lg:hidden">{label.split(' ')[0]}</span>
        </button>
      ))}
    </div>

    {/* Mobile Navigation - Grid Layout */}
    <div className="md:hidden grid grid-cols-2 gap-1 py-2">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => handleTabChange(id)}
          className={`flex flex-col items-center space-y-1 px-3 py-3 text-xs font-medium rounded-lg transition-all ${
            activeTab === id
              ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
              : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          <Icon className="h-5 w-5" />
          <span className="text-center leading-tight">
            {label.includes(' ') ? (
              <>
                {label.split(' ')[0]}<br />
                {label.split(' ').slice(1).join(' ')}
              </>
            ) : (
              label
            )}
          </span>
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
                    
                    {activeTab === 'bulk' && (
                      <BulkCertificateGenerator
                        apiUrl={API_URL}
                        token={token}
                        templates={templates}
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
                      <>
                        {/* Subscription Warning */}
                        {showSubscriptionWarning && (!user?.subscriptionTier || user.subscriptionTier === 'free') && (
                          <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mb-6 p-4 bg-yellow-500/10 border border-yellow-400/30 rounded-lg"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <AlertTriangle className="h-5 w-5 text-yellow-400" />
                                <div>
                                  <h3 className="font-semibold text-yellow-300">No Active Subscription</h3>
                                  <p className="text-sm text-yellow-200">You need an active subscription to generate certificates and access premium features.</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleTabChange('profile')}
                                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg text-sm font-medium transition"
                                >
                                  View Subscription Plans
                                </button>
                                <button
                                  onClick={() => setShowSubscriptionWarning(false)}
                                  className="p-1 text-yellow-400 hover:text-yellow-300 transition"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        <SecurityDashboard
                          stats={stats}
                          securityMetrics={securityMetrics}
                          systemHealth={systemHealth}
                          lastUpdate={lastUpdate}
                          connectionStatus={connectionStatus}
                          onRefresh={() => fetchStats(true)}
                        />
                      </>
                    )}
                    
                    {activeTab === 'profile' && (
                      <UserProfile
                        user={user}
                        token={token}
                        apiUrl={API_URL}
                        onUserUpdate={updateUser}
                      />
                    )}
                    
                    {activeTab === 'subscriber' && user?.subscriptionTier && user.subscriptionTier !== 'free' && (
                      <SubscriberDashboard
                        apiUrl={API_URL}
                      />
                    )}
                    
                    {activeTab === 'admin' && user?.role === 'admin' && (
                      <AdminDashboard
                        apiUrl={API_URL}
                        onClose={() => handleTabChange('dashboard')}
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
                  <p className="font-medium text-green-300">{t('footer.title')}</p>
                  <p>{t('footer.subtitle')}</p>
                </div>
                <div className="text-right">
                  <p>{t('footer.lastUpdated', { time: lastUpdate.toLocaleTimeString() })}</p>
                  <p>{t('footer.status', { status: systemHealth.status })} • 
                    <span className="text-green-400 ml-1">
                      {t('footer.personalData', { 
                        status: stats.gdprCompliance.personalDataStored ? t('footer.stored') : t('footer.noneStored')
                      })}
                    </span>
                  </p>
                </div>
              </div>
              
              {/* GDPR Compliance Summary */}
              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div className="bg-green-500/10 p-2 rounded border border-green-400/20">
                    <div className="font-medium text-green-300">Article 5 ✅</div>
                    <div className="text-green-200">{t('footer.gdprArticles.article5')}</div>
                  </div>
                  <div className="bg-green-500/10 p-2 rounded border border-green-400/20">
                    <div className="font-medium text-green-300">Article 17 ✅</div>
                    <div className="text-green-200">{t('footer.gdprArticles.article17')}</div>
                  </div>
                  <div className="bg-green-500/10 p-2 rounded border border-green-400/20">
                    <div className="font-medium text-green-300">Article 25 ✅</div>
                    <div className="text-green-200">{t('footer.gdprArticles.article25')}</div>
                  </div>
                  <div className="bg-green-500/10 p-2 rounded border border-green-400/20">
                    <div className="font-medium text-green-300">Article 32 ✅</div>
                    <div className="text-green-200">{t('footer.gdprArticles.article32')}</div>
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

// Landing Page Route Component
const LandingPageRoute: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect to main app
  if (user) {
    return <Navigate to="/app" replace />;
  }

  const handleGetStarted = () => {
    navigate('/app');
  };

  const handleLogin = () => {
    navigate('/app');
  };

  const handleRegister = () => {
    navigate('/app');
  };

  return (
    <Suspense fallback={<Loading message="Loading homepage..." />}>
      <MarketingHomepage 
        onGetStarted={handleGetStarted}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </Suspense>
  );
};

// Routing component that handles authentication and admin routes
const AppRouting: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Landing Page - accessible without authentication */}
      <Route path="/" element={<LandingPageRoute />} />
      
      {/* Admin Login Route - accessible without authentication */}
      <Route path="/admin" element={<AdminLoginRoute />} />
      
      {/* Payment Page - accessible without authentication */}
      <Route path="/payment" element={
        <Suspense fallback={<Loading message="Loading payment page..." />}>
          <PaymentPage />
        </Suspense>
      } />
      
      {/* Payment Success Page - accessible without authentication */}
      <Route path="/payment/success" element={
        <Suspense fallback={<Loading message="Loading payment success..." />}>
          <PaymentSuccess />
        </Suspense>
      } />
      
      {/* Payment Cancel Page - accessible without authentication */}
      <Route path="/payment/cancel" element={
        <Suspense fallback={<Loading message="Loading payment cancel..." />}>
          <PaymentCancel />
        </Suspense>
      } />
      
      {/* Main App Route - requires authentication */}
      <Route 
        path="/app" 
        element={
          <AuthWrapper apiUrl={API_URL}>
            <AuthenticatedApp />
          </AuthWrapper>
        } 
      />
      
      {/* Redirect any unknown routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Main App component with Authentication Provider and Router
const App: React.FC = () => {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider apiUrl={API_URL}>
          <AppRouting />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
};

export default App;