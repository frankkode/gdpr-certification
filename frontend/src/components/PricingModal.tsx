import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Save, DollarSign, Users, Settings, 
  AlertTriangle, CheckCircle, Plus, Trash2
} from 'lucide-react';

interface PricingPlan {
  id?: number;
  plan_name: string;
  display_name: string;
  price: number;
  currency: string;
  certificate_limit: number;
  features: string[];
  is_active: boolean;
}

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: PricingPlan | null;
  onSave: (planData: PricingPlan) => Promise<void>;
}

const PricingModal: React.FC<PricingModalProps> = ({ 
  isOpen, 
  onClose, 
  plan, 
  onSave 
}) => {
  const [formData, setFormData] = useState<PricingPlan>({
    plan_name: '',
    display_name: '',
    price: 0,
    currency: 'USD',
    certificate_limit: 1,
    features: [''],
    is_active: true
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when plan changes
  useEffect(() => {
    if (plan) {
      setFormData({
        ...plan,
        features: plan.features.length > 0 ? plan.features : ['']
      });
    } else {
      setFormData({
        plan_name: '',
        display_name: '',
        price: 0,
        currency: 'USD',
        certificate_limit: 1,
        features: [''],
        is_active: true
      });
    }
    setErrors({});
  }, [plan, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.plan_name.trim()) {
      newErrors.plan_name = 'Plan name is required';
    } else if (!/^[a-z0-9_]+$/.test(formData.plan_name)) {
      newErrors.plan_name = 'Plan name must contain only lowercase letters, numbers, and underscores';
    }

    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Display name is required';
    }

    if (formData.price < 0) {
      newErrors.price = 'Price cannot be negative';
    }

    if (formData.certificate_limit < 0) {
      newErrors.certificate_limit = 'Certificate limit cannot be negative';
    }

    const validFeatures = formData.features.filter(f => f.trim() !== '');
    if (validFeatures.length === 0) {
      newErrors.features = 'At least one feature is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const planData = {
        ...formData,
        features: formData.features.filter(f => f.trim() !== '')
      };
      
      await onSave(planData);
      onClose();
    } catch (error) {
      console.error('Error saving plan:', error);
      setErrors({ general: 'Failed to save plan. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof PricingPlan, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
    if (errors.features) {
      setErrors(prev => ({ ...prev, features: '' }));
    }
  };

  const addFeature = () => {
    setFormData(prev => ({ 
      ...prev, 
      features: [...prev.features, ''] 
    }));
  };

  const removeFeature = (index: number) => {
    if (formData.features.length > 1) {
      const newFeatures = formData.features.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, features: newFeatures }));
    }
  };

  const predefinedPlans = [
    {
      plan_name: 'schools',
      display_name: 'Schools Plan',
      price: 99,
      currency: 'EUR',
      certificate_limit: 200,
      features: [
        'Bulk certificate generation',
        '200 certificates per month',
        'Custom templates',
        'School branding',
        'CSV import',
        'Email support'
      ]
    },
    {
      plan_name: 'enterprise_api',
      display_name: 'Enterprise API',
      price: 0,
      currency: 'USD',
      certificate_limit: -1,
      features: [
        'Unlimited certificates',
        'Full API access',
        'Custom integrations',
        'White-label solution',
        'Priority support',
        'Contact sales for pricing'
      ]
    }
  ];

  const loadPredefinedPlan = (predefinedPlan: any) => {
    setFormData({
      ...formData,
      ...predefinedPlan,
      is_active: true
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {plan ? 'Edit Pricing Plan' : 'Create New Pricing Plan'}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    Configure subscription plan details and features
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Predefined Plans */}
              {!plan && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Start</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {predefinedPlans.map((predefined, index) => (
                      <button
                        key={index}
                        onClick={() => loadPredefinedPlan(predefined)}
                        className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
                      >
                        <div className="font-medium text-gray-900">{predefined.display_name}</div>
                        <div className="text-sm text-gray-500">
                          {predefined.price > 0 
                            ? `${predefined.price} ${predefined.currency}` 
                            : 'Contact Sales'
                          } • {predefined.certificate_limit === -1 ? 'Unlimited' : predefined.certificate_limit} certs
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errors.general && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  <span className="text-red-700">{errors.general}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Plan Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plan Name (ID) *
                    </label>
                    <input
                      type="text"
                      value={formData.plan_name}
                      onChange={(e) => handleInputChange('plan_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.plan_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., schools, enterprise_api"
                    />
                    {errors.plan_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.plan_name}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Lowercase letters, numbers, and underscores only
                    </p>
                  </div>

                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name *
                    </label>
                    <input
                      type="text"
                      value={formData.display_name}
                      onChange={(e) => handleInputChange('display_name', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.display_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Schools Plan, Enterprise API"
                    />
                    {errors.display_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.display_name}</p>
                    )}
                  </div>

                  {/* Price and Currency */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.price ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.price && (
                        <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => handleInputChange('currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>

                  {/* Certificate Limit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Certificate Limit *
                    </label>
                    <input
                      type="number"
                      min="-1"
                      value={formData.certificate_limit}
                      onChange={(e) => handleInputChange('certificate_limit', parseInt(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.certificate_limit ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                    {errors.certificate_limit && (
                      <p className="mt-1 text-sm text-red-600">{errors.certificate_limit}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Use -1 for unlimited certificates
                    </p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Features */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Features *
                    </label>
                    <div className="space-y-2">
                      {formData.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => handleFeatureChange(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter feature description"
                          />
                          {formData.features.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeFeature(index)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {errors.features && (
                      <p className="mt-1 text-sm text-red-600">{errors.features}</p>
                    )}
                    <button
                      type="button"
                      onClick={addFeature}
                      className="mt-2 flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Feature</span>
                    </button>
                  </div>

                  {/* Active Status */}
                  <div>
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => handleInputChange('is_active', e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Plan is active
                      </span>
                    </label>
                    <p className="mt-1 text-xs text-gray-500">
                      Only active plans are visible to users
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{plan ? 'Update Plan' : 'Create Plan'}</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PricingModal;