import React, { useState, useEffect, Suspense, lazy } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, Users, FileText, BarChart3, 
  Shield, Plus, Edit, Trash2, Eye, Download,
  Upload, Search, Filter, RefreshCw, 
  ChevronLeft, ChevronRight, AlertTriangle, DollarSign
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import TemplateModal from './TemplateModal';
import PricingModal from './PricingModal';

const UserManagementDashboard = lazy(() => import('./UserManagementDashboard'));
const UserAnalyticsDashboard = lazy(() => import('./UserAnalyticsDashboard'));

interface Template {
  id: number;
  template_id: string;
  name: string;
  description: string;
  layout: string;
  category: string;
  colors: any;
  fonts: any;
  cert_title: string;
  authority: string;
  is_active: boolean;
  is_premium: boolean;
  usage_count: number;
  last_used: string | null;
  created_by_name: string;
  updated_by_name: string;
  created_at: string;
  updated_at: string;
}

interface PricingPlan {
  id: number;
  plan_name: string;
  display_name: string;
  price: number;
  currency: string;
  certificate_limit: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface TemplateAnalytics {
  template_id: string;
  name: string;
  category: string;
  usage_count: number;
  last_used: string | null;
  certificates_generated: number;
  total_verifications: number;
}

interface AnalyticsSummary {
  totalTemplates: number;
  totalCertificates: number;
  totalVerifications: number;
  averageCertificatesPerTemplate: number;
}

interface AdminDashboardProps {
  apiUrl: string;
  onClose?: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ apiUrl, onClose }) => {
  const { user, token } = useAuth();
  const [activeSection, setActiveSection] = useState<'templates' | 'analytics' | 'users' | 'user-analytics' | 'pricing'>('templates');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [analytics, setAnalytics] = useState<TemplateAnalytics[]>([]);
  const [analyticsSummary, setAnalyticsSummary] = useState<AnalyticsSummary>({
    totalTemplates: 0,
    totalCertificates: 0,
    totalVerifications: 0,
    averageCertificatesPerTemplate: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [error, setError] = useState<string | null>(null);
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<PricingPlan | null>(null);
  const [showPricingModal, setShowPricingModal] = useState(false);

  // Fetch pricing plans
  const fetchPricingPlans = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${apiUrl}/admin/pricing/plans`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPricingPlans(data.plans || []);
      } else {
        console.error('Failed to fetch pricing plans');
      }
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
    }
  };

  // Toggle plan status
  const togglePlanStatus = async (planId: number, currentStatus: boolean) => {
    if (!token) return;
    
    try {
      const response = await fetch(`${apiUrl}/admin/pricing/plans/${planId}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await fetchPricingPlans(); // Refresh the list
      } else {
        console.error('Failed to toggle plan status');
      }
    } catch (error) {
      console.error('Error toggling plan status:', error);
    }
  };

  // Save pricing plan (create or update)
  const savePricingPlan = async (planData: PricingPlan) => {
    if (!token) return;
    
    try {
      const url = editingPlan 
        ? `${apiUrl}/admin/pricing/plans/${editingPlan.id}`
        : `${apiUrl}/admin/pricing/plans`;
      
      const method = editingPlan ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(planData),
      });

      if (response.ok) {
        await fetchPricingPlans(); // Refresh the list
        setShowPricingModal(false);
        setEditingPlan(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save plan');
      }
    } catch (error) {
      console.error('Error saving pricing plan:', error);
      throw error; // Re-throw to let the modal handle the error
    }
  };

  // Check if user is admin
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-400/30 rounded-xl p-6 max-w-md text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-300 mb-2">Access Denied</h2>
          <p className="text-red-200 text-sm mb-4">
            You need administrator privileges to access this dashboard.
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${apiUrl}/admin/templates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      } else {
        throw new Error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      setError('Failed to load templates');
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${apiUrl}/admin/analytics/templates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.analytics || []);
        setAnalyticsSummary(data.summary || {
          totalTemplates: 0,
          totalCertificates: 0,
          totalVerifications: 0,
          averageCertificatesPerTemplate: 0
        });
      } else {
        throw new Error('Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics');
    }
  };

  // Initialize default templates
  const initializeTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/admin/templates/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Templates initialized:', data);
        await fetchTemplates();
      } else {
        throw new Error('Failed to initialize templates');
      }
    } catch (error) {
      console.error('Error initializing templates:', error);
      setError('Failed to initialize templates');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete template
  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`${apiUrl}/admin/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchTemplates();
        await fetchAnalytics();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete template');
    }
  };

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchTemplates(), fetchAnalytics(), fetchPricingPlans()]);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.template_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-black/20 backdrop-blur-md border-r border-white/10 min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <Shield className="h-8 w-8 text-purple-400" />
              <div>
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-sm text-purple-200">Template Management</p>
              </div>
            </div>

            <nav className="space-y-2">
              <button
                onClick={() => setActiveSection('templates')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  activeSection === 'templates'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <FileText className="h-5 w-5" />
                <span>Templates</span>
              </button>

              <button
                onClick={() => setActiveSection('analytics')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  activeSection === 'analytics'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <BarChart3 className="h-5 w-5" />
                <span>Analytics</span>
              </button>

              <button
                onClick={() => setActiveSection('user-analytics')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  activeSection === 'user-analytics'
                    ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <BarChart3 className="h-5 w-5" />
                <span>User Analytics</span>
              </button>

              <button
                onClick={() => setActiveSection('pricing')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  activeSection === 'pricing'
                    ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <DollarSign className="h-5 w-5" />
                <span>Pricing</span>
              </button>

              <button
                onClick={() => setActiveSection('users')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                  activeSection === 'users'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
                }`}
              >
                <Users className="h-5 w-5" />
                <span>Users</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Header */}
          <header className="bg-black/20 backdrop-blur-md border-b border-white/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white capitalize">
                  {activeSection} Management
                </h2>
                <p className="text-gray-400">
                  {activeSection === 'templates' && `${templates.length} templates`}
                  {activeSection === 'analytics' && `${analyticsSummary.totalCertificates} certificates generated`}
                  {activeSection === 'user-analytics' && 'User behavior and engagement insights'}
                  {activeSection === 'pricing' && 'Subscription pricing management'}
                  {activeSection === 'users' && 'User management'}
                </p>
              </div>

              <div className="flex items-center space-x-4">
                {activeSection === 'templates' && (
                  <>
                    <button
                      onClick={initializeTemplates}
                      disabled={isLoading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg text-blue-300 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Initialize</span>
                    </button>

                    <button
                      onClick={() => {
                        setSelectedTemplate(null);
                        setModalMode('create');
                        setShowTemplateModal(true);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-lg text-purple-300 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      <span>New Template</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => {
                    if (activeSection === 'pricing') {
                      fetchPricingPlans();
                    } else {
                      fetchTemplates();
                      fetchAnalytics();
                    }
                  }}
                  disabled={isLoading}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-400/30 rounded-lg text-green-300 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>

                {onClose && (
                  <button
                    onClick={onClose}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-400/30 rounded-lg text-gray-300 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Back</span>
                  </button>
                )}
              </div>
            </div>
          </header>

          {/* Content Area */}
          <div className="p-6">
            {error && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <span className="text-red-300">{error}</span>
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {activeSection === 'templates' && (
                <motion.div
                  key="templates"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Templates Section */}
                  <div className="space-y-6">
                    {/* Search and Filter */}
                    <div className="flex items-center space-x-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search templates..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50"
                        />
                      </div>

                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="pl-10 pr-8 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-400/50"
                        >
                          {categories.map(category => (
                            <option key={category} value={category} className="bg-slate-800">
                              {category === 'all' ? 'All Categories' : (category || '').charAt(0).toUpperCase() + (category || '').slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Templates Grid */}
                    {isLoading ? (
                      <div className="flex items-center justify-center p-12">
                        <div className="flex items-center space-x-3">
                          <RefreshCw className="h-6 w-6 text-purple-400 animate-spin" />
                          <span className="text-white">Loading templates...</span>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTemplates.map((template) => (
                          <motion.div
                            key={template.template_id}
                            layout
                            className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-purple-400/30 transition-all"
                          >
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="text-lg font-semibold text-white mb-1">
                                  {template.name}
                                </h3>
                                <p className="text-sm text-gray-400 mb-2">
                                  {template.template_id}
                                </p>
                                <div className="flex items-center space-x-2">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    template.category === 'healthcare' ? 'bg-red-500/20 text-red-300' :
                                    template.category === 'financial' ? 'bg-yellow-500/20 text-yellow-300' :
                                    template.category === 'education' ? 'bg-blue-500/20 text-blue-300' :
                                    template.category === 'professional' ? 'bg-green-500/20 text-green-300' :
                                    'bg-gray-500/20 text-gray-300'
                                  }`}>
                                    {template.category}
                                  </span>
                                  {template.is_premium && (
                                    <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs font-medium">
                                      Premium
                                    </span>
                                  )}
                                  {!template.is_active && (
                                    <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded text-xs font-medium">
                                      Inactive
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2 mb-4">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Usage Count:</span>
                                <span className="text-white">{template.usage_count}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Last Used:</span>
                                <span className="text-white">
                                  {template.last_used ? new Date(template.last_used).toLocaleDateString() : 'Never'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedTemplate(template);
                                  setModalMode('view');
                                  setShowTemplateModal(true);
                                }}
                                className="flex items-center space-x-1 px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded text-blue-300 text-sm transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                                <span>View</span>
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedTemplate(template);
                                  setModalMode('edit');
                                  setShowTemplateModal(true);
                                }}
                                className="flex items-center space-x-1 px-3 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/30 rounded text-yellow-300 text-sm transition-colors"
                              >
                                <Edit className="h-4 w-4" />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => deleteTemplate(template.template_id)}
                                className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-400/30 rounded text-red-300 text-sm transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    {filteredTemplates.length === 0 && !isLoading && (
                      <div className="text-center p-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-300 mb-2">No templates found</h3>
                        <p className="text-gray-400 mb-4">
                          {searchTerm || filterCategory !== 'all' 
                            ? 'Try adjusting your search or filter criteria'
                            : 'Get started by initializing default templates or creating a new one'
                          }
                        </p>
                        {(!searchTerm && filterCategory === 'all') && (
                          <button
                            onClick={initializeTemplates}
                            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/30 rounded-lg text-purple-300 transition-colors"
                          >
                            Initialize Default Templates
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeSection === 'analytics' && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Analytics Section */}
                  <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Total Templates</p>
                            <p className="text-2xl font-bold text-white">{analyticsSummary.totalTemplates}</p>
                          </div>
                          <FileText className="h-8 w-8 text-purple-400" />
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Certificates Generated</p>
                            <p className="text-2xl font-bold text-white">{analyticsSummary.totalCertificates}</p>
                          </div>
                          <Shield className="h-8 w-8 text-green-400" />
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Total Verifications</p>
                            <p className="text-2xl font-bold text-white">{analyticsSummary.totalVerifications}</p>
                          </div>
                          <BarChart3 className="h-8 w-8 text-blue-400" />
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-gray-400 text-sm">Avg. per Template</p>
                            <p className="text-2xl font-bold text-white">{analyticsSummary.averageCertificatesPerTemplate}</p>
                          </div>
                          <Settings className="h-8 w-8 text-yellow-400" />
                        </div>
                      </div>
                    </div>

                    {/* Template Analytics Table */}
                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                      <div className="p-6 border-b border-white/10">
                        <h3 className="text-lg font-semibold text-white">Template Performance</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-white/5">
                            <tr>
                              <th className="text-left p-4 text-gray-300 font-medium">Template</th>
                              <th className="text-left p-4 text-gray-300 font-medium">Category</th>
                              <th className="text-left p-4 text-gray-300 font-medium">Usage Count</th>
                              <th className="text-left p-4 text-gray-300 font-medium">Certificates</th>
                              <th className="text-left p-4 text-gray-300 font-medium">Verifications</th>
                              <th className="text-left p-4 text-gray-300 font-medium">Last Used</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.map((item, index) => (
                              <tr key={item.template_id} className="border-t border-white/10">
                                <td className="p-4">
                                  <div>
                                    <div className="text-white font-medium">{item.name}</div>
                                    <div className="text-gray-400 text-sm">{item.template_id}</div>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    item.category === 'healthcare' ? 'bg-red-500/20 text-red-300' :
                                    item.category === 'financial' ? 'bg-yellow-500/20 text-yellow-300' :
                                    item.category === 'education' ? 'bg-blue-500/20 text-blue-300' :
                                    item.category === 'professional' ? 'bg-green-500/20 text-green-300' :
                                    'bg-gray-500/20 text-gray-300'
                                  }`}>
                                    {item.category}
                                  </span>
                                </td>
                                <td className="p-4 text-white">{item.usage_count}</td>
                                <td className="p-4 text-white">{item.certificates_generated}</td>
                                <td className="p-4 text-white">{item.total_verifications}</td>
                                <td className="p-4 text-gray-400">
                                  {item.last_used ? new Date(item.last_used).toLocaleDateString() : 'Never'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeSection === 'user-analytics' && (
                <motion.div
                  key="user-analytics"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Suspense fallback={
                    <div className="flex items-center justify-center p-8">
                      <div className="flex items-center space-x-3">
                        <RefreshCw className="h-6 w-6 text-green-400 animate-spin" />
                        <span className="text-white">Loading user analytics...</span>
                      </div>
                    </div>
                  }>
                    <UserAnalyticsDashboard
                      apiUrl={apiUrl}
                      token={token || ''}
                    />
                  </Suspense>
                </motion.div>
              )}

              {activeSection === 'pricing' && (
                <motion.div
                  key="pricing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Pricing Plans Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pricingPlans.map((plan) => (
                      <motion.div
                        key={plan.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`bg-white/5 border rounded-xl p-6 ${
                          plan.is_active 
                            ? 'border-green-400/30' 
                            : 'border-gray-600/30 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white">{plan.display_name}</h3>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              plan.is_active 
                                ? 'bg-green-500/20 text-green-300' 
                                : 'bg-gray-500/20 text-gray-300'
                            }`}>
                              {plan.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <button
                              onClick={() => {
                                setEditingPlan(plan);
                                setShowPricingModal(true);
                              }}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              <Edit className="h-4 w-4 text-gray-400" />
                            </button>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <div className="text-2xl font-bold text-white">
                            {plan.currency}{plan.price}
                            <span className="text-sm text-gray-400">/month</span>
                          </div>
                          <div className="text-sm text-gray-300">
                            {plan.certificate_limit} certificates/month
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          {plan.features.map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                              <span className="text-sm text-gray-300">{feature}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                              plan.is_active
                                ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                                : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                            }`}
                          >
                            {plan.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Add New Plan Button */}
                  <motion.button
                    onClick={() => {
                      setEditingPlan(null);
                      setShowPricingModal(true);
                    }}
                    className="w-full p-6 border-2 border-dashed border-gray-600 rounded-xl hover:border-green-400/50 hover:bg-green-500/5 transition-colors group"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <Plus className="h-8 w-8 text-gray-400 group-hover:text-green-400" />
                      <span className="text-gray-400 group-hover:text-green-400 font-medium">
                        Add New Pricing Plan
                      </span>
                    </div>
                  </motion.button>
                </motion.div>
              )}

              {activeSection === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <Suspense fallback={
                    <div className="flex items-center justify-center p-8">
                      <div className="flex items-center space-x-3">
                        <RefreshCw className="h-6 w-6 text-green-400 animate-spin" />
                        <span className="text-white">Loading user management...</span>
                      </div>
                    </div>
                  }>
                    <UserManagementDashboard
                      apiUrl={apiUrl}
                      token={token || ''}
                    />
                  </Suspense>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Template Modal */}
      <TemplateModal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setSelectedTemplate(null);
          setError(null);
        }}
        template={selectedTemplate}
        mode={modalMode}
        apiUrl={apiUrl}
        token={token!}
        onSuccess={() => {
          fetchTemplates();
          fetchAnalytics();
        }}
      />

      {/* Pricing Modal */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => {
          setShowPricingModal(false);
          setEditingPlan(null);
          setError(null);
        }}
        plan={editingPlan}
        onSave={savePricingPlan}
      />
    </div>
  );
};

export default AdminDashboard;