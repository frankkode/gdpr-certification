import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';

const ThemeToggle: React.FC = () => {
  const { theme, actualTheme, setTheme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  const themeOptions = [
    { value: 'light', icon: Sun, label: t('theme.light') },
    { value: 'dark', icon: Moon, label: t('theme.dark') },
    { value: 'system', icon: Monitor, label: t('theme.system') }
  ];

  const currentOption = themeOptions.find(option => option.value === theme) || themeOptions[0];
  const Icon = currentOption.icon;

  return (
    <div className="relative">
      {/* Quick Toggle Button */}
      <motion.button
        onClick={toggleTheme}
        className="p-2 rounded-lg transition-all duration-200 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white dark:bg-slate-800/50 dark:hover:bg-slate-700/50 dark:text-slate-400 dark:hover:text-white"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={t('theme.current', { theme: currentOption.label })}
      >
        <Icon className="h-5 w-5" />
      </motion.button>
    </div>
  );
};

export const ThemeSelector: React.FC = () => {
  const { theme, actualTheme, setTheme } = useTheme();
  const { t } = useTranslation();

  const themeOptions = [
    { value: 'light', icon: Sun, label: t('theme.light') },
    { value: 'dark', icon: Moon, label: t('theme.dark') },
    { value: 'system', icon: Monitor, label: t('theme.system') }
  ];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {t('theme.appearance')}
      </h3>
      <div className="grid grid-cols-3 gap-2">
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = theme === option.value;
          
          return (
            <motion.button
              key={option.value}
              onClick={() => setTheme(option.value as any)}
              className={`
                flex flex-col items-center space-y-2 p-3 rounded-lg border-2 transition-all duration-200
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-500/20 dark:text-blue-400'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:text-gray-700 dark:border-slate-600 dark:bg-slate-700/30 dark:text-slate-400 dark:hover:border-slate-500 dark:hover:text-slate-300'
                }
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{option.label}</span>
            </motion.button>
          );
        })}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t('theme.description')}
      </p>
    </div>
  );
};

export default ThemeToggle;