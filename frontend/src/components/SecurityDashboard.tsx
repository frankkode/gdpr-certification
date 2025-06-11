// 📊 Professional Security Dashboard Component - Fixed Version
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Shield, AlertTriangle, TrendingUp, Clock, 
  Database, Lock, Eye, Zap, RefreshCw, ChevronDown,
  ChevronUp, Server, Cpu, HardDrive, Wifi, Signal
} from 'lucide-react';

interface SecurityDashboardProps {
  stats: {
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
  };
  securityMetrics?: {
    tamperDetectionRate: string;
    securityEventsPerHour: string;
    rateLimitViolationsPerHour: string;
  };
  systemHealth?: {
    status: string;
    lastSecurityScan: string;
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    uptime: number;
  };
  lastUpdate: Date;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  onRefresh: () => void;
}

interface MetricCard {
  title: string;
  value: string | number;
  change?: string;
  status: 'good' | 'warning' | 'critical';
  icon: React.ComponentType<any>;
  description: string;
}

const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  stats,
  securityMetrics = {
    tamperDetectionRate: '0',
    securityEventsPerHour: '0',
    rateLimitViolationsPerHour: '0'
  },
  systemHealth = {
    status: 'UNKNOWN',
    lastSecurityScan: new Date().toISOString(),
    memoryUsage: {
      rss: 0,
      heapTotal: 100000000,
      heapUsed: 50000000,
      external: 0
    },
    uptime: 0
  },
  lastUpdate,
  connectionStatus,
  onRefresh
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [realTimeData, setRealTimeData] = useState<number[]>([]);

  // Simulate real-time data for charts
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => {
        const newData = [...prev, Math.random() * 100];
        return newData.slice(-20); // Keep last 20 data points
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Handle manual refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Calculate system performance metrics with proper null safety
  const performanceMetrics = useMemo(() => {
    if (!systemHealth?.memoryUsage?.heapTotal || !systemHealth?.memoryUsage?.heapUsed) {
      return {
        memoryUsage: '0.0',
        uptimeDays: '0.0',
        heapUsedMB: '0.0',
        totalMemoryMB: '100.0'
      };
    }

    const memoryUsagePercent = systemHealth.memoryUsage.heapTotal > 0 
      ? (systemHealth.memoryUsage.heapUsed / systemHealth.memoryUsage.heapTotal * 100)
      : 0;
    const uptimeDays = systemHealth.uptime ? (systemHealth.uptime / (24 * 60 * 60)) : 0;
    
    return {
      memoryUsage: memoryUsagePercent.toFixed(1),
      uptimeDays: uptimeDays.toFixed(1),
      heapUsedMB: (systemHealth.memoryUsage.heapUsed / 1024 / 1024).toFixed(1),
      totalMemoryMB: (systemHealth.memoryUsage.heapTotal / 1024 / 1024).toFixed(1)
    };
  }, [systemHealth]);

  // Security status assessment
  const securityStatus = useMemo(() => {
    const tamperCount = stats.tamperDetected || 0;
    const securityEventCount = stats.securityEvents || 0;
    const successRateNum = parseFloat(stats.successRate || '100');

    if (tamperCount > 5 || securityEventCount > 20 || successRateNum < 90) {
      return { level: 'critical', color: 'red', text: 'High Risk' };
    } else if (tamperCount > 0 || securityEventCount > 10 || successRateNum < 95) {
      return { level: 'warning', color: 'yellow', text: 'Monitoring' };
    }
    return { level: 'good', color: 'green', text: 'Secure' };
  }, [stats]);

  // Main metric cards
  const metricCards: MetricCard[] = [
    {
      title: 'Certificates Generated',
      value: stats.certificatesGenerated || 0,
      status: 'good',
      icon: Shield,
      description: 'Total professional certificates created'
    },
    {
      title: 'Verification Success Rate',
      value: stats.successRate || '100%',
      status: parseFloat(stats.successRate || '100') >= 95 ? 'good' : parseFloat(stats.successRate || '100') >= 90 ? 'warning' : 'critical',
      icon: TrendingUp,
      description: 'Percentage of successful verifications'
    },
    {
      title: 'Security Events',
      value: stats.securityEvents || 0,
      status: (stats.securityEvents || 0) > 20 ? 'critical' : (stats.securityEvents || 0) > 10 ? 'warning' : 'good',
      icon: AlertTriangle,
      description: 'Total security events detected'
    },
    {
      title: 'System Uptime',
      value: `${stats.uptimeHours || '0'}h`,
      status: 'good',
      icon: Clock,
      description: 'Continuous operation time'
    },
    {
      title: 'Tamper Detection',
      value: stats.tamperDetected || 0,
      status: (stats.tamperDetected || 0) > 5 ? 'critical' : (stats.tamperDetected || 0) > 0 ? 'warning' : 'good',
      icon: Eye,
      description: 'Certificates with tamper attempts'
    },
    {
      title: 'Total Verifications',
      value: stats.verificationsPerformed || 0,
      status: 'good',
      icon: Database,
      description: 'All verification attempts'
    }
  ];

  // Get status color classes
  const getStatusColor = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good':
        return 'text-green-400 bg-green-500/20 border-green-400/30';
      case 'warning':
        return 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30';
      case 'critical':
        return 'text-red-400 bg-red-500/20 border-red-400/30';
    }
  };

  const CollapsibleSection: React.FC<{
    title: string;
    id: string;
    icon: React.ComponentType<any>;
    children: React.ReactNode;
  }> = ({ title, id, icon: Icon, children }) => {
    const isExpanded = expandedSection === id;
    
    return (
      <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
        <button
          onClick={() => setExpandedSection(isExpanded ? null : id)}
          className="w-full p-6 text-left hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Icon className="h-6 w-6 text-blue-400" />
              <h3 className="text-xl font-semibold text-white">{title}</h3>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </button>
        
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="px-6 pb-6">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center space-x-3"
        >
          <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white">Security Dashboard</h2>
            <p className="text-green-200">Real-time monitoring and security analytics</p>
          </div>
        </motion.div>

        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-full border ${
            connectionStatus === 'connected' ? 'bg-green-500/20 border-green-400/30 text-green-300' :
            connectionStatus === 'reconnecting' ? 'bg-yellow-500/20 border-yellow-400/30 text-yellow-300' :
            'bg-red-500/20 border-red-400/30 text-red-300'
          }`}>
            <Wifi className={`h-4 w-4 ${connectionStatus === 'reconnecting' ? 'animate-pulse' : ''}`} />
            <span className="text-sm font-medium capitalize">{connectionStatus}</span>
          </div>

          {/* Refresh Button */}
          <motion.button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-300 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </motion.button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        {metricCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
            className={`p-4 rounded-2xl border ${getStatusColor(card.status)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <card.icon className="h-6 w-6" />
              <Signal className="h-4 w-4 opacity-50" />
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-white">{card.value}</div>
              <div className="text-xs font-medium opacity-90">{card.title}</div>
              <div className="text-xs opacity-70">{card.description}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* System Status Overview */}
      <CollapsibleSection title="System Status Overview" id="overview" icon={Activity}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Security Status */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white flex items-center">
              <Shield className="h-5 w-5 mr-2 text-green-400" />
              Security Status
            </h4>
            
            <div className={`p-4 rounded-xl border ${getStatusColor(securityStatus.level as any)}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-bold">Overall Security: {securityStatus.text}</span>
                <div className={`w-3 h-3 rounded-full bg-${securityStatus.color}-400`}></div>
              </div>
              <div className="text-sm opacity-80">
                System is operating within acceptable security parameters
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg">
                <span className="text-blue-200">Tamper Detection Rate</span>
                <span className="text-white font-bold">{securityMetrics?.tamperDetectionRate || '0'}%</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-lg">
                <span className="text-purple-200">Security Events/Hour</span>
                <span className="text-white font-bold">{securityMetrics?.securityEventsPerHour || '0'}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-orange-500/10 rounded-lg">
                <span className="text-orange-200">Rate Limit Violations/Hour</span>
                <span className="text-white font-bold">{securityMetrics?.rateLimitViolationsPerHour || '0'}</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics with Null Safety */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white flex items-center">
              <Server className="h-5 w-5 mr-2 text-blue-400" />
              Performance Metrics
            </h4>
            
            <div className="space-y-3">
              <div className="p-4 bg-gray-500/10 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-200 flex items-center">
                    <Cpu className="h-4 w-4 mr-2" />
                    Memory Usage
                  </span>
                  <span className="text-white font-bold">{performanceMetrics.memoryUsage}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                    style={{ width: `${performanceMetrics.memoryUsage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {performanceMetrics.heapUsedMB}MB / {performanceMetrics.totalMemoryMB}MB
                </div>
              </div>

              <div className="p-3 bg-green-500/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-green-200 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    System Uptime
                  </span>
                  <span className="text-white font-bold">{performanceMetrics.uptimeDays} days</span>
                </div>
              </div>

              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-yellow-200 flex items-center">
                    <HardDrive className="h-4 w-4 mr-2" />
                    Status
                  </span>
                  <span className="text-white font-bold">{systemHealth?.status || 'UNKNOWN'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CollapsibleSection>

      {/* Footer Info */}
      <div className="text-center text-sm text-gray-400 pt-4 border-t border-white/10">
        <div className="flex items-center justify-center space-x-4">
          <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          <span>•</span>
          <span>Security scan: {systemHealth?.lastSecurityScan 
            ? new Date(systemHealth.lastSecurityScan).toLocaleTimeString() 
            : 'N/A'}</span>
          <span>•</span>
          <span className="flex items-center space-x-1">
            <Zap className="h-3 w-3" />
            <span>Professional Security Active</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;