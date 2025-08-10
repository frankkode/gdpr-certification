import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Globe, Check } from 'lucide-react';
import { getSupportedLanguages, getCurrentLanguageInfo } from '../i18n';

interface LanguageSwitcherProps {
  className?: string;
  compact?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  className = '', 
  compact = false 
}) => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  
  const supportedLanguages = getSupportedLanguages();
  const currentLanguage = getCurrentLanguageInfo();

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center space-x-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 rounded-lg text-white transition-colors ${
          compact ? 'text-sm' : ''
        }`}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <Globe className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-blue-400`} />
        {compact ? (
          <span className="text-gray-300 text-lg">{currentLanguage.flag}</span>
        ) : (
          <>
            <span className="text-gray-300">{currentLanguage.flag}</span>
            <span className="font-medium">{currentLanguage.nativeName}</span>
          </>
        )}
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[9998]"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            
            {/* Dropdown Content */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full mt-2 right-0 z-[9999] w-64 bg-slate-800/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-xl overflow-hidden"
              role="listbox"
              aria-label="Language options"
              style={{ zIndex: 9999 }}
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-slate-700/50">
                <h3 className="text-sm font-medium text-white flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-blue-400" />
                  <span>Select Language</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Choose your preferred language
                </p>
              </div>

              {/* Language Options */}
              <div className="py-2">
                {supportedLanguages.map((language) => {
                  const isSelected = i18n.language === language.code;
                  
                  return (
                    <motion.button
                      key={language.code}
                      onClick={() => handleLanguageChange(language.code)}
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                      className={`w-full px-4 py-3 flex items-center justify-between text-left transition-colors ${
                        isSelected 
                          ? 'bg-blue-500/20 text-blue-300' 
                          : 'text-gray-300 hover:text-white'
                      }`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{language.flag}</span>
                        <div>
                          <div className="font-medium">{language.nativeName}</div>
                          <div className="text-xs text-gray-400">{language.name}</div>
                        </div>
                      </div>
                      
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center"
                        >
                          <Check className="h-4 w-4 text-blue-400" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-900/50">
                <p className="text-xs text-gray-500 text-center">
                  Language preference is saved locally
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitcher;