import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette, Plus, Edit, Trash2, 
  Save, X, Crown,
  CheckCircle, AlertTriangle, RefreshCw, Star
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface UserTemplate {
  id: number;
  template_id: string;
  name: string;
  description: string;
  layout: string;
  category: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  fonts: {
    title: string;
    body: string;
    accent: string;
  };
  logo_url?: string;
  signature_url?: string;
  background_template?: string;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface SubscriberDashboardProps {
  apiUrl: string;
}

const SubscriberDashboard: React.FC<SubscriberDashboardProps> = ({ apiUrl }) => {
  const { user, token } = useAuth();
  
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-templates' | 'create-template'>('my-templates');
  const [selectedTemplate, setSelectedTemplate] = useState<UserTemplate | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Error handling and loading states
  const [createError, setCreateError] = useState<string>('');
  const [createSuccess, setCreateSuccess] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  
  // Template creation/editing form state
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'professional',
    colors: {
      primary: '#1e3a8a',
      secondary: '#d97706', 
      accent: '#059669',
      background: '#ffffff'
    },
    fonts: {
      title: 'Inter',
      body: 'Inter',
      accent: 'Inter'
    },
    backgroundTemplate: null as File | null,
    logo: {
      file: null as File | null,
      enabled: false,
      position: 'top-left',
      size: { width: 80, height: 80 }
    },
    signature: {
      file: null as File | null,
      enabled: false,
      position: 'bottom-right',
      size: { width: 150, height: 60 }
    }
  });

  const [subscriptionInfo, setSubscriptionInfo] = useState<{
    tier: string;
    expires: string;
    templatesUsed: number;
    templatesLimit: number;
    certificatesUsed: number;
    certificatesLimit: number;
    certificatesRemaining: number;
    features: string[];
  } | null>(null);

  // Fetch user's templates
  const fetchUserTemplates = async () => {
    if (!token) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(`${apiUrl}/user/templates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching user templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch subscription information
  const fetchSubscriptionInfo = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`${apiUrl}/user/subscription`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscriptionInfo(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription info:', error);
    }
  };

  // Create new template with comprehensive error handling
  const createTemplate = async () => {
    if (!token) return;
    
    // Clear previous messages
    setCreateError('');
    setCreateSuccess('');
    
    // Form validation
    if (!templateForm.name.trim()) {
      setCreateError('Template name is required');
      return;
    }
    
    if (templateForm.name.length < 3) {
      setCreateError('Template name must be at least 3 characters long');
      return;
    }
    
    if (templateForm.name.length > 100) {
      setCreateError('Template name must be less than 100 characters');
      return;
    }
    
    if (!templateForm.description.trim()) {
      setCreateError('Template description is required');
      return;
    }
    
    // File size validation
    const maxFileSize = 5 * 1024 * 1024; // 5MB
    
    if (templateForm.backgroundTemplate && templateForm.backgroundTemplate.size > maxFileSize) {
      setCreateError('Background template file must be less than 5MB');
      return;
    }
    
    if (templateForm.logo?.file && templateForm.logo.file.size > maxFileSize) {
      setCreateError('Logo file must be less than 5MB');
      return;
    }
    
    if (templateForm.signature?.file && templateForm.signature.file.size > maxFileSize) {
      setCreateError('Signature file must be less than 5MB');
      return;
    }
    
    // File type validation
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    
    if (templateForm.logo?.file && !allowedImageTypes.includes(templateForm.logo.file.type)) {
      setCreateError('Logo must be a valid image file (JPEG, PNG, or GIF)');
      return;
    }
    
    if (templateForm.signature?.file && !allowedImageTypes.includes(templateForm.signature.file.type)) {
      setCreateError('Signature must be a valid image file (JPEG, PNG, or GIF)');
      return;
    }
    
    setIsCreating(true);
    
    try {
      const formData = new FormData();
      
      // Add basic form fields
      formData.append('name', templateForm.name.trim());
      formData.append('description', templateForm.description.trim());
      formData.append('category', templateForm.category);
      formData.append('colors', JSON.stringify(templateForm.colors));
      formData.append('fonts', JSON.stringify(templateForm.fonts));
      
      // Add file uploads if present
      if (templateForm.backgroundTemplate) {
        formData.append('backgroundTemplate', templateForm.backgroundTemplate);
      }
      if (templateForm.logo?.file) {
        formData.append('logo', templateForm.logo.file);
      }
      if (templateForm.signature?.file) {
        formData.append('signature', templateForm.signature.file);
      }
      
      // Send logo and signature configurations
      formData.append('logoConfig', JSON.stringify({
        enabled: templateForm.logo?.enabled || false,
        position: templateForm.logo?.position || 'top-left',
        size: templateForm.logo?.size || { width: 80, height: 80 }
      }));
      formData.append('signatureConfig', JSON.stringify({
        enabled: templateForm.signature?.enabled || false,
        position: templateForm.signature?.position || 'bottom-right',
        size: templateForm.signature?.size || { width: 150, height: 60 }
      }));

      const response = await fetch(`${apiUrl}/user/templates`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Note: Don't set Content-Type when using FormData
        },
        body: formData
      });

      if (response.ok) {
        setCreateSuccess('Template created successfully!');
        fetchUserTemplates();
        
        // Reset form
        setTemplateForm({
          name: '',
          description: '',
          category: 'professional',
          colors: {
            primary: '#1e3a8a',
            secondary: '#d97706',
            accent: '#059669', 
            background: '#ffffff'
          },
          fonts: {
            title: 'Inter',
            body: 'Inter',
            accent: 'Inter'
          },
          backgroundTemplate: null,
          logo: {
            file: null,
            enabled: false,
            position: 'top-left',
            size: { width: 80, height: 80 }
          },
          signature: {
            file: null,
            enabled: false,
            position: 'bottom-right',
            size: { width: 150, height: 60 }
          }
        });
        
        // Clear success message after 3 seconds
        setTimeout(() => setCreateSuccess(''), 3000);
        
      } else {
        // Handle specific error responses
        let errorMessage = 'Failed to create template';
        
        try {
          const errorData = await response.json();
          
          if (response.status === 400) {
            errorMessage = errorData.error || errorData.message || 'Invalid template data provided';
          } else if (response.status === 401) {
            errorMessage = 'Authentication failed. Please log in again.';
          } else if (response.status === 403) {
            errorMessage = 'You don\'t have permission to create templates. Please upgrade your subscription.';
          } else if (response.status === 409) {
            errorMessage = 'A template with this name already exists. Please choose a different name.';
          } else if (response.status === 413) {
            errorMessage = 'File size too large. Please use smaller images.';
          } else if (response.status === 415) {
            errorMessage = 'Unsupported file type. Please use JPEG, PNG, or GIF images.';
          } else if (response.status === 429) {
            errorMessage = 'Too many requests. Please wait a moment and try again.';
          } else if (response.status >= 500) {
            errorMessage = 'Server error occurred. Please try again later.';
          } else {
            errorMessage = errorData.error || errorData.message || `Error: ${response.status}`;
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          errorMessage = `Server returned status ${response.status}. Please try again.`;
        }
        
        setCreateError(errorMessage);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        setCreateError('Network error. Please check your internet connection and try again.');
      } else {
        setCreateError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  // Delete template
  const deleteTemplate = async (templateId: string) => {
    if (!token || !confirm('Are you sure you want to delete this template?')) return;
    
    try {
      const response = await fetch(`${apiUrl}/user/templates/${templateId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        fetchUserTemplates();
      }
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const updateTemplate = async () => {
    if (!token || !selectedTemplate) return;
    
    try {
      setIsLoading(true);
      
      const formData = new FormData();
      formData.append('name', templateForm.name);
      formData.append('description', templateForm.description);
      formData.append('category', templateForm.category);
      formData.append('colors', JSON.stringify(templateForm.colors));
      formData.append('fonts', JSON.stringify(templateForm.fonts));
      
      // Add files if selected
      if (templateForm.backgroundTemplate) {
        formData.append('backgroundTemplate', templateForm.backgroundTemplate);
      }
      if (templateForm.logo?.file) {
        formData.append('logo', templateForm.logo.file);
      }
      if (templateForm.signature?.file) {
        formData.append('signature', templateForm.signature.file);
      }
      
      // Send logo and signature configurations
      formData.append('logoConfig', JSON.stringify({
        enabled: templateForm.logo?.enabled || false,
        position: templateForm.logo?.position || 'top-left',
        size: templateForm.logo?.size || { width: 80, height: 80 }
      }));
      formData.append('signatureConfig', JSON.stringify({
        enabled: templateForm.signature?.enabled || false,
        position: templateForm.signature?.position || 'bottom-right',
        size: templateForm.signature?.size || { width: 150, height: 60 }
      }));

      const response = await fetch(`${apiUrl}/user/templates/${selectedTemplate.template_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        setShowEditModal(false);
        fetchUserTemplates();
        // Reset form
        setTemplateForm({
          name: '',
          description: '',
          category: 'professional',
          colors: {
            primary: '#1e3a8a',
            secondary: '#d97706', 
            accent: '#059669',
            background: '#ffffff'
          },
          fonts: {
            title: 'Inter',
            body: 'Inter',
            accent: 'Inter'
          },
          backgroundTemplate: null,
          logo: {
            file: null,
            enabled: false,
            position: 'top-left',
            size: { width: 80, height: 80 }
          },
          signature: {
            file: null,
            enabled: false,
            position: 'bottom-right',
            size: { width: 150, height: 60 }
          }
        });
      } else {
        const errorData = await response.json();
        console.error('Error updating template:', errorData);
        alert('Failed to update template: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Failed to update template');
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    fetchUserTemplates();
    fetchSubscriptionInfo();
  }, [token]);

  if (!user || !user.subscriptionTier || user.subscriptionTier === 'free') {
    return (
      <div className="bg-yellow-500/10 border border-yellow-400/30 rounded-lg p-6">
        <div className="flex items-start space-x-4">
          <AlertTriangle className="h-6 w-6 text-yellow-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-yellow-300 mb-2">Subscription Required</h3>
            <p className="text-yellow-200 mb-4">
              The subscriber dashboard is only available for Professional, Premium, and Enterprise subscribers.
            </p>
            <button
              onClick={() => window.open('/payment', '_blank')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200"
            >
              Upgrade Your Plan
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Crown className="h-8 w-8 text-yellow-400 mr-3" />
            My Templates
          </h1>
          <p className="text-gray-400 mt-1">Create and manage your custom certificate templates</p>
        </div>
        <div className="flex items-center space-x-3">
          {subscriptionInfo && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-green-500/20 border border-green-400/30 rounded-lg">
              <Star className="h-4 w-4 text-green-400" />
              <span className="text-sm font-medium text-green-300 capitalize">
                {subscriptionInfo.tier} Plan
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-1">
        <div className="flex space-x-1">
          {[
            { id: 'my-templates', label: 'My Templates', icon: Palette },
            { id: 'create-template', label: 'Create Template', icon: Plus }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'my-templates' && (
            <div className="space-y-4">
              {/* Templates Grid */}
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="flex items-center space-x-3">
                    <RefreshCw className="h-6 w-6 text-green-400 animate-spin" />
                    <span className="text-white">Loading your templates...</span>
                  </div>
                </div>
              ) : userTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <Palette className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Custom Templates</h3>
                  <p className="text-gray-400 mb-4">Create your first custom certificate template to get started.</p>
                  <button
                    onClick={() => setActiveTab('create-template')}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Create Template
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {userTemplates.map((template) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-white/20 transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{template.name}</h3>
                          <p className="text-sm text-gray-400 mt-1">{template.description}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedTemplate(template);
                              // Populate form with template data
                              setTemplateForm({
                                name: template.name,
                                description: template.description,
                                category: template.category,
                                colors: template.colors,
                                fonts: template.fonts,
                                backgroundTemplate: null,
                                logo: {
                                  file: null,
                                  enabled: false,
                                  position: 'top-left',
                                  size: { width: 80, height: 80 }
                                },
                                signature: {
                                  file: null,
                                  enabled: false,
                                  position: 'bottom-right',
                                  size: { width: 150, height: 60 }
                                }
                              });
                              setShowEditModal(true);
                            }}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-all"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteTemplate(template.template_id)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Color Palette Preview */}
                      <div className="flex items-center space-x-2 mb-4">
                        <span className="text-xs text-gray-400">Colors:</span>
                        <div className="flex space-x-1">
                          {Object.values(template.colors).map((color, index) => (
                            <div
                              key={index}
                              className="w-4 h-4 rounded-full border border-white/20"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">
                          Created: {new Date(template.created_at).toLocaleDateString()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          template.is_active 
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create-template' && (
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Create Custom Template</h2>
              
              {/* Error Message */}
              {createError && (
                <div className="mb-4 p-4 bg-red-500/10 border border-red-400/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-300">{createError}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {createSuccess && (
                <div className="mb-4 p-4 bg-green-500/10 border border-green-400/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                    <p className="text-green-300">{createSuccess}</p>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Template Name</label>
                    <input
                      type="text"
                      value={templateForm.name}
                      onChange={(e) => {
                        setTemplateForm({ ...templateForm, name: e.target.value });
                        // Clear error when user starts typing
                        if (createError) setCreateError('');
                      }}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                      placeholder="Enter template name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      value={templateForm.description}
                      onChange={(e) => {
                        setTemplateForm({ ...templateForm, description: e.target.value });
                        // Clear error when user starts typing
                        if (createError) setCreateError('');
                      }}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400"
                      placeholder="Describe your template"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                    <select
                      value={templateForm.category}
                      onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-green-400"
                    >
                      <option value="professional">Professional</option>
                      <option value="education">Education</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="financial">Financial</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  {/* Color Customization */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Colors</label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(templateForm.colors).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-xs text-gray-400 mb-1 capitalize">{key}</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={value}
                              onChange={(e) => setTemplateForm({
                                ...templateForm,
                                colors: { ...templateForm.colors, [key]: e.target.value }
                              })}
                              className="w-8 h-8 rounded border border-white/20 bg-transparent"
                            />
                            <input
                              type="text"
                              value={value}
                              onChange={(e) => setTemplateForm({
                                ...templateForm,
                                colors: { ...templateForm.colors, [key]: e.target.value }
                              })}
                              className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* File Uploads */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-300">File Uploads</h3>
                    
                    {/* Background Template Upload */}
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Background Template (PDF)</label>
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setTemplateForm({ ...templateForm, backgroundTemplate: file });
                        }}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-green-500 file:text-white hover:file:bg-green-600"
                      />
                      {templateForm.backgroundTemplate && (
                        <p className="text-xs text-green-400 mt-1">
                          Selected: {templateForm.backgroundTemplate.name}
                        </p>
                      )}
                    </div>

                    {/* Logo Configuration */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <label className="text-xs text-gray-400">Logo</label>
                        <input
                          type="checkbox"
                          checked={templateForm.logo?.enabled || false}
                          onChange={(e) => setTemplateForm({
                            ...templateForm,
                            logo: { 
                              ...(templateForm.logo || { file: null, position: 'top-left', size: { width: 80, height: 80 } }), 
                              enabled: e.target.checked 
                            }
                          })}
                          className="w-4 h-4 text-blue-600 bg-transparent border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-xs text-gray-400">Enable Logo</span>
                      </div>
                      
                      {templateForm.logo?.enabled && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Position</label>
                              <select
                                value={templateForm.logo?.position || 'top-left'}
                                onChange={(e) => setTemplateForm({
                                  ...templateForm,
                                  logo: { 
                                    ...(templateForm.logo || { file: null, enabled: false, size: { width: 80, height: 80 } }), 
                                    position: e.target.value 
                                  }
                                })}
                                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                              >
                                <option value="top-left">Top Left</option>
                                <option value="top-center">Top Center</option>
                                <option value="top-right">Top Right</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Width</label>
                                <input
                                  type="number"
                                  value={templateForm.logo?.size?.width || 80}
                                  onChange={(e) => setTemplateForm({
                                    ...templateForm,
                                    logo: {
                                      ...(templateForm.logo || { file: null, enabled: false, position: 'top-left' }),
                                      size: { 
                                        ...(templateForm.logo?.size || { height: 80 }), 
                                        width: parseInt(e.target.value) || 80 
                                      }
                                    }
                                  })}
                                  min="20"
                                  max="200"
                                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Height</label>
                                <input
                                  type="number"
                                  value={templateForm.logo?.size?.height || 80}
                                  onChange={(e) => setTemplateForm({
                                    ...templateForm,
                                    logo: {
                                      ...(templateForm.logo || { file: null, enabled: false, position: 'top-left' }),
                                      size: { 
                                        ...(templateForm.logo?.size || { width: 80 }), 
                                        height: parseInt(e.target.value) || 80 
                                      }
                                    }
                                  })}
                                  min="20"
                                  max="200"
                                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-400 mb-2">Upload Logo Image</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setTemplateForm({
                                  ...templateForm,
                                  logo: { 
                                    ...(templateForm.logo || { enabled: false, position: 'top-left', size: { width: 80, height: 80 } }), 
                                    file: file 
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-500 file:text-white hover:file:bg-blue-600"
                            />
                            {templateForm.logo?.file && (
                              <p className="text-xs text-blue-400 mt-1">
                                Selected: {templateForm.logo.file.name}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Signature Configuration */}
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <label className="text-xs text-gray-400">Signature</label>
                        <input
                          type="checkbox"
                          checked={templateForm.signature?.enabled || false}
                          onChange={(e) => setTemplateForm({
                            ...templateForm,
                            signature: { 
                              ...(templateForm.signature || { file: null, position: 'bottom-right', size: { width: 150, height: 60 } }), 
                              enabled: e.target.checked 
                            }
                          })}
                          className="w-4 h-4 text-purple-600 bg-transparent border-gray-300 rounded focus:ring-purple-500"
                        />
                        <span className="text-xs text-gray-400">Enable Signature</span>
                      </div>
                      
                      {templateForm.signature?.enabled && (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-gray-400 mb-1">Position</label>
                              <select
                                value={templateForm.signature?.position || 'bottom-right'}
                                onChange={(e) => setTemplateForm({
                                  ...templateForm,
                                  signature: { 
                                    ...(templateForm.signature || { file: null, enabled: false, size: { width: 150, height: 60 } }), 
                                    position: e.target.value 
                                  }
                                })}
                                className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                              >
                                <option value="bottom-left">Bottom Left</option>
                                <option value="bottom-center">Bottom Center</option>
                                <option value="bottom-right">Bottom Right</option>
                              </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Width</label>
                                <input
                                  type="number"
                                  value={templateForm.signature?.size?.width || 150}
                                  onChange={(e) => setTemplateForm({
                                    ...templateForm,
                                    signature: {
                                      ...(templateForm.signature || { file: null, enabled: false, position: 'bottom-right' }),
                                      size: { 
                                        ...(templateForm.signature?.size || { height: 60 }), 
                                        width: parseInt(e.target.value) || 150 
                                      }
                                    }
                                  })}
                                  min="50"
                                  max="300"
                                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-400 mb-1">Height</label>
                                <input
                                  type="number"
                                  value={templateForm.signature?.size?.height || 60}
                                  onChange={(e) => setTemplateForm({
                                    ...templateForm,
                                    signature: {
                                      ...(templateForm.signature || { file: null, enabled: false, position: 'bottom-right' }),
                                      size: { 
                                        ...(templateForm.signature?.size || { width: 150 }), 
                                        height: parseInt(e.target.value) || 60 
                                      }
                                    }
                                  })}
                                  min="20"
                                  max="150"
                                  className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs"
                                />
                              </div>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-xs text-gray-400 mb-2">Upload Signature Image</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setTemplateForm({
                                  ...templateForm,
                                  signature: { 
                                    ...(templateForm.signature || { enabled: false, position: 'bottom-right', size: { width: 150, height: 60 } }), 
                                    file: file 
                                  }
                                });
                              }}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-purple-500 file:text-white hover:file:bg-purple-600"
                            />
                            {templateForm.signature?.file && (
                              <p className="text-xs text-purple-400 mt-1">
                                Selected: {templateForm.signature.file.name}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={createTemplate}
                    disabled={isCreating}
                    className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                  >
                    {isCreating ? (
                      <>
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span>Creating Template...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-5 w-5" />
                        <span>Create Template</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Preview */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Preview</h3>
                  <div 
                    className="aspect-[4/3] rounded-lg border-2 border-dashed border-white/20 p-4 flex items-center justify-center"
                    style={{ backgroundColor: templateForm.colors.background }}
                  >
                    <div className="text-center">
                      <div 
                        className="text-xl font-bold mb-2"
                        style={{ color: templateForm.colors.primary }}
                      >
                        {templateForm.name || 'Template Preview'}
                      </div>
                      <div 
                        className="text-sm"
                        style={{ color: templateForm.colors.secondary }}
                      >
                        Certificate of Completion
                      </div>
                      <div 
                        className="text-xs mt-2"
                        style={{ color: templateForm.colors.accent }}
                      >
                        {templateForm.description || 'Template description'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Edit Template Modal */}
      <AnimatePresence>
        {showEditModal && selectedTemplate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-xl border border-white/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Edit Template</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-300">Basic Information</h3>
                    
                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Template Name</label>
                      <input
                        type="text"
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                        placeholder="Enter template name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Description</label>
                      <textarea
                        value={templateForm.description}
                        onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white h-20 resize-none"
                        placeholder="Describe your template"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-400 mb-2">Category</label>
                      <select
                        value={templateForm.category}
                        onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                        className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                      >
                        <option value="professional">Professional</option>
                        <option value="academic">Academic</option>
                        <option value="creative">Creative</option>
                        <option value="corporate">Corporate</option>
                      </select>
                    </div>
                  </div>

                  {/* Colors */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-300">Colors</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(templateForm.colors).map(([colorKey, colorValue]) => (
                        <div key={colorKey}>
                          <label className="block text-xs text-gray-400 mb-2 capitalize">{colorKey}</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={colorValue}
                              onChange={(e) => setTemplateForm({
                                ...templateForm,
                                colors: { ...templateForm.colors, [colorKey]: e.target.value }
                              })}
                              className="w-10 h-8 rounded border border-white/20 bg-transparent"
                            />
                            <input
                              type="text"
                              value={colorValue}
                              onChange={(e) => setTemplateForm({
                                ...templateForm,
                                colors: { ...templateForm.colors, [colorKey]: e.target.value }
                              })}
                              className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fonts */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-300">Fonts</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {Object.entries(templateForm.fonts).map(([fontKey, fontValue]) => (
                        <div key={fontKey}>
                          <label className="block text-xs text-gray-400 mb-2 capitalize">{fontKey} Font</label>
                          <select
                            value={fontValue}
                            onChange={(e) => setTemplateForm({
                              ...templateForm,
                              fonts: { ...templateForm.fonts, [fontKey]: e.target.value }
                            })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                          >
                            <option value="Inter">Inter</option>
                            <option value="Helvetica">Helvetica</option>
                            <option value="Arial">Arial</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Roboto">Roboto</option>
                            <option value="Open Sans">Open Sans</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-white/10">
                    <button
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 text-gray-400 hover:text-white border border-white/20 hover:border-white/40 rounded-lg transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={updateTemplate}
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {isLoading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Update Template</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubscriberDashboard;