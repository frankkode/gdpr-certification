import React, { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Upload, Download, CheckCircle, AlertTriangle, X, 
  FileText, Users, Clock, RefreshCw, Eye, Trash2,
  Play, Pause, Square, BarChart3, Activity, ExternalLink,
  CreditCard
} from 'lucide-react';

interface BulkJob {
  id: string;
  fileName: string;
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  errorRecords: number;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';
  createdAt: string;
  completedAt?: string;
  templateId: string;
  templateName: string;
  downloadUrl?: string;
  errorReport?: string;
  progress: number;
}

interface BulkCertificateGeneratorProps {
  apiUrl: string;
  token: string;
  templates: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

const BulkCertificateGenerator: React.FC<BulkCertificateGeneratorProps> = ({
  apiUrl,
  token,
  templates
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [jobs, setJobs] = useState<BulkJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'jobs' | 'history'>('upload');
  const [showPreview, setShowPreview] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [upgradeInfo, setUpgradeInfo] = useState<{
    needsUpgrade: boolean;
    upgradeUrl?: string;
    upgradeMessage?: string;
    suggestedPlans?: Array<{
      name: string;
      price: string;
      limit: string;
      perfect_for: string;
    }>;
  } | null>(null);

  // CSV validation rules
  const requiredColumns = ['name', 'email'];
  const optionalColumns = ['course', 'date', 'grade', 'instructor', 'duration', 'certificateId'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const maxRecords = 1000;

  // Load jobs on component mount
  React.useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${apiUrl}/bulk/jobs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Bulk jobs data:', data.jobs); // Debug log
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching bulk jobs:', error);
    }
  };

  const validateCsvFile = (file: File): Promise<{ valid: boolean; errors: string[]; preview: string[][] }> => {
    return new Promise((resolve) => {
      if (file.size > maxFileSize) {
        resolve({
          valid: false,
          errors: [`File size exceeds ${maxFileSize / 1024 / 1024}MB limit`],
          preview: []
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length === 0) {
            resolve({
              valid: false,
              errors: ['CSV file is empty'],
              preview: []
            });
            return;
          }

          const rows = lines.map(line => {
            // Simple CSV parsing (handle quoted fields)
            const result: string[] = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
              } else {
                current += char;
              }
            }
            result.push(current.trim());
            return result;
          });

          const headers = rows[0].map(h => h.toLowerCase().replace(/['"]/g, ''));
          const dataRows = rows.slice(1).filter(row => row.some(cell => cell.trim()));

          const errors: string[] = [];

          // Check required columns
          const missingColumns = requiredColumns.filter(col => !headers.includes(col));
          if (missingColumns.length > 0) {
            errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
          }

          // Check record count
          if (dataRows.length > maxRecords) {
            errors.push(`Too many records. Maximum ${maxRecords} allowed, found ${dataRows.length}`);
          }

          if (dataRows.length === 0) {
            errors.push('No data rows found in CSV file');
          }

          // Validate email format in preview
          const emailIndex = headers.indexOf('email');
          if (emailIndex !== -1) {
            const invalidEmails = dataRows
              .slice(0, 10) // Check first 10 emails
              .filter((row, index) => {
                const email = row[emailIndex];
                return email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
              });
            
            if (invalidEmails.length > 0) {
              errors.push(`Invalid email format detected in some rows`);
            }
          }

          resolve({
            valid: errors.length === 0,
            errors,
            preview: [headers, ...dataRows.slice(0, 5)] // Preview first 5 rows
          });

        } catch (error) {
          resolve({
            valid: false,
            errors: ['Failed to parse CSV file. Please check the format.'],
            preview: []
          });
        }
      };
      reader.readAsText(file);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setValidationErrors(['Please select a CSV file']);
      setUpgradeInfo(null);
      return;
    }

    setLoading(true);
    const validation = await validateCsvFile(file);
    
    if (validation.valid) {
      setCsvFile(file);
      setCsvPreview(validation.preview);
      setValidationErrors([]);
      setUpgradeInfo(null);
      setShowPreview(true);
    } else {
      setValidationErrors(validation.errors);
      setUpgradeInfo(null);
      setCsvFile(null);
      setCsvPreview([]);
    }
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!csvFile || !selectedTemplate) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('csvFile', csvFile);
    formData.append('templateId', selectedTemplate);

    try {
      const response = await fetch(`${apiUrl}/bulk/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        // Clear form and switch to jobs tab
        setCsvFile(null);
        setCsvPreview([]);
        setShowPreview(false);
        setSelectedTemplate('');
        setValidationErrors([]);
        setUpgradeInfo(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setActiveTab('jobs');
        fetchJobs();
      } else {
        const error = await response.json();
        setValidationErrors([error.message || 'Upload failed']);
        
        // Handle upgrade information if provided
        if (error.needsUpgrade) {
          setUpgradeInfo({
            needsUpgrade: error.needsUpgrade,
            upgradeUrl: error.upgradeUrl,
            upgradeMessage: error.upgradeMessage,
            suggestedPlans: error.suggestedPlans
          });
        } else {
          setUpgradeInfo(null);
        }
      }
    } catch (error) {
      setValidationErrors(['Network error. Please try again.']);
      setUpgradeInfo(null);
    } finally {
      setUploading(false);
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      await fetch(`${apiUrl}/bulk/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      fetchJobs();
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  };

  const deleteJob = async (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      try {
        await fetch(`${apiUrl}/bulk/jobs/${jobId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        fetchJobs();
      } catch (error) {
        console.error('Error deleting job:', error);
      }
    }
  };

  const downloadResults = async (jobId: string) => {
    try {
      console.log('🔍 Starting download debug for job:', jobId);
      console.log('🔍 API URL:', apiUrl);
      console.log('🔍 Token (first 20 chars):', token?.substring(0, 20) + '...');
      
      // First, let's test what the endpoint actually returns
      const testUrl = `${apiUrl}/bulk/jobs/${jobId}/download`;
      console.log('🔍 Testing endpoint:', testUrl);
      
      try {
        const testResponse = await fetch(testUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('🔍 Test response status:', testResponse.status);
        console.log('🔍 Test response headers:', Object.fromEntries(testResponse.headers.entries()));
        console.log('🔍 Test response Content-Type:', testResponse.headers.get('content-type'));
        console.log('🔍 Test response Content-Length:', testResponse.headers.get('content-length'));
        
        if (testResponse.ok) {
          const contentType = testResponse.headers.get('content-type');
          console.log('🔍 Response content type:', contentType);
          
          if (contentType && contentType.includes('application/zip')) {
            console.log('✅ Server is returning ZIP file - trying download...');
            
            // Method 1: Try blob download
            const blob = await testResponse.blob();
            console.log('🔍 Blob size:', blob.size, 'bytes');
            console.log('🔍 Blob type:', blob.type);
            
            if (blob.size > 0) {
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `certificates-${jobId}.zip`;
              a.style.display = 'none';
              document.body.appendChild(a);
              
              console.log('🚀 Triggering download...');
              a.click();
              
              setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                console.log('✅ Download cleanup completed');
              }, 1000);
            } else {
              console.error('❌ Empty blob received');
              alert('Empty file received. The ZIP might not have been created properly.');
            }
          } else {
            console.log('❌ Server not returning ZIP, response type:', contentType);
            const textResponse = await testResponse.text();
            console.log('🔍 Server response text:', textResponse);
            alert('Server error: ' + textResponse);
          }
        } else {
          console.error('❌ Test response failed:', testResponse.status);
          const errorText = await testResponse.text();
          console.log('🔍 Error response:', errorText);
          alert(`Download failed: ${testResponse.status} - ${errorText}`);
        }
      } catch (fetchError) {
        console.error('❌ Fetch error:', fetchError);
        alert('Network error: ' + fetchError.message);
      }
      
    } catch (error) {
      console.error('❌ General error:', error);
      alert('Download failed: ' + error.message);
    }
  };

  // Test download function to verify basic download works
  const testDownload = () => {
    console.log('🧪 Testing basic download mechanism');
    const testUrl = `${apiUrl}/test/download`;
    console.log('🧪 Test URL:', testUrl);
    
    // Try direct navigation
    window.location.href = testUrl;
  };

  // Test ZIP download function
  const testZipDownload = () => {
    console.log('🧪 Testing ZIP download mechanism');
    const testUrl = `${apiUrl}/test/zip`;
    console.log('🧪 Test ZIP URL:', testUrl);
    
    // Try direct navigation
    window.location.href = testUrl;
  };

  // Debug bulk jobs function
  const debugBulkJobs = async () => {
    try {
      console.log('🔍 Checking bulk jobs status...');
      const response = await fetch(`${apiUrl}/debug/bulk-jobs`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Bulk jobs debug data:', data);
        
        alert(`Found ${data.totalJobs} bulk jobs. Check console for details.`);
      } else {
        console.error('🔍 Debug request failed:', response.status);
        alert('Failed to fetch debug info');
      }
    } catch (error) {
      console.error('🔍 Debug error:', error);
      alert('Debug request failed: ' + error.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-400" />;
      case 'processing':
        return <RefreshCw className="h-5 w-5 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
      case 'cancelled':
        return <X className="h-5 w-5 text-gray-400" />;
      default:
        return <Activity className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      case 'processing':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      case 'completed':
        return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'error':
        return 'bg-red-500/20 text-red-300 border-red-400/30';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">Bulk Certificate Generation</h2>
        <p className="text-gray-400">Generate multiple certificates from CSV data</p>
        
        {/* Test Download Buttons */}
        <div className="mt-4 space-x-2">
          <button
            onClick={testDownload}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs"
          >
            🧪 Test Download
          </button>
          <button
            onClick={testZipDownload}
            className="px-3 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs"
          >
            📦 Test ZIP
          </button>
          <button
            onClick={debugBulkJobs}
            className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-xs"
          >
            🔍 Debug Jobs
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/5 p-1 rounded-lg">
        {[
          { id: 'upload', label: 'Upload CSV', icon: Upload },
          { id: 'jobs', label: 'Active Jobs', icon: Activity },
          { id: 'history', label: 'History', icon: BarChart3 }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-green-500/20 text-green-300'
                : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="space-y-6">
          {/* CSV Format Instructions */}
          <div className="bg-blue-500/10 border border-blue-400/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-300 mb-3">CSV Format Requirements</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-white mb-2">Required Columns:</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• <code className="bg-white/10 px-1 rounded">name</code> - Recipient name</li>
                  <li>• <code className="bg-white/10 px-1 rounded">email</code> - Recipient email</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-white mb-2">Optional Columns:</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• <code className="bg-white/10 px-1 rounded">course</code> - Course name</li>
                  <li>• <code className="bg-white/10 px-1 rounded">date</code> - Completion date</li>
                  <li>• <code className="bg-white/10 px-1 rounded">grade</code> - Grade/Score</li>
                  <li>• <code className="bg-white/10 px-1 rounded">instructor</code> - Instructor name</li>
                </ul>
              </div>
            </div>
            
            {/* CSV Example Section */}
            <div className="mt-6">
              <h4 className="font-medium text-white mb-3">📄 CSV File Example</h4>
              <div className="bg-black/30 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 font-mono">sample_certificates.csv</span>
                  <button
                    onClick={() => {
                      const csvContent = `name,email,course,date,grade,instructor
John Doe,john.doe@example.com,Web Development Fundamentals,2024-06-24,A+,Sarah Johnson
Jane Smith,jane.smith@company.com,Advanced React Training,2024-06-23,A,Michael Brown
Alex Wilson,alex.wilson@university.edu,Database Design Course,2024-06-22,B+,Dr. Emily Davis
Maria Garcia,maria.garcia@startup.com,Project Management Certification,2024-06-21,A-,Robert Chen
David Lee,david.lee@freelance.com,UI/UX Design Bootcamp,2024-06-20,A,Lisa Anderson`;
                      
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const link = document.createElement('a');
                      const url = URL.createObjectURL(blob);
                      link.setAttribute('href', url);
                      link.setAttribute('download', 'sample_certificates.csv');
                      link.style.visibility = 'hidden';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded text-xs transition"
                  >
                    Download Sample
                  </button>
                </div>
                <pre className="text-xs text-gray-300 overflow-x-auto whitespace-pre font-mono">
{`name,email,course,date,grade,instructor
John Doe,john.doe@example.com,Web Development Fundamentals,2024-06-24,A+,Sarah Johnson
Jane Smith,jane.smith@company.com,Advanced React Training,2024-06-23,A,Michael Brown
Alex Wilson,alex.wilson@university.edu,Database Design Course,2024-06-22,B+,Dr. Emily Davis
Maria Garcia,maria.garcia@startup.com,Project Management Certification,2024-06-21,A-,Robert Chen
David Lee,david.lee@freelance.com,UI/UX Design Bootcamp,2024-06-20,A,Lisa Anderson`}
                </pre>
              </div>
            </div>

            {/* Format Guidelines */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-green-500/10 rounded border border-green-400/20">
                <h5 className="text-sm font-medium text-green-300 mb-2">✅ Correct Format</h5>
                <ul className="text-xs text-green-200 space-y-1">
                  <li>• First row contains column headers</li>
                  <li>• Use commas to separate values</li>
                  <li>• Wrap text with commas in quotes</li>
                  <li>• Valid email addresses required</li>
                  <li>• UTF-8 encoding recommended</li>
                </ul>
              </div>
              <div className="p-3 bg-red-500/10 rounded border border-red-400/20">
                <h5 className="text-sm font-medium text-red-300 mb-2">❌ Common Mistakes</h5>
                <ul className="text-xs text-red-200 space-y-1">
                  <li>• Missing required columns (name, email)</li>
                  <li>• Invalid email format</li>
                  <li>• Using semicolons instead of commas</li>
                  <li>• Empty rows or missing data</li>
                  <li>• Special characters without quotes</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 p-3 bg-white/5 rounded border-l-4 border-blue-400">
              <p className="text-sm text-gray-300">
                <strong>Limits:</strong> Maximum {maxRecords} records per file, {maxFileSize / 1024 / 1024}MB file size limit
              </p>
            </div>
          </div>

          {/* Template Selection */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Select Certificate Template</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => (
                <label
                  key={template.id}
                  className={`block p-4 rounded-lg border cursor-pointer transition ${
                    selectedTemplate === template.id
                      ? 'border-green-400 bg-green-500/10'
                      : 'border-white/20 hover:border-white/30 bg-white/5'
                  }`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={template.id}
                    checked={selectedTemplate === template.id}
                    onChange={(e) => setSelectedTemplate(e.target.value)}
                    className="sr-only"
                  />
                  <div className="flex items-center space-x-3">
                    <FileText className="h-8 w-8 text-blue-400" />
                    <div>
                      <div className="font-medium text-white">{template.name}</div>
                      <div className="text-sm text-gray-400">{template.description}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Upload CSV File</h3>
            
            <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="text-green-400 hover:text-green-300 font-medium transition"
              >
                {loading ? 'Processing...' : 'Click to select CSV file'}
              </button>
              <p className="text-sm text-gray-400 mt-2">
                or drag and drop your CSV file here
              </p>
            </div>

            {/* Validation Errors */}
            {validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0 && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-400/30 rounded-lg">
                <h4 className="font-medium text-red-300 mb-2">Validation Errors:</h4>
                <ul className="text-sm text-red-200 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
                
                {/* Upgrade Information */}
                {upgradeInfo?.needsUpgrade && upgradeInfo && (
                  <div className="mt-4 pt-4 border-t border-red-400/20">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h5 className="font-medium text-yellow-300 mb-1">
                          <CreditCard className="inline h-4 w-4 mr-1" />
                          Upgrade Required
                        </h5>
                        <p className="text-sm text-yellow-200">
                          {upgradeInfo.upgradeMessage || 'Upgrade your plan to generate more certificates'}
                        </p>
                      </div>
                      {upgradeInfo.upgradeUrl && (
                        <a
                          href={upgradeInfo.upgradeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition text-sm"
                        >
                          <span>Upgrade Now</span>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    
                    {/* Suggested Plans */}
                    {upgradeInfo?.suggestedPlans && Array.isArray(upgradeInfo.suggestedPlans) && upgradeInfo.suggestedPlans.length > 0 && (
                      <div className="space-y-2">
                        <h6 className="text-xs font-medium text-gray-300 mb-2">Recommended Plans:</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {upgradeInfo.suggestedPlans.map((plan, index) => (
                            <div key={index} className="p-3 bg-white/5 rounded border border-white/10">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-white text-sm">{plan.name}</span>
                                <span className="text-green-300 text-sm font-bold">{plan.price}</span>
                              </div>
                              <div className="text-xs text-gray-300 mb-1">{plan.limit}</div>
                              <div className="text-xs text-gray-400">{plan.perfect_for}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* CSV Preview */}
            {showPreview && csvPreview && Array.isArray(csvPreview) && csvPreview.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-white">CSV Preview</h4>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="text-gray-400 hover:text-white transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        {csvPreview[0] && Array.isArray(csvPreview[0]) && csvPreview[0].map((header, index) => (
                          <th key={index} className="text-left p-2 text-gray-300 font-medium">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.slice(1).map((row, rowIndex) => (
                        <tr key={rowIndex} className="border-b border-white/5">
                          {Array.isArray(row) && row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="p-2 text-gray-400">
                              {cell || <span className="text-gray-600">-</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Showing first 5 rows of {csvPreview.length - 1} total records
                </p>
              </div>
            )}

            {/* Upload Button */}
            {csvFile && selectedTemplate && (!validationErrors || validationErrors.length === 0) && (
              <div className="mt-6 flex justify-center">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 text-white rounded-lg font-medium transition"
                >
                  {uploading ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                  <span>{uploading ? 'Starting Generation...' : 'Start Generation'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Jobs Tab */}
      {(activeTab === 'jobs' || activeTab === 'history') && (
        <div className="space-y-4">
          {jobs
            .filter(job => activeTab === 'jobs' ? 
              ['pending', 'processing'].includes(job.status) : 
              ['completed', 'error', 'cancelled'].includes(job.status)
            )
            .map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <h3 className="font-semibold text-white">{job.fileName}</h3>
                      <p className="text-sm text-gray-400">
                        Template: {job.templateName || job.templateId || 'Unknown'} • Created: {
                          job.createdAt ? 
                          (isNaN(new Date(job.createdAt).getTime()) ? 
                            'Invalid Date' : 
                            new Date(job.createdAt).toLocaleDateString()
                          ) : 
                          'Unknown'
                        }
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(job.status)}`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                {job.status === 'processing' && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>Progress</span>
                      <span>{job.processedRecords}/{job.totalRecords} ({job.progress}%)</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">{job.totalRecords}</div>
                    <div className="text-xs text-gray-400">Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-400">{job.successfulRecords}</div>
                    <div className="text-xs text-gray-400">Success</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-red-400">{job.errorRecords}</div>
                    <div className="text-xs text-gray-400">Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-400">{job.processedRecords}</div>
                    <div className="text-xs text-gray-400">Processed</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {job.status === 'processing' && (
                      <button
                        onClick={() => cancelJob(job.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-red-500/20 text-red-300 rounded text-sm hover:bg-red-500/30 transition"
                      >
                        <Square className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
                    )}
                    {job.status === 'completed' && job.downloadUrl && (
                      <button
                        onClick={() => downloadResults(job.id)}
                        className="flex items-center space-x-1 px-3 py-1 bg-green-500/20 text-green-300 rounded text-sm hover:bg-green-500/30 transition"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </button>
                    )}
                    {job.errorReport && (
                      <button
                        onClick={() => window.open(job.errorReport, '_blank')}
                        className="flex items-center space-x-1 px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded text-sm hover:bg-yellow-500/30 transition"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Errors</span>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => deleteJob(job.id)}
                    className="p-1 text-gray-400 hover:text-red-400 transition"
                    title="Delete Job"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}

          {jobs.filter(job => activeTab === 'jobs' ? 
            ['pending', 'processing'].includes(job.status) : 
            ['completed', 'error', 'cancelled'].includes(job.status)
          ).length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {activeTab === 'jobs' ? 'No active jobs' : 'No completed jobs'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkCertificateGenerator;