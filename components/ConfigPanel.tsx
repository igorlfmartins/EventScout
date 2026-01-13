import React from 'react';
import { AppConfig } from '../types';
import { Save, X, Settings2, Info } from 'lucide-react';

interface ConfigPanelProps {
  config: AppConfig;
  onSave: (newConfig: AppConfig) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onSave, isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleSave = () => {
    // Simply pass the current config back to trigger close/save flow
    onSave(config);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm transition-all">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-xl shadow-2xl p-6 m-4 animate-[fadeIn_0.3s_ease-out]">
        <div className="flex justify-between items-center mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex items-center gap-2 text-brand-teal">
            <Settings2 className="w-6 h-6" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-brand-cream">Help & Settings</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
              <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 text-sm mb-1">Database Connected</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                      The application is successfully connected to your Airtable database. New events will be added to the "Todo" status automatically.
                  </p>
              </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2">How to add Custom Filters</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                  Custom Cities and Categories can be added directly from the Search Panel using the <span className="text-brand-teal font-semibold">+ Add</span> button located below the dropdown menus.
              </p>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-brand-teal hover:bg-teal-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-lg shadow-teal-500/30"
          >
            <Save className="w-4 h-4" /> Close
          </button>
        </div>
      </div>
    </div>
  );
};