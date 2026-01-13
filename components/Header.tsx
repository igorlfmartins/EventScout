import React from 'react';
import { Moon, Sun } from 'lucide-react';

interface HeaderProps {
  toggleTheme: () => void;
  isDark: boolean;
}

export const Header: React.FC<HeaderProps> = ({ toggleTheme, isDark }) => {
  return (
    <header className="bg-brand-teal border-b border-teal-700 sticky top-0 z-50 shadow-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex flex-col">
          {/* Logo Image */}
          <img 
            src="/logo.svg" 
            alt="EventScout" 
            className="h-10 w-auto mb-1 object-contain self-start"
            onError={(e) => {
              // Fallback to text if image fails to load
              e.currentTarget.style.display = 'none';
              const fallback = document.getElementById('logo-fallback');
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
          
          {/* Fallback Text (Hidden by default) */}
          <h1 
            id="logo-fallback"
            className="hidden text-4xl font-extrabold italic text-white leading-none mb-1" 
            style={{ fontFamily: '"Guyot Headline", serif' }}
          >
            EventScout
          </h1>

          <p className="text-white/90 text-xs font-medium tracking-wide">
            Your B2B Event Intelligence Platform
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-white/20 transition-colors text-white"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </header>
  );
};