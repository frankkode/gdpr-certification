// 📈 Military-Grade Security Statistics Component
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Shield, AlertTriangle, Clock, Database, 
  Lock, Eye, Zap, Activity, CheckCircle, XCircle,
  BarChart3, PieChart, Gauge, Target
} from 'lucide-react';

interface SecurityStatsProps {
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
  isLoading: boolean;
  lastUpdate: Date;
}

interface StatCard {
  id: string;
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  critical?: boolean;
  description: string;
}

const SecurityStats: React.FC<SecurityStatsProps> = ({
  stats,
  securityMetrics,
  systemHealth,
  isLoading,
  lastUpdate
}) => {
  const [activeView, setActiveView] = useState<'overview' | 'detailed' | 'security'>('overview');

  // Calculate derived metrics
  const derivedMetrics = useMemo(() => {
    const failureRate = stats.verificationsPerformed > 0 
      ? ((stats.verificationsPerformed - stats.successfulVerifications) / stats.verificationsPerformed * 100).toFixed(2)
      : '0.00';

    const tamperRate = stats.verificationsPerformed > 0
      ? (stats.tamperDetected / stats.verificationsPerformed * 100).toFixed(2)
      : '0.00';

    const certificatesPer24h = stats.uptimeHours 
      ? Math.round(stats.certificatesGenerated / (parseFloat(stats.uptimeHours) / 24))
      : 0;

    const verificationsPer24h = stats.uptimeHours
      ? Math.round(stats.verificationsPerformed / (parseFloat(stats.uptimeHours) / 24))
      : 0;

    return {
      failureRate,
      tamperRate,
      certificatesPer24h,
      verificationsPer24h,
      avgVerificationsPerCertificate: stats.certificatesGenerated > 0 
        ? (stats.verificationsPerformed / stats.certificatesGenerated).toFixed(1)
        : '0.0'
    };
  }, [stats]);

  // Generate stat cards based on view
  const getStatCards = (): StatCard[] => {
    switch (activeView) {
      case 'overview':
        return [
          {
            id: 'certificates',
            title: 'Certificates Generated',
            value: stats.certificatesGenerated,
            subtitle: `${derivedMetrics.certificatesPer24h}/day avg`,
            icon: Shield,
            color: 'blue',
            trend: 'up',
            description: 'Total military-grade certificates issued'
          },
          {
            id: 'success-rate',
            title: 'Success Rate',
            value: stats.successRate,
            subtitle: 'Verification accuracy',
            icon: TrendingUp,
            color: parseFloat(stats.successRate) >= 98 ? 'green' : parseFloat(stats.successRate) >= 95 ? 'yellow' : 'red',
            trend: parseFloat(stats.successRate) >= 98 ? 'up' : 'stable',
            description: 'Percentage of successful verifications'
          },
          {
            id: 'verifications',
            title: 'Total Verifications',
            value: stats.verificationsPerformed,
            subtitle: `${derivedMetrics.verificationsPer24h}/day avg`,
            icon: Database,
            color: 'purple',
            trend: 'up',
            description: 'All verification attempts performed'
          },
          {
            id: 'uptime',
            title: 'System Uptime',
            value: `${stats.uptimeHours}h`,
            subtitle: 'Continuous operation',
            icon: Clock,
            color: 'green',
            trend: 'up',
            description: 'Uninterrupted service availability'
          }
        ];

      case 'security':
        return [
          {
            id: 'tamper-detected',
            title: 'Tamper Attempts',
            value: stats.tamperDetected,
            subtitle: `${derivedMetrics.tamperRate}% of verifications`,
            icon: AlertTriangle,
            color: stats.tamperDetected > 5 ? 'red' : stats.tamperDetected > 0 ? 'yellow' : 'green',
            critical: stats.tamperDetected > 5,
            description: 'Certificates with detected tampering'
          },
          {
            id: 'security-events',
            title: 'Security Events',
            value: stats.securityEvents,
            subtitle: securityMetrics?.securityEventsPerHour ? `${securityMetrics.securityEventsPerHour}/hour` : undefined,
            icon: Eye,
            color: stats.securityEvents > 20 ? 'red' : stats.securityEvents > 10 ? 'yellow' : 'green',
            critical: stats.securityEvents > 20,
            description: 'Total security incidents detected'
          },
          {
            id: 'security-level',
            title: 'Security Level',
            value: stats.securityLevel,
            subtitle: stats.cryptographicStandard,
            icon: Lock,
            color: 'green',
            description: 'Current cryptographic security rating'
          },
          {
            id: 'collision-prob',
            title: 'Hash Collision Risk',
            value: stats.hashCollisionProbability,
            subtitle: 'Quantum-resistant',
            icon: Target,
            color: 'green',
            description: 'Cryptographic collision probability'
          }
        ];

      case 'detailed':
        return [
          {
            id: 'failure-rate',
            title: 'Failure Rate',
            value: `${derivedMetrics.failureRate}%`,
            subtitle: 'Failed verifications',
            icon: XCircle,
            color: parseFloat(derivedMetrics.failureRate) > 5 ? 'red' : parseFloat(derivedMetrics.failureRate) > 2 ? 'yellow' : 'green',
            description: 'Percentage of verification failures'
          },
          {
            id: 'avg-verifications',
            title: 'Avg Verifications/Certificate',
            value: derivedMetrics.avgVerificationsPerCertificate,
            subtitle: 'Verification frequency',
            icon: BarChart3,
            color: 'blue',
            description: 'Average verifications per certificate'
          },
          {
            id: 'rate-limit-violations',
            title: 'Rate Limit Violations',
            value: securityMetrics?.rateLimitViolationsPerHour || '0',
            subtitle: 'Per hour',
            icon: Gauge,
            color: 'orange',
            description: 'Rate limiting triggers per hour'
          },
          {
            id: 'tamper-detection-rate',
            title: 'Tamper Detection Rate',
            value: `${securityMetrics?.tamperDetectionRate || '0'}%`,
            subtitle: 'Detection accuracy',
            icon: Shield,
            color: 'purple',
            description: 'Effectiveness of tamper detection'
          }
        ];

      default:
        return [];
    }
  };

  // Get color classes for different states
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      blue: 'text-blue-400 bg-blue-500/20 border-blue-400/30',
      green: 'text-green-400 bg-green-500/20 border-green-400/30',
      yellow: 'text-yellow-400 bg-yellow-500/20 border-yellow-400/30',
      red: 'text-red-400 bg-red-500/20 border-red-400/30',
      purple: 'text-purple-400 bg-purple-500/20 border-purple-400/30',
      orange: 'text-orange-400 bg-orange-500/20 border-orange-400/30'
    };
    return colorMap[color] || colorMap.blue;
  };

  // Animated counter component
  const AnimatedCounter: React.FC<{ 
    value: number; 
    duration?: number; 
    suffix?: string;
  }> = ({ value, duration = 1000, suffix = '' }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      let startTime: number | null = null;
      const startValue = displayValue;
      const difference = value - startValue;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        setDisplayValue(Math.floor(startValue + difference * easeOut));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }, [value, duration, displayValue]);

    return <span>{displayValue.toLocaleString()}{suffix}</span>;
  };

  const statCards = getStatCards();

  return (
    <div className="space-y-6">
      {/* Header with View Selector */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-3"
        >
          <Activity className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Security Statistics</h3>
          <div className="text-sm text-gray-400">
            Updated {lastUpdate.toLocaleTimeString()}
          </div>
        </motion.div>

        <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
          {[
            { id: 'overview', label: 'Overview', icon: PieChart },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'detailed', label: 'Detailed', icon: BarChart3 }
          ].map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              onClick={() => setActiveView(id as 'overview' | 'detailed' | 'security')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                activeView === id
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Statistics Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {statCards.map((card, index) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative p-4 rounded-2xl border backdrop-blur-sm ${getColorClasses(card.color)} ${
                card.critical ? 'ring-2 ring-red-400/50 animate-pulse' : ''
              }`}
              whileHover={{ scale: 1.02, y: -2 }}
              title={card.description}
            >
              {/* Critical indicator */}
              {card.critical && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              )}

              <div className="flex items-center justify-between mb-3">
                <card.icon className="h-6 w-6" />
                {card.trend && (
                  <div className={`flex items-center space-x-1 text-xs ${
                    card.trend === 'up' ? 'text-green-400' : 
                    card.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    <TrendingUp className={`h-3 w-3 ${
                      card.trend === 'down' ? 'rotate-180' : ''
                    }`} />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="text-2xl font-bold text-white">
                  {typeof card.value === 'number' ? (
                    <AnimatedCounter value={card.value} />
                  ) : (
                    card.value
                  )}
                </div>
                <div className="text-xs font-medium opacity-90">{card.title}</div>
                {card.subtitle && (
                  <div className="text-xs opacity-70">{card.subtitle}</div>
                )}
              </div>

              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 bg-black/20 rounded-2xl flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin opacity-50" />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* System Health Indicator */}
      {systemHealth && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/5 rounded-2xl p-4 border border-white/10"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white flex items-center">
              <Zap className="h-5 w-5 mr-2 text-green-400" />
              System Health
            </h4>
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${
              systemHealth.status === 'OPERATIONAL' 
                ? 'bg-green-500/20 text-green-300'
                : 'bg-red-500/20 text-red-300'
            }`}>
              <CheckCircle className="h-4 w-4" />
              <span>{systemHealth.status}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-400">Memory Usage</div>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${(systemHealth.memoryUsage.heapUsed / systemHealth.memoryUsage.heapTotal) * 100}%` 
                    }}
                  />
                </div>
                <div className="text-sm text-white">
                  {((systemHealth.memoryUsage.heapUsed / systemHealth.memoryUsage.heapTotal) * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-400">Heap Memory</div>
              <div className="text-white font-semibold">
                {(systemHealth.memoryUsage.heapUsed / 1024 / 1024).toFixed(1)}MB / {(systemHealth.memoryUsage.heapTotal / 1024 / 1024).toFixed(1)}MB
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-400">Last Security Scan</div>
              <div className="text-white font-semibold">
                {new Date(systemHealth.lastSecurityScan).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Hash Collision Probability Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-4 border border-purple-400/30"
      >
        <div className="flex items-center space-x-3 mb-2">
          <Target className="h-5 w-5 text-purple-400" />
          <h4 className="text-lg font-semibold text-white">Cryptographic Security</h4>
        </div>
        <div className="text-sm text-purple-200 mb-2">
          Hash collision probability: <span className="font-mono text-purple-100">{stats.hashCollisionProbability}</span>
        </div>
        <div className="text-xs text-purple-300">
          Military-grade SHA-512 hashing provides quantum-resistant security with effectively zero collision probability.
        </div>
      </motion.div>
    </div>
  );
};

export default SecurityStats;