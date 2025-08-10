import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Shield, 
  Stethoscope, 
  Building, 
  GraduationCap, 
  Award, 
  Palette,
  Check,
  Star,
  Lock,
  Heart
} from 'lucide-react';

export interface CertificateTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
  features: string[];
  industry: string;
  premium?: boolean;
}

interface CertificateTemplatesProps {
  selectedTemplate: string;
  onTemplateSelect: (templateId: string) => void;
  className?: string;
  apiUrl: string;
  token?: string;
  userSubscriptionTier?: string;
}

const CertificateTemplates: React.FC<CertificateTemplatesProps> = ({
  selectedTemplate,
  onTemplateSelect,
  className = '',
  apiUrl,
  token,
  userSubscriptionTier = 'free'
}) => {
  const { t } = useTranslation();
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  const [customTemplates, setCustomTemplates] = useState<CertificateTemplate[]>([]);
  const [userTemplates, setUserTemplates] = useState<CertificateTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Fetch admin-created custom templates
  const fetchCustomTemplates = async () => {
    try {
      const response = await fetch(`${apiUrl}/templates`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const templates = data.templates || [];
        
        // Only get admin-created templates (exclude built-in ones)
        const customTemplates = templates.filter((template: any) => 
          template.source === 'admin-created'
        );
        
        const formattedTemplates: CertificateTemplate[] = customTemplates.map((template: any) => ({
          id: template.template_id || template.id,
          name: template.name,
          description: template.description || 'Custom admin-created template',
          icon: Palette,
          colors: {
            primary: template.colors?.primary || '#6366f1',
            secondary: template.colors?.secondary || '#ec4899',
            accent: template.colors?.accent || '#14b8a6',
            background: template.colors?.background || '#fafafa'
          },
          features: ['Custom Design', 'Admin Created', 'Professional Layout', 'GDPR Compliant'],
          industry: 'Custom',
          premium: template.isPremium || false
        }));
        setCustomTemplates(formattedTemplates);
      }
    } catch (error) {
      console.error('Failed to fetch custom templates:', error);
    }
  };

  // Fetch user's own templates
  const fetchUserTemplates = async () => {
    if (!token || userSubscriptionTier === 'free') return;
    
    try {
      const response = await fetch(`${apiUrl}/user/templates`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const templates = data.templates || [];
        
        const formattedTemplates: CertificateTemplate[] = templates.map((template: any) => ({
          id: template.template_id || template.id,
          name: template.name,
          description: template.description || 'Your custom template',
          icon: Heart,
          colors: {
            primary: template.colors?.primary || '#6366f1',
            secondary: template.colors?.secondary || '#ec4899',
            accent: template.colors?.accent || '#14b8a6',
            background: template.colors?.background || '#fafafa'
          },
          features: ['Your Design', 'Fully Customizable', 'Personal Template', 'GDPR Compliant'],
          industry: template.category || 'Personal',
          premium: false // User templates are always available to the user
        }));
        setUserTemplates(formattedTemplates);
      }
    } catch (error) {
      console.error('Failed to fetch user templates:', error);
    }
  };

  // Combined fetch function
  const fetchAllTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      await Promise.all([
        fetchCustomTemplates(),
        fetchUserTemplates()
      ]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Load templates on component mount
  useEffect(() => {
    fetchAllTemplates();
  }, [apiUrl, token, userSubscriptionTier]);

  const defaultTemplates: CertificateTemplate[] = [
    {
      id: 'standard',
      name: t('certificate.templates.standard'),
      description: 'Professional certificate suitable for all types of certifications',
      icon: Shield,
      colors: {
        primary: '#1e3a8a',
        secondary: '#d97706',
        accent: '#059669',
        background: '#ffffff'
      },
      features: ['GDPR Compliant', 'QR Code', 'Digital Signature', 'Tamper Proof'],
      industry: 'General'
    },
    {
      id: 'healthcare',
      name: t('certificate.templates.healthcare'),
      description: 'Specialized template for medical and healthcare certifications',
      icon: Stethoscope,
      colors: {
        primary: '#dc2626',
        secondary: '#0891b2',
        accent: '#65a30d',
        background: '#fefefe'
      },
      features: ['Medical Compliance', 'HIPAA Compatible', 'Enhanced Security', 'Professional Layout'],
      industry: 'Healthcare',
      premium: true
    },
    {
      id: 'financial',
      name: t('certificate.templates.financial'),
      description: 'Corporate template for financial services and banking certifications',
      icon: Building,
      colors: {
        primary: '#0f172a',
        secondary: '#fbbf24',
        accent: '#3b82f6',
        background: '#f8fafc'
      },
      features: ['Regulatory Compliance', 'Audit Trail', 'Enhanced Verification', 'Corporate Branding'],
      industry: 'Financial Services',
      premium: true
    },
    {
      id: 'education',
      name: t('certificate.templates.education'),
      description: 'Academic template for educational institutions and courses',
      icon: GraduationCap,
      colors: {
        primary: '#7c3aed',
        secondary: '#f59e0b',
        accent: '#10b981',
        background: '#fffbeb'
      },
      features: ['Academic Standards', 'Student Privacy', 'Institution Branding', 'Grade Integration'],
      industry: 'Education'
    },
    {
      id: 'professional',
      name: t('certificate.templates.professional'),
      description: 'Elegant template for professional associations and organizations',
      icon: Award,
      colors: {
        primary: '#059669',
        secondary: '#dc2626',
        accent: '#7c3aed',
        background: '#f0fdf4'
      },
      features: ['Association Branding', 'Member Verification', 'Continuing Education', 'Industry Standards'],
      industry: 'Professional',
      premium: true
    },
    {
      id: 'custom',
      name: t('certificate.templates.custom'),
      description: 'Fully customizable template for unique requirements',
      icon: Palette,
      colors: {
        primary: '#6366f1',
        secondary: '#ec4899',
        accent: '#14b8a6',
        background: '#fafafa'
      },
      features: ['Full Customization', 'Brand Colors', 'Custom Layout', 'Advanced Features'],
      industry: 'Custom',
      premium: true
    }
  ];

  // Filter default templates based on subscription tier
  const getAvailableDefaultTemplates = () => {
    if (userSubscriptionTier === 'free') {
      // Free users only get non-premium templates
      return defaultTemplates.filter(template => !template.premium);
    }
    // Paid users get all templates
    return defaultTemplates;
  };

  // Combine templates with proper ordering: user templates first, then default, then admin custom
  const allTemplates = [
    ...userTemplates,
    ...getAvailableDefaultTemplates(),
    ...customTemplates
  ];

  const getIndustryIcon = (industry: string) => {
    switch (industry) {
      case 'Healthcare':
        return <Heart className="h-4 w-4" />;
      case 'Financial Services':
        return <Building className="h-4 w-4" />;
      case 'Education':
        return <GraduationCap className="h-4 w-4" />;
      case 'Professional':
        return <Award className="h-4 w-4" />;
      case 'Custom':
        return <Palette className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Certificate Templates</h3>
        <p className="text-gray-400 text-sm">
          Choose from professional templates designed for different industries
        </p>
      </div>

      {/* Loading State */}
      {isLoadingTemplates && (
        <div className="text-center py-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-400 text-sm">Loading custom templates...</span>
          </div>
        </div>
      )}

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allTemplates.map((template) => {
          const isSelected = selectedTemplate === template.id;
          const isHovered = hoveredTemplate === template.id;
          const IconComponent = template.icon;

          return (
            <motion.div
              key={template.id}
              onClick={() => onTemplateSelect(template.id)}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative cursor-pointer rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/10 shadow-blue-500/20 shadow-lg'
                  : 'border-slate-600/50 bg-slate-800/50 hover:border-slate-500/80 hover:bg-slate-700/50'
              }`}
            >
              {/* Premium Badge */}
              {template.premium && (
                <div className="absolute top-3 right-3 z-10">
                  <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-500/20 border border-yellow-400/30 rounded-full">
                    <Star className="h-3 w-3 text-yellow-400" />
                    <span className="text-xs font-medium text-yellow-300">Premium</span>
                  </div>
                </div>
              )}

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-3 left-3 z-10">
                  <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${template.colors.primary}20` }}
                  >
                    <IconComponent 
                      className="h-6 w-6"
                      style={{ color: template.colors.primary }}
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{template.name}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      {getIndustryIcon(template.industry)}
                      <span className="text-xs text-gray-400">{template.industry}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                  {template.description}
                </p>

                {/* Color Palette */}
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-xs text-gray-500">Colors:</span>
                  {Object.values(template.colors).map((color, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 rounded-full border border-white/20"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Lock className="h-3 w-3 text-green-400" />
                    <span className="text-xs text-gray-400">Key Features:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {template.features.slice(0, 4).map((feature, index) => (
                      <div key={index} className="flex items-center space-x-1">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <span className="text-xs text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview on Hover */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-4 p-3 bg-slate-700/50 rounded-lg border border-slate-600/50"
                    >
                      <div className="text-xs text-gray-300 mb-2">Template Preview:</div>
                      <div 
                        className="h-16 rounded border-2 border-dashed border-slate-500/50 flex items-center justify-center"
                        style={{ 
                          background: `linear-gradient(135deg, ${template.colors.primary}10, ${template.colors.secondary}10)` 
                        }}
                      >
                        <span className="text-xs text-gray-400">Certificate Layout</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Template Info */}
      {selectedTemplate && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-blue-500/10 border border-blue-400/30 rounded-lg"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Shield className="h-4 w-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Selected Template Information</span>
          </div>
          <p className="text-xs text-blue-200">
            The selected template will be used to generate your certificate with GDPR compliance, 
            enhanced security features, and professional styling appropriate for the {' '}
            {allTemplates.find(t => t.id === selectedTemplate)?.industry.toLowerCase()} industry.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default CertificateTemplates;