import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Users, Activity, TrendingUp, BarChart3, Calendar,
  Download, RefreshCw, Filter, Eye, AlertTriangle,
  UserPlus, UserCheck, Shield, Award, Clock, Globe
} from 'lucide-react';

interface UserAnalyticsProps {
  apiUrl: string;
  token: string;
}

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
    averageSessionTime: string;
    retentionRate: number;
    growthRate: number;
  };
  registrationTrends: Array<{
    date: string;
    count: number;
    cumulative: number;
  }>;
  activityTrends: Array<{
    date: string;
    logins: number;
    certificatesGenerated: number;
    verificationsPerformed: number;
  }>;
  userDistribution: {
    byRole: Array<{ role: string; count: number; percentage: number }>;
    bySubscription: Array<{ tier: string; count: number; percentage: number }>;
    byRegion: Array<{ region: string; count: number; percentage: number }>;
    byDevice: Array<{ device: string; count: number; percentage: number }>;
  };
  topMetrics: {
    mostActiveUsers: Array<{
      id: number;
      name: string;
      email: string;
      certificatesGenerated: number;
      lastActive: string;
    }>;
    recentRegistrations: Array<{
      id: number;
      name: string;
      email: string;
      registeredAt: string;
      verified: boolean;
    }>;
  };
  engagementMetrics: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageCertificatesPerUser: number;
    featureUsage: Array<{
      feature: string;
      usage: number;
      percentage: number;
    }>;
  };
  gdprCompliance: {
    dataRetentionCompliance: number;
    consentManagement: number;
    dataProcessingTransparency: number;
    rightToErasureRequests: number;
  };
}

const UserAnalyticsDashboard: React.FC<UserAnalyticsProps> = ({ apiUrl, token }) => {
  const { t } = useTranslation();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  
  // Default analytics data to prevent undefined errors
  const defaultAnalytics: AnalyticsData = {
    overview: {
      totalUsers: 0,
      activeUsers: 0,
      newUsersToday: 0,
      newUsersThisWeek: 0,
      newUsersThisMonth: 0,
      averageSessionTime: '0m',
      retentionRate: 0,
      growthRate: 0,
    },
    registrationTrends: [],
    activityTrends: [],
    userDistribution: {
      byRole: [],
      bySubscription: [],
      byRegion: [],
      byDevice: [],
    },
    topMetrics: {
      mostActiveUsers: [],
      recentRegistrations: [],
    },
    engagementMetrics: {
      dailyActiveUsers: 0,
      weeklyActiveUsers: 0,
      monthlyActiveUsers: 0,
      averageCertificatesPerUser: 0,
      featureUsage: []
    },
    gdprCompliance: {
      dataRetentionCompliance: 100,
      consentManagement: 100,
      dataProcessingTransparency: 100,
      rightToErasureRequests: 0,
    }
  };
  
  // Use analytics data or fallback to defaults
  const safeAnalytics = analytics || defaultAnalytics;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${apiUrl}/admin/analytics/users?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch analytics');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Analytics fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const exportAnalytics = async () => {
    try {
      const response = await fetch(`${apiUrl}/admin/analytics/export?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const getGrowthIndicator = (value: number) => {
    if (value > 0) {
      return <TrendingUp className="h-4 w-4 text-green-400" />;
    } else if (value < 0) {
      return <TrendingUp className="h-4 w-4 text-red-400 rotate-180" />;
    }
    return <div className="h-4 w-4" />;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      case '1y': return 'Last year';
      default: return 'Last 30 days';
    }
  };

  if (error && !analytics) {
    return (
      <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-400" />
          <div>
            <h3 className="text-red-300 font-medium">Failed to load analytics</h3>
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-3">
          <RefreshCw className="h-6 w-6 text-green-400 animate-spin" />
          <span className="text-white">Loading analytics...</span>
        </div>
      </div>
    );
  }


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <BarChart3 className="h-8 w-8 text-green-400 mr-3" />
            User Analytics
          </h1>
          <p className="text-gray-400 mt-1">Comprehensive insights into user behavior and engagement</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-400"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={exportAnalytics}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-lg hover:bg-blue-500/30 transition"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-400/30 text-green-300 rounded-lg hover:bg-green-500/30 transition"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-white">{formatNumber(safeAnalytics.overview.totalUsers)}</p>
            </div>
            <Users className="h-8 w-8 text-blue-400" />
          </div>
          <div className="flex items-center mt-2 space-x-1">
            {getGrowthIndicator(safeAnalytics.overview.growthRate)}
            <span className={`text-xs ${safeAnalytics.overview.growthRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {safeAnalytics.overview.growthRate > 0 ? '+' : ''}{safeAnalytics.overview.growthRate.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Active Users</p>
              <p className="text-2xl font-bold text-white">{formatNumber(safeAnalytics.overview.activeUsers)}</p>
            </div>
            <Activity className="h-8 w-8 text-green-400" />
          </div>
          <div className="flex items-center mt-2 space-x-1">
            <span className="text-xs text-gray-400">
              {((safeAnalytics.overview.activeUsers / safeAnalytics.overview.totalUsers) * 100).toFixed(1)}% active
            </span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">New This Month</p>
              <p className="text-2xl font-bold text-white">{formatNumber(safeAnalytics.overview.newUsersThisMonth)}</p>
            </div>
            <UserPlus className="h-8 w-8 text-purple-400" />
          </div>
          <div className="flex items-center mt-2 space-x-1">
            <span className="text-xs text-gray-400">
              +{safeAnalytics.overview.newUsersThisWeek} this week
            </span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Retention Rate</p>
              <p className="text-2xl font-bold text-white">{safeAnalytics.overview.retentionRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-orange-400" />
          </div>
          <div className="flex items-center mt-2 space-x-1">
            <span className="text-xs text-gray-400">
              Avg. session: {safeAnalytics.overview.averageSessionTime}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Trends */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Registration Trends</h3>
          <div className="space-y-2">
            {safeAnalytics.registrationTrends.slice(-7).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  {new Date(item.date).toLocaleDateString()}
                </span>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-400 h-2 rounded-full"
                      style={{
                        width: `${Math.min((item.count / Math.max(...safeAnalytics.registrationTrends.map(t => t.count))) * 100, 100)}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-white w-8 text-right">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Distribution */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Distribution</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">By Role</h4>
              {safeAnalytics.userDistribution.byRole.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-400 capitalize">{item.role || 'unknown'}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-white">{item.count}</span>
                    <span className="text-xs text-gray-400">({item.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">By Subscription</h4>
              {safeAnalytics.userDistribution.bySubscription.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-1">
                  <span className="text-sm text-gray-400 capitalize">{item.tier || 'unknown'}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-white">{item.count}</span>
                    <span className="text-xs text-gray-400">({item.percentage.toFixed(1)}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Activity Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Daily Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Daily Active Users</span>
              <span className="text-lg font-semibold text-white">{safeAnalytics.engagementMetrics.dailyActiveUsers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Weekly Active Users</span>
              <span className="text-lg font-semibold text-white">{safeAnalytics.engagementMetrics.weeklyActiveUsers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Monthly Active Users</span>
              <span className="text-lg font-semibold text-white">{safeAnalytics.engagementMetrics.monthlyActiveUsers}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Feature Usage</h3>
          <div className="space-y-2">
            {safeAnalytics.engagementMetrics.featureUsage.map((feature, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{feature.feature}</span>
                  <span className="text-xs text-gray-500">{feature.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-400 h-2 rounded-full"
                    style={{ width: `${feature.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-2 bg-white/5 rounded">
              <Award className="h-4 w-4 text-yellow-400" />
              <div className="flex-1">
                <span className="text-sm text-white">Avg. Certificates per User</span>
                <p className="text-lg font-semibold text-yellow-400">
                  {safeAnalytics.engagementMetrics.averageCertificatesPerUser.toFixed(1)}
                </p>
              </div>
            </div>
            <div className="text-xs text-gray-400">
              Based on {getTimeRangeLabel(timeRange).toLowerCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Top Users and Recent Registrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Most Active Users</h3>
          <div className="space-y-3">
            {safeAnalytics.topMetrics.mostActiveUsers.map((user, index) => (
              <div key={user.id} className="flex items-center space-x-3 p-2 rounded hover:bg-white/5">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index === 0 ? 'bg-yellow-500 text-black' :
                  index === 1 ? 'bg-gray-400 text-black' :
                  index === 2 ? 'bg-amber-600 text-black' :
                  'bg-gray-600 text-gray-300'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{user.name || 'Unknown User'}</p>
                  <p className="text-xs text-gray-400">{user.email || 'No email'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-400">{user.certificatesGenerated}</p>
                  <p className="text-xs text-gray-400">certificates</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Registrations</h3>
          <div className="space-y-3">
            {safeAnalytics.topMetrics.recentRegistrations.map((user) => (
              <div key={user.id} className="flex items-center space-x-3 p-2 rounded hover:bg-white/5">
                <div className={`w-2 h-2 rounded-full ${user.verified ? 'bg-green-400' : 'bg-yellow-400'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{user.name || 'Unknown User'}</p>
                  <p className="text-xs text-gray-400">{user.email || 'No email'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">
                    {new Date(user.registeredAt).toLocaleDateString()}
                  </p>
                  <div className={`text-xs px-2 py-1 rounded ${
                    user.verified ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'
                  }`}>
                    {user.verified ? 'Verified' : 'Pending'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAnalyticsDashboard;