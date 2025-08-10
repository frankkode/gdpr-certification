import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Users, Search, Filter, MoreVertical, Mail, Lock, 
  UserCheck, UserX, Shield, Calendar, Eye, Trash2,
  Edit, Download, RefreshCw, AlertTriangle, CheckCircle,
  X, Plus, Settings, Activity, BarChart, TrendingUp
} from 'lucide-react';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  subscriptionTier: string;
  subscriptionExpires: string;
  createdAt: string;
  lastLogin: string;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  gdprConsent: boolean;
  gdprConsentDate: string;
  certificateCount: number;
  paymentStatus: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  verifiedUsers: number;
  subscribedUsers: number;
  newUsersThisMonth: number;
  growthRate: number;
}

interface UserManagementDashboardProps {
  apiUrl: string;
  token: string;
}

const UserManagementDashboard: React.FC<UserManagementDashboardProps> = ({ 
  apiUrl, 
  token 
}) => {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    verifiedUsers: 0,
    subscribedUsers: 0,
    newUsersThisMonth: 0,
    growthRate: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter, roleFilter, subscriptionFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch(`${apiUrl}/admin/users/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Map the backend response to frontend interface
        const mappedStats: UserStats = {
          totalUsers: parseInt(data.stats?.total_users || '0'),
          activeUsers: parseInt(data.stats?.active_users || '0'),
          verifiedUsers: parseInt(data.stats?.verified_users || '0'),
          subscribedUsers: parseInt(data.stats?.premium_users || '0') + parseInt(data.stats?.enterprise_users || '0'),
          newUsersThisMonth: parseInt(data.stats?.new_users_30d || '0'),
          growthRate: calculateGrowthRate(
            parseInt(data.stats?.new_users_30d || '0'),
            parseInt(data.stats?.total_users || '0')
          )
        };
        
        setUserStats(mappedStats);
      } else {
        console.error('Failed to fetch user stats, using defaults');
        // Keep existing default values if API fails
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Keep existing default values if fetch fails
    }
  };

  const calculateGrowthRate = (newUsers: number, totalUsers: number): number => {
    if (totalUsers === 0) return 0;
    const previousTotal = totalUsers - newUsers;
    if (previousTotal === 0) return 100;
    return Math.round(((newUsers / previousTotal) * 100) * 100) / 100;
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.lastName || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        switch (statusFilter) {
          case 'active':
            return user.isActive && user.isVerified;
          case 'inactive':
            return !user.isActive;
          case 'unverified':
            return !user.isVerified;
          case 'locked':
            return user.lockedUntil && new Date(user.lockedUntil) > new Date();
          default:
            return true;
        }
      });
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => (user.role || 'user') === roleFilter);
    }

    // Subscription filter
    if (subscriptionFilter !== 'all') {
      filtered = filtered.filter(user => (user.subscriptionTier || 'free') === subscriptionFilter);
    }

    setFilteredUsers(filtered);
  };

  const updateUserStatus = async (userId: number, isActive: boolean) => {
    try {
      const response = await fetch(`${apiUrl}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive })
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  const updateUserRole = async (userId: number, role: string) => {
    try {
      const response = await fetch(`${apiUrl}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role })
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const unlockUser = async (userId: number) => {
    try {
      const response = await fetch(`${apiUrl}/admin/users/${userId}/unlock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Error unlocking user:', error);
    }
  };

  const resendVerificationEmail = async (userId: number) => {
    try {
      const response = await fetch(`${apiUrl}/admin/users/${userId}/resend-verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Show success message
        console.log('Verification email sent');
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
    }
  };

  const deleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        const response = await fetch(`${apiUrl}/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          fetchUsers();
        }
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const exportUsers = async () => {
    try {
      const response = await fetch(`${apiUrl}/admin/users/export`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting users:', error);
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-300">Locked</span>;
    }
    if (!user.isVerified) {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-300">Unverified</span>;
    }
    if (!user.isActive) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-500/20 text-gray-300">Inactive</span>;
    }
    return <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-300">Active</span>;
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-purple-500/20 text-purple-300',
      premium: 'bg-blue-500/20 text-blue-300',
      user: 'bg-gray-500/20 text-gray-300'
    };
    const safeRole = role || 'user';
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[safeRole as keyof typeof colors] || colors.user}`}>
        {safeRole.charAt(0).toUpperCase() + safeRole.slice(1)}
      </span>
    );
  };

  const getSubscriptionBadge = (tier: string) => {
    const colors = {
      enterprise: 'bg-gold-500/20 text-yellow-300',
      professional: 'bg-green-500/20 text-green-300',
      premium: 'bg-blue-500/20 text-blue-300',
      free: 'bg-gray-500/20 text-gray-300'
    };
    const safeTier = tier || 'free';
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[safeTier as keyof typeof colors] || colors.free}`}>
        {safeTier.charAt(0).toUpperCase() + safeTier.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="flex items-center space-x-3">
          <RefreshCw className="h-6 w-6 text-green-400 animate-spin" />
          <span className="text-white">Loading users...</span>
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
            <Users className="h-8 w-8 text-green-400 mr-3" />
            User Management
          </h1>
          <p className="text-gray-400 mt-1">Manage users, roles, and permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportUsers}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-lg hover:bg-blue-500/30 transition"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          <button
            onClick={fetchUsers}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 border border-green-400/30 text-green-300 rounded-lg hover:bg-green-500/30 transition"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-400" />
            <div className="ml-3">
              <p className="text-sm text-gray-400">Total Users</p>
              <p className="text-xl font-bold text-white">{userStats.totalUsers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center">
            <UserCheck className="h-8 w-8 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-gray-400">Active</p>
              <p className="text-xl font-bold text-white">{userStats.activeUsers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-gray-400">Verified</p>
              <p className="text-xl font-bold text-white">{userStats.verifiedUsers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-purple-400" />
            <div className="ml-3">
              <p className="text-sm text-gray-400">Subscribed</p>
              <p className="text-xl font-bold text-white">{userStats.subscribedUsers}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center">
            <Plus className="h-8 w-8 text-blue-400" />
            <div className="ml-3">
              <p className="text-sm text-gray-400">New This Month</p>
              <p className="text-xl font-bold text-white">{userStats.newUsersThisMonth}</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-gray-400">Growth Rate</p>
              <p className="text-xl font-bold text-white">{userStats.growthRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-400"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="unverified">Unverified</option>
            <option value="locked">Locked</option>
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-400"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="premium">Premium</option>
            <option value="user">User</option>
          </select>

          <select
            value={subscriptionFilter}
            onChange={(e) => setSubscriptionFilter(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-400"
          >
            <option value="all">All Subscriptions</option>
            <option value="enterprise">Enterprise</option>
            <option value="professional">Professional</option>
            <option value="free">Free</option>
          </select>

          <button
            onClick={() => {
              setSearchTerm('');
              setStatusFilter('all');
              setRoleFilter('all');
              setSubscriptionFilter('all');
            }}
            className="px-4 py-2 bg-gray-500/20 border border-gray-400/30 text-gray-300 rounded-lg hover:bg-gray-500/30 transition"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left p-4 text-sm font-medium text-gray-300">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="rounded border-gray-600 bg-gray-700 text-green-400 focus:ring-green-400"
                  />
                </th>
                <th className="text-left p-4 text-sm font-medium text-gray-300">User</th>
                <th className="text-left p-4 text-sm font-medium text-gray-300">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-300">Role</th>
                <th className="text-left p-4 text-sm font-medium text-gray-300">Subscription</th>
                <th className="text-left p-4 text-sm font-medium text-gray-300">Certificates</th>
                <th className="text-left p-4 text-sm font-medium text-gray-300">Last Login</th>
                <th className="text-left p-4 text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t border-white/10 hover:bg-white/5">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                      className="rounded border-gray-600 bg-gray-700 text-green-400 focus:ring-green-400"
                    />
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-white">{(user.firstName || '')} {(user.lastName || '')}</div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                    </div>
                  </td>
                  <td className="p-4">{getStatusBadge(user)}</td>
                  <td className="p-4">{getRoleBadge(user.role)}</td>
                  <td className="p-4">{getSubscriptionBadge(user.subscriptionTier)}</td>
                  <td className="p-4 text-white">{user.certificateCount}</td>
                  <td className="p-4 text-gray-400 text-sm">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="p-1 text-blue-400 hover:text-blue-300 transition"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => updateUserStatus(user.id, !user.isActive)}
                        className="p-1 text-green-400 hover:text-green-300 transition"
                        title={user.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      {user.lockedUntil && new Date(user.lockedUntil) > new Date() && (
                        <button
                          onClick={() => unlockUser(user.id)}
                          className="p-1 text-yellow-400 hover:text-yellow-300 transition"
                          title="Unlock User"
                        >
                          <Lock className="h-4 w-4" />
                        </button>
                      )}
                      {!user.isVerified && (
                        <button
                          onClick={() => resendVerificationEmail(user.id)}
                          className="p-1 text-purple-400 hover:text-purple-300 transition"
                          title="Resend Verification"
                        >
                          <Mail className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="p-1 text-red-400 hover:text-red-300 transition"
                        title="Delete User"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No users found matching your criteria</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">User Details</h2>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                    <p className="text-white">{selectedUser.firstName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                    <p className="text-white">{selectedUser.lastName}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <p className="text-white">{selectedUser.email}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                    <select
                      value={selectedUser.role}
                      onChange={(e) => updateUserRole(selectedUser.id, e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-400"
                    >
                      <option value="user">User</option>
                      <option value="premium">Premium</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(selectedUser)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Subscription</label>
                    <p className="text-white">{selectedUser.subscriptionTier}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Certificates Generated</label>
                    <p className="text-white">{selectedUser.certificateCount}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Created</label>
                    <p className="text-white">{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Last Login</label>
                    <p className="text-white">
                      {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">GDPR Consent</label>
                  <div className="flex items-center space-x-2">
                    {selectedUser.gdprConsent ? (
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    ) : (
                      <X className="h-5 w-5 text-red-400" />
                    )}
                    <span className="text-white">
                      {selectedUser.gdprConsent ? 'Granted' : 'Not granted'}
                    </span>
                    {selectedUser.gdprConsentDate && (
                      <span className="text-gray-400 text-sm">
                        ({new Date(selectedUser.gdprConsentDate).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserManagementDashboard;