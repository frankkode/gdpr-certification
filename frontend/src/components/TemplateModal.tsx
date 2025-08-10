import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Save, Eye, Palette, Type, Settings, 
  FileText, AlertTriangle, CheckCircle, Upload, Image, Layout
} from 'lucide-react';

interface Template {
  id?: number;
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
    text: string;
  };
  fonts: {
    title: { size: number; font: string };
    subtitle: { size: number; font: string };
    content: { size: number; font: string };
    name: { size: number; font: string };
    course: { size: number; font: string };
  };
  cert_title: string;
  authority: string;
  is_active?: boolean;
  is_premium?: boolean;
  logo?: {
    enabled: boolean;
    position: string;
    size: { width: number; height: number };
    data?: string;
  };
  signature?: {
    enabled: boolean;
    position: string;
    size: { width: number; height: number };
    data?: string;
  };
  background_template?: {
    enabled: boolean;
    type: 'generated' | 'uploaded';
    data?: string;
    filename?: string;
    mimetype?: string;
  };
}

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
  mode: 'create' | 'edit' | 'view';
  apiUrl: string;
  token: string;
  onSuccess: () => void;
}

const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  template,
  mode,
  apiUrl,
  token,
  onSuccess
}) => {
  const [formData, setFormData] = useState<Template>({
    template_id: '',
    name: '',
    description: '',
    layout: 'standard',
    category: 'general',
    colors: {
      primary: '#1e3a8a',
      secondary: '#d97706',
      accent: '#059669',
      background: '#ffffff',
      text: '#374151'
    },
    fonts: {
      title: { size: 48, font: 'Helvetica-Bold' },
      subtitle: { size: 28, font: 'Helvetica' },
      content: { size: 18, font: 'Helvetica' },
      name: { size: 42, font: 'Helvetica-Bold' },
      course: { size: 24, font: 'Helvetica-Bold' }
    },
    cert_title: 'CERTIFICATE',
    authority: 'Certificate Authority',
    is_active: true,
    is_premium: false,
    logo: {
      enabled: false,
      position: 'top-left',
      size: { width: 80, height: 80 },
      data: undefined
    },
    signature: {
      enabled: false,
      position: 'bottom-right',
      size: { width: 150, height: 60 },
      data: undefined
    },
    background_template: {
      enabled: false,
      type: 'generated',
      data: undefined,
      filename: undefined,
      mimetype: undefined
    }
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'general' | 'colors' | 'fonts' | 'assets' | 'background' | 'preview'>('general');

  const layouts = ['standard', 'professional', 'academic', 'corporate', 'modern'];
  const categories = ['general', 'healthcare', 'financial', 'education', 'professional', 'custom'];
  const fontOptions = ['Helvetica', 'Helvetica-Bold', 'Times-Roman', 'Times-Bold', 'Courier', 'Courier-Bold'];

  // Initialize form data when template changes
  useEffect(() => {
    if (template) {
      setFormData({
        ...template,
        colors: typeof template.colors === 'string' ? JSON.parse(template.colors) : template.colors,
        fonts: typeof template.fonts === 'string' ? JSON.parse(template.fonts) : template.fonts,
        // Ensure logo structure with defaults
        logo: {
          enabled: template.logo?.enabled || false,
          position: template.logo?.position || 'top-left',
          size: {
            width: template.logo?.size?.width || 80,
            height: template.logo?.size?.height || 80
          },
          data: template.logo?.data || undefined
        },
        // Ensure signature structure with defaults
        signature: {
          enabled: template.signature?.enabled || false,
          position: template.signature?.position || 'bottom-right',
          size: {
            width: template.signature?.size?.width || 150,
            height: template.signature?.size?.height || 60
          },
          data: template.signature?.data || undefined
        },
        // Ensure background_template structure with defaults
        background_template: {
          enabled: template.background_template?.enabled || false,
          type: template.background_template?.type || 'generated',
          data: template.background_template?.data || undefined,
          filename: template.background_template?.filename || undefined,
          mimetype: template.background_template?.mimetype || undefined
        }
      });
    } else if (mode === 'create') {
      setFormData({
        template_id: '',
        name: '',
        description: '',
        layout: 'standard',
        category: 'general',
        colors: {
          primary: '#1e3a8a',
          secondary: '#d97706',
          accent: '#059669',
          background: '#ffffff',
          text: '#374151'
        },
        fonts: {
          title: { size: 48, font: 'Helvetica-Bold' },
          subtitle: { size: 28, font: 'Helvetica' },
          content: { size: 18, font: 'Helvetica' },
          name: { size: 42, font: 'Helvetica-Bold' },
          course: { size: 24, font: 'Helvetica-Bold' }
        },
        cert_title: 'CERTIFICATE',
        authority: 'Certificate Authority',
        is_active: true,
        is_premium: false
      });
    }
  }, [template, mode]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = (type: 'logo' | 'signature', file: File) => {
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        if (!result) {
          setError('Failed to read the image file');
          return;
        }
        
        const base64Data = result.split(',')[1]; // Remove data:image/... prefix
        if (!base64Data) {
          setError('Invalid image file format');
          return;
        }
        
        setFormData(prev => ({
          ...prev,
          [type]: {
            ...prev[type]!,
            data: base64Data
          }
        }));
        setError(null); // Clear any previous errors
      } catch (error) {
        console.error('Error processing image:', error);
        setError('Failed to process the image file');
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read the image file');
    };
    
    reader.readAsDataURL(file);
  };

  const handleBackgroundTemplateUpload = (file: File) => {
    if (!file) return;
    
    // Validate file type (PDF or images)
    const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a PDF, PNG, or JPEG file');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        if (!result) {
          setError('Failed to read the file');
          return;
        }
        
        const base64Data = result.split(',')[1]; // Remove data: prefix
        if (!base64Data) {
          setError('Invalid file format');
          return;
        }
        
        setFormData(prev => ({
          ...prev,
          background_template: {
            ...prev.background_template!,
            data: base64Data,
            filename: file.name,
            mimetype: file.type,
            type: 'uploaded',
            enabled: true
          }
        }));
        setError(null); // Clear any previous errors
      } catch (error) {
        console.error('Error processing file:', error);
        setError('Failed to process the file');
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read the file');
    };
    
    reader.readAsDataURL(file);
  };

  const handleAssetChange = (type: 'logo' | 'signature', field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [type]: {
        ...prev[type]!,
        [field]: value
      }
    }));
  };

  const handleColorChange = (colorKey: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: value
      }
    }));
  };

  const handleFontChange = (fontKey: string, property: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      fonts: {
        ...prev.fonts,
        [fontKey]: {
          ...prev.fonts[fontKey as keyof typeof prev.fonts],
          [property]: value
        }
      }
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.template_id.trim()) return 'Template ID is required';
    if (!/^[a-z0-9_]+$/.test(formData.template_id)) return 'Template ID must contain only lowercase letters, numbers, and underscores';
    if (!formData.name.trim()) return 'Template name is required';
    if (formData.name.length < 3) return 'Template name must be at least 3 characters';
    if (!formData.cert_title.trim()) return 'Certificate title is required';
    if (!formData.authority.trim()) return 'Authority is required';
    return null;
  };

  const generateTemplateId = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Generate template_id for new templates
      const submitData = { 
        ...formData,
        template_id: mode === 'create' ? generateTemplateId(formData.name) : formData.template_id
      };

      const url = mode === 'create' 
        ? `${apiUrl}/admin/templates`
        : `${apiUrl}/admin/templates/${template?.template_id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Template ${mode === 'create' ? 'created' : 'updated'} successfully!`);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${mode} template`);
      }
    } catch (error) {
      console.error(`Error ${mode}ing template:`, error);
      setError(error instanceof Error ? error.message : `Failed to ${mode} template`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-slate-900 rounded-xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div>
              <h2 className="text-xl font-bold text-white">
                {mode === 'create' && 'Create New Template'}
                {mode === 'edit' && 'Edit Template'}
                {mode === 'view' && 'View Template'}
              </h2>
              <p className="text-gray-400 text-sm">
                {mode === 'view' ? 'Template details and configuration' : 'Configure template settings and appearance'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-white/10">
            {[
              { id: 'general', label: 'General', icon: Settings },
              { id: 'colors', label: 'Colors', icon: Palette },
              { id: 'fonts', label: 'Fonts', icon: Type },
              { id: 'assets', label: 'Assets', icon: Image },
              { id: 'background', label: 'Background', icon: Layout },
              { id: 'preview', label: 'Preview', icon: Eye }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                  activeTab === id
                    ? 'border-purple-400 text-purple-300 bg-purple-500/10'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="bg-red-500/10 border border-red-400/30 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                  <span className="text-red-300">{error}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-green-300">{success}</span>
                </div>
              </div>
            )}

            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Template ID *
                    </label>
                    <input
                      type="text"
                      value={formData.template_id}
                      onChange={(e) => handleInputChange('template_id', e.target.value)}
                      disabled={mode === 'edit' || mode === 'view'}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 disabled:opacity-50"
                      placeholder="e.g., my_custom_template"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Lowercase letters, numbers, and underscores only
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Template Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={mode === 'view'}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 disabled:opacity-50"
                      placeholder="e.g., My Custom Template"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Layout
                    </label>
                    <select
                      value={formData.layout}
                      onChange={(e) => handleInputChange('layout', e.target.value)}
                      disabled={mode === 'view'}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-400/50 disabled:opacity-50"
                    >
                      {layouts.map(layout => (
                        <option key={layout} value={layout} className="bg-slate-800">
                          {layout.charAt(0).toUpperCase() + layout.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      disabled={mode === 'view'}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-400/50 disabled:opacity-50"
                    >
                      {categories.map(category => (
                        <option key={category} value={category} className="bg-slate-800">
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Certificate Title *
                    </label>
                    <input
                      type="text"
                      value={formData.cert_title}
                      onChange={(e) => handleInputChange('cert_title', e.target.value)}
                      disabled={mode === 'view'}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 disabled:opacity-50"
                      placeholder="e.g., CERTIFICATE"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Authority *
                    </label>
                    <input
                      type="text"
                      value={formData.authority}
                      onChange={(e) => handleInputChange('authority', e.target.value)}
                      disabled={mode === 'view'}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 disabled:opacity-50"
                      placeholder="e.g., Certificate Authority"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={mode === 'view'}
                    rows={3}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 disabled:opacity-50"
                    placeholder="Describe this template..."
                  />
                </div>

                {mode !== 'view' && (
                  <div className="flex items-center space-x-6">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => handleInputChange('is_active', e.target.checked)}
                        className="rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/50"
                      />
                      <span className="text-gray-300">Active</span>
                    </label>

                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.is_premium}
                        onChange={(e) => handleInputChange('is_premium', e.target.checked)}
                        className="rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/50"
                      />
                      <span className="text-gray-300">Premium</span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'colors' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Object.entries(formData.colors).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-300 mb-2 capitalize">
                        {key} Color
                      </label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          disabled={mode === 'view'}
                          className="w-12 h-10 border border-white/20 rounded cursor-pointer disabled:cursor-not-allowed"
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          disabled={mode === 'view'}
                          className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Color Preview */}
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Color Preview</h4>
                  <div className="space-y-3">
                    <div 
                      className="p-4 rounded-lg"
                      style={{ backgroundColor: formData.colors.background }}
                    >
                      <h3 
                        className="text-2xl font-bold mb-2"
                        style={{ color: formData.colors.primary }}
                      >
                        {formData.cert_title}
                      </h3>
                      <p 
                        className="text-lg mb-2"
                        style={{ color: formData.colors.secondary }}
                      >
                        of Completion
                      </p>
                      <p 
                        className="mb-2"
                        style={{ color: formData.colors.text }}
                      >
                        This certifies that
                      </p>
                      <p 
                        className="text-xl font-bold mb-2"
                        style={{ color: formData.colors.primary }}
                      >
                        John Doe
                      </p>
                      <p 
                        className="font-semibold"
                        style={{ color: formData.colors.accent }}
                      >
                        "Sample Course Name"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'fonts' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {Object.entries(formData.fonts).map(([key, font]) => (
                    <div key={key} className="bg-white/5 border border-white/10 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-white mb-3 capitalize">
                        {key} Font
                      </h4>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Font Family
                          </label>
                          <select
                            value={font.font}
                            onChange={(e) => handleFontChange(key, 'font', e.target.value)}
                            disabled={mode === 'view'}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-400/50 disabled:opacity-50"
                          >
                            {fontOptions.map(fontOption => (
                              <option key={fontOption} value={fontOption} className="bg-slate-800">
                                {fontOption}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Font Size
                          </label>
                          <input
                            type="number"
                            min="8"
                            max="100"
                            value={font.size}
                            onChange={(e) => handleFontChange(key, 'size', parseInt(e.target.value))}
                            disabled={mode === 'view'}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400/50 disabled:opacity-50"
                          />
                        </div>

                        <div className="p-3 bg-white/5 rounded border">
                          <p 
                            className="text-white"
                            style={{ 
                              fontFamily: font.font.includes('Bold') ? 'Arial, sans-serif' : 'Arial, sans-serif',
                              fontWeight: font.font.includes('Bold') ? 'bold' : 'normal',
                              fontSize: `${Math.min(font.size / 3, 16)}px`
                            }}
                          >
                            Sample {key} text - {font.font} {font.size}pt
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'assets' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">Logo & Signature</h3>
                  <p className="text-gray-400 text-sm">
                    Upload logo and signature images for your certificate templates
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Logo Section */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Image className="h-5 w-5 text-blue-400" />
                      <h4 className="text-lg font-semibold text-white">Logo</h4>
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.logo?.enabled || false}
                          onChange={(e) => handleAssetChange('logo', 'enabled', e.target.checked)}
                          disabled={mode === 'view'}
                          className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                        />
                        <span className="text-gray-300">Enable Logo</span>
                      </label>

                      {formData.logo?.enabled && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Position
                            </label>
                            <select
                              value={formData.logo.position}
                              onChange={(e) => handleAssetChange('logo', 'position', e.target.value)}
                              disabled={mode === 'view'}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400/50 disabled:opacity-50"
                            >
                              <option value="top-left">Top Left</option>
                              <option value="top-right">Top Right</option>
                              <option value="top-center">Top Center</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Width (px)
                              </label>
                              <input
                                type="number"
                                value={formData.logo?.size?.width || 80}
                                onChange={(e) => handleAssetChange('logo', 'size', { ...formData.logo?.size, width: parseInt(e.target.value) || 80 })}
                                disabled={mode === 'view'}
                                min="20"
                                max="200"
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400/50 disabled:opacity-50"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Height (px)
                              </label>
                              <input
                                type="number"
                                value={formData.logo?.size?.height || 80}
                                onChange={(e) => handleAssetChange('logo', 'size', { ...formData.logo?.size, height: parseInt(e.target.value) || 80 })}
                                disabled={mode === 'view'}
                                min="20"
                                max="200"
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-blue-400/50 disabled:opacity-50"
                              />
                            </div>
                          </div>

                          {mode !== 'view' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Upload Logo
                              </label>
                              <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload('logo', file);
                                  }}
                                  className="hidden"
                                  id="logo-upload"
                                />
                                <label
                                  htmlFor="logo-upload"
                                  className="cursor-pointer flex flex-col items-center space-y-2"
                                >
                                  <Upload className="h-8 w-8 text-gray-400" />
                                  <span className="text-gray-400 text-sm">
                                    Click to upload logo (PNG, JPG - Max 2MB)
                                  </span>
                                </label>
                              </div>
                            </div>
                          )}

                          {formData.logo.data && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Logo Preview
                              </label>
                              <div className="border border-white/20 rounded-lg p-4 bg-white">
                                <img
                                  src={`data:image/png;base64,${formData.logo.data}`}
                                  alt="Logo preview"
                                  className="max-w-full max-h-20 mx-auto"
                                />
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Signature Section */}
                  <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <FileText className="h-5 w-5 text-green-400" />
                      <h4 className="text-lg font-semibold text-white">Signature</h4>
                    </div>

                    <div className="space-y-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.signature?.enabled || false}
                          onChange={(e) => handleAssetChange('signature', 'enabled', e.target.checked)}
                          disabled={mode === 'view'}
                          className="rounded border-white/20 bg-white/5 text-green-500 focus:ring-green-500/50"
                        />
                        <span className="text-gray-300">Enable Signature</span>
                      </label>

                      {formData.signature?.enabled && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Position
                            </label>
                            <select
                              value={formData.signature.position}
                              onChange={(e) => handleAssetChange('signature', 'position', e.target.value)}
                              disabled={mode === 'view'}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50 disabled:opacity-50"
                            >
                              <option value="bottom-left">Bottom Left</option>
                              <option value="bottom-right">Bottom Right</option>
                              <option value="bottom-center">Bottom Center</option>
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Width (px)
                              </label>
                              <input
                                type="number"
                                value={formData.signature?.size?.width || 150}
                                onChange={(e) => handleAssetChange('signature', 'size', { ...formData.signature?.size, width: parseInt(e.target.value) || 150 })}
                                disabled={mode === 'view'}
                                min="50"
                                max="300"
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50 disabled:opacity-50"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Height (px)
                              </label>
                              <input
                                type="number"
                                value={formData.signature?.size?.height || 60}
                                onChange={(e) => handleAssetChange('signature', 'size', { ...formData.signature?.size, height: parseInt(e.target.value) || 60 })}
                                disabled={mode === 'view'}
                                min="20"
                                max="150"
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-green-400/50 disabled:opacity-50"
                              />
                            </div>
                          </div>

                          {mode !== 'view' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Upload Signature
                              </label>
                              <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileUpload('signature', file);
                                  }}
                                  className="hidden"
                                  id="signature-upload"
                                />
                                <label
                                  htmlFor="signature-upload"
                                  className="cursor-pointer flex flex-col items-center space-y-2"
                                >
                                  <Upload className="h-8 w-8 text-gray-400" />
                                  <span className="text-gray-400 text-sm">
                                    Click to upload signature (PNG, JPG - Max 2MB)
                                  </span>
                                </label>
                              </div>
                            </div>
                          )}

                          {formData.signature.data && (
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Signature Preview
                              </label>
                              <div className="border border-white/20 rounded-lg p-4 bg-white">
                                <img
                                  src={`data:image/png;base64,${formData.signature.data}`}
                                  alt="Signature preview"
                                  className="max-w-full max-h-16 mx-auto"
                                />
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'background' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">Background Template</h3>
                  <p className="text-gray-400 text-sm">
                    Upload a pre-designed PDF or image to use as certificate background
                  </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <div className="space-y-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.background_template?.enabled || false}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          background_template: {
                            ...prev.background_template!,
                            enabled: e.target.checked,
                            type: e.target.checked ? 'uploaded' : 'generated'
                          }
                        }))}
                        disabled={mode === 'view'}
                        className="rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/50"
                      />
                      <span className="text-gray-300">Use Custom Background Template</span>
                    </label>

                    {formData.background_template?.enabled && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Upload Template File
                          </label>
                          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-lg hover:border-gray-500 transition-colors">
                            <div className="space-y-1 text-center">
                              <Upload className="mx-auto h-12 w-12 text-gray-400" />
                              <div className="flex text-sm text-gray-400">
                                <label className="relative cursor-pointer bg-slate-800 rounded-md font-medium text-purple-400 hover:text-purple-300 focus-within:outline-none">
                                  <span>Upload a file</span>
                                  <input
                                    type="file"
                                    className="sr-only"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    disabled={mode === 'view'}
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleBackgroundTemplateUpload(file);
                                    }}
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                            </div>
                          </div>
                        </div>

                        {formData.background_template?.filename && (
                          <div className="bg-green-500/10 border border-green-400/30 rounded-lg p-4">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="h-5 w-5 text-green-400" />
                              <div>
                                <span className="text-green-300 font-medium">Template Uploaded:</span>
                                <span className="text-gray-300 ml-2">{formData.background_template.filename}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="text-sm text-gray-400 bg-blue-500/10 border border-blue-400/30 rounded-lg p-4">
                          <h5 className="font-medium text-blue-300 mb-2">💡 Tips for Background Templates:</h5>
                          <ul className="space-y-1 text-xs">
                            <li>• Use high-resolution images (300 DPI recommended)</li>
                            <li>• Standard certificate size: 8.5" × 11" or A4</li>
                            <li>• Leave space for text overlay (names, dates, etc.)</li>
                            <li>• PNG with transparency works best for overlays</li>
                            <li>• PDF files will be converted to images</li>
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Template Preview</h4>
                  <div 
                    className="aspect-[4/3] rounded-lg p-8 relative"
                    style={{ backgroundColor: formData.colors.background }}
                  >
                    {/* Simulated certificate preview */}
                    <div className="text-center space-y-4">
                      <h1 
                        className="font-bold"
                        style={{ 
                          color: formData.colors.primary,
                          fontSize: `${formData.fonts.title.size / 4}px`,
                          fontWeight: 'bold'
                        }}
                      >
                        {formData.cert_title}
                      </h1>
                      
                      <h2 
                        style={{ 
                          color: formData.colors.secondary,
                          fontSize: `${formData.fonts.subtitle.size / 4}px`
                        }}
                      >
                        of Completion
                      </h2>
                      
                      <div className="w-24 h-0.5 mx-auto" style={{ backgroundColor: formData.colors.secondary }}></div>
                      
                      <p 
                        style={{ 
                          color: formData.colors.text,
                          fontSize: `${formData.fonts.content.size / 4}px`
                        }}
                      >
                        This certifies that
                      </p>
                      
                      <h3 
                        className="font-bold"
                        style={{ 
                          color: formData.colors.primary,
                          fontSize: `${formData.fonts.name.size / 4}px`,
                          fontWeight: 'bold'
                        }}
                      >
                        John Doe
                      </h3>
                      
                      <div className="w-32 h-0.5 mx-auto" style={{ backgroundColor: formData.colors.secondary }}></div>
                      
                      <p 
                        style={{ 
                          color: formData.colors.text,
                          fontSize: `${formData.fonts.content.size / 4}px`
                        }}
                      >
                        has successfully completed the course
                      </p>
                      
                      <h4 
                        className="font-bold"
                        style={{ 
                          color: formData.colors.accent,
                          fontSize: `${formData.fonts.course.size / 4}px`,
                          fontWeight: 'bold'
                        }}
                      >
                        "Sample Course Name"
                      </h4>
                      
                      <p 
                        style={{ 
                          color: formData.colors.text,
                          fontSize: `${formData.fonts.content.size / 5}px`
                        }}
                      >
                        Completed on {new Date().toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div 
                      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center"
                      style={{ 
                        color: formData.colors.primary,
                        fontSize: `${formData.fonts.content.size / 5}px`,
                        fontWeight: 'bold'
                      }}
                    >
                      {formData.authority}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {mode !== 'view' && (
            <div className="flex items-center justify-end space-x-4 p-6 border-t border-white/10">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex items-center space-x-2 px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isLoading ? 'Saving...' : mode === 'create' ? 'Create Template' : 'Update Template'}</span>
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TemplateModal;