import React, { useState, useRef, useEffect } from 'react';
import { Search, Filter, Plus, Check, X } from 'lucide-react';
import { SearchParams } from '../types';

interface SearchPanelProps {
  searchParams: SearchParams;
  onParamChange: (key: keyof SearchParams, value: string) => void;
  onSearch: () => void;
  isSearching: boolean;
  customCities: string[];
  customCategories: string[];
  onAddCity: (city: string) => void;
  onAddCategory: (category: string) => void;
}

const DEFAULT_CITIES = ['San Francisco, CA', 'Los Angeles, CA', 'San Diego, CA', 'Dallas, TX', 'Austin, TX', 'New York City, NY', 'Miami, FL', 'Orlando, FL', 'Chicago, IL'];
const DEFAULT_CATEGORIES = ['Marketing', 'Tech', 'Health', 'Sustainability'];

// List of major US cities for autocomplete
const US_CITIES = [
  "New York, NY", "Los Angeles, CA", "Chicago, IL", "Houston, TX", "Phoenix, AZ", 
  "Philadelphia, PA", "San Antonio, TX", "San Diego, CA", "Dallas, TX", "San Jose, CA", 
  "Austin, TX", "Jacksonville, FL", "Fort Worth, TX", "Columbus, OH", "Charlotte, NC", 
  "San Francisco, CA", "Indianapolis, IN", "Seattle, WA", "Denver, CO", "Washington, DC", 
  "Boston, MA", "El Paso, TX", "Nashville, TN", "Detroit, MI", "Oklahoma City, OK", 
  "Portland, OR", "Las Vegas, NV", "Memphis, TN", "Louisville, KY", "Baltimore, MD", 
  "Milwaukee, WI", "Albuquerque, NM", "Tucson, AZ", "Fresno, CA", "Sacramento, CA", 
  "Mesa, AZ", "Kansas City, MO", "Atlanta, GA", "Long Beach, CA", "Colorado Springs, CO", 
  "Raleigh, NC", "Miami, FL", "Virginia Beach, VA", "Omaha, NE", "Oakland, CA", 
  "Minneapolis, MN", "Tulsa, OK", "Arlington, TX", "Tampa, FL", "New Orleans, LA", 
  "Wichita, KS", "Cleveland, OH", "Bakersfield, CA", "Aurora, CO", "Anaheim, CA", 
  "Honolulu, HI", "Santa Ana, CA", "Riverside, CA", "Corpus Christi, TX", "Lexington, KY", 
  "Stockton, CA", "Henderson, NV", "Saint Paul, MN", "St. Louis, MO", "Cincinnati, OH", 
  "Pittsburgh, PA", "Greensboro, NC", "Anchorage, AK", "Plano, TX", "Lincoln, NE", 
  "Orlando, FL", "Irvine, CA", "Newark, NJ", "Durham, NC", "Chula Vista, CA", 
  "Toledo, OH", "Fort Wayne, IN", "St. Petersburg, FL", "Laredo, TX", "Jersey City, NJ", 
  "Chandler, AZ", "Madison, WI", "Lubbock, TX", "Scottsdale, AZ", "Reno, NV", 
  "Buffalo, NY", "Gilbert, AZ", "Glendale, AZ", "North Las Vegas, NV", "Winston-Salem, NC", 
  "Chesapeake, VA", "Norfolk, VA", "Fremont, CA", "Garland, TX", "Irving, TX", 
  "Hialeah, FL", "Richmond, VA", "Boise, ID", "Spokane, WA", "Baton Rouge, LA",
  "Salt Lake City, UT", "Tallahassee, FL", "Fort Lauderdale, FL", "Providence, RI"
].sort();

export const SearchPanel: React.FC<SearchPanelProps> = ({
  searchParams,
  onParamChange,
  onSearch,
  isSearching,
  customCities,
  customCategories,
  onAddCity,
  onAddCategory
}) => {
  const cities = [...DEFAULT_CITIES, ...customCities];
  const categories = [...DEFAULT_CATEGORIES, ...customCategories];

  const [isAddingCity, setIsAddingCity] = useState(false);
  const [newCity, setNewCity] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  const [isAddingCat, setIsAddingCat] = useState(false);
  const [newCat, setNewCat] = useState('');

  // Handle City Input & Autocomplete
  const handleCityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewCity(value);

    if (value.length > 0) {
      const filtered = US_CITIES.filter(city => 
        city.toLowerCase().includes(value.toLowerCase()) && 
        !cities.includes(city) // Don't suggest if already in list
      );
      setCitySuggestions(filtered);
      setShowCitySuggestions(true);
    } else {
      setShowCitySuggestions(false);
    }
  };

  const selectCity = (city: string) => {
    setNewCity(city);
    setShowCitySuggestions(false);
    // Optional: auto-save on select, or let user click checkmark. 
    // Letting user click checkmark is safer UX, but let's keep it simple: just fill input.
  };

  const handleSaveCity = () => {
    if (newCity.trim()) {
      onAddCity(newCity.trim());
      setNewCity('');
      setCitySuggestions([]);
      setShowCitySuggestions(false);
      setIsAddingCity(false);
    }
  };

  const handleSaveCat = () => {
    if (newCat.trim()) {
      onAddCategory(newCat.trim());
      setNewCat('');
      setIsAddingCat(false);
    }
  };

  // Close suggestions when clicking outside would be handled by a click listener in a real app,
  // but for now, we rely on selection or the X button.

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-visible mb-8">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 flex items-center gap-2">
        <Filter className="w-5 h-5 text-brand-teal" />
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">Search Events</h2>
      </div>

      {/* Filter Form */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
          
          {/* CITY COLUMN */}
          <div className="md:col-span-1 relative">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              City
            </label>
            <select
              value={searchParams.city}
              onChange={(e) => onParamChange('city', e.target.value)}
              className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-teal outline-none"
            >
              <option value="">Select City...</option>
              {cities.map((city) => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            
            {/* Quick Add City */}
            <div className="mt-2 h-8 relative">
                {isAddingCity ? (
                    <div className="flex items-center gap-1 animate-[fadeIn_0.2s_ease-out]">
                        <div className="relative flex-1">
                            <input 
                                type="text" 
                                autoFocus
                                value={newCity}
                                onChange={handleCityChange}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveCity()}
                                className="w-full p-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-brand-teal"
                                placeholder="Type US city..."
                            />
                            {/* Autocomplete Dropdown */}
                            {showCitySuggestions && citySuggestions.length > 0 && (
                                <ul className="absolute top-full left-0 w-full mt-1 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
                                    {citySuggestions.map((city) => (
                                        <li 
                                            key={city}
                                            onClick={() => selectCity(city)}
                                            className="px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-brand-teal/10 hover:text-brand-teal cursor-pointer transition-colors"
                                        >
                                            {city}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <button onClick={handleSaveCity} className="p-1.5 bg-brand-teal text-white rounded hover:bg-teal-700 flex-shrink-0">
                            <Check className="w-3 h-3" />
                        </button>
                        <button 
                            onClick={() => {
                                setIsAddingCity(false);
                                setShowCitySuggestions(false);
                            }} 
                            className="p-1.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 flex-shrink-0"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsAddingCity(true)}
                        className="flex items-center gap-1 text-xs text-brand-teal hover:text-teal-700 hover:underline transition-colors"
                    >
                        <Plus className="w-3 h-3" /> Add another city
                    </button>
                )}
            </div>
          </div>

          {/* CATEGORY COLUMN */}
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={searchParams.category}
              onChange={(e) => onParamChange('category', e.target.value)}
              className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-teal outline-none"
            >
              <option value="">Select Category...</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Quick Add Category */}
            <div className="mt-2 h-8">
                {isAddingCat ? (
                    <div className="flex items-center gap-1 animate-[fadeIn_0.2s_ease-out]">
                        <input 
                            type="text" 
                            autoFocus
                            value={newCat}
                            onChange={(e) => setNewCat(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveCat()}
                            className="flex-1 p-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none focus:border-brand-teal"
                            placeholder="Type category..."
                        />
                        <button onClick={handleSaveCat} className="p-1.5 bg-brand-teal text-white rounded hover:bg-teal-700">
                            <Check className="w-3 h-3" />
                        </button>
                        <button onClick={() => setIsAddingCat(false)} className="p-1.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ) : (
                    <button 
                        onClick={() => setIsAddingCat(true)}
                        className="flex items-center gap-1 text-xs text-brand-teal hover:text-teal-700 hover:underline transition-colors"
                    >
                        <Plus className="w-3 h-3" /> Add another category
                    </button>
                )}
            </div>
          </div>

          {/* KEYWORD COLUMN */}
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Keywords (Optional)
            </label>
            <input
              type="text"
              value={searchParams.keyword}
              onChange={(e) => onParamChange('keyword', e.target.value)}
              placeholder="e.g. Summit, Expo"
              className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-teal outline-none"
            />
            {/* Spacer to align with buttons */}
             <div className="mt-2 h-8"></div>
          </div>

          {/* SEARCH BUTTON & LOADING BAR */}
          <div className="md:col-span-1">
            <label className="block text-xs font-semibold text-transparent uppercase tracking-wider mb-1">
              Action
            </label>
            <button
              onClick={onSearch}
              disabled={isSearching || !searchParams.city || !searchParams.category}
              className="w-full flex items-center justify-center gap-2 bg-brand-teal hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2.5 rounded-lg font-bold transition-all shadow-md active:transform active:scale-95"
            >
              {isSearching ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Searching Google...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search Events
                </>
              )}
            </button>
             
             {/* Loading Bar */}
             <div className={`mt-3 h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden transition-opacity duration-300 ${isSearching ? 'opacity-100' : 'opacity-0'}`}>
                {isSearching && (
                    <div className="h-full bg-brand-teal animate-[loading_2s_ease-in-out_infinite] w-full origin-left scale-x-50"></div>
                )}
             </div>
             
             {/* Add custom keyframe animation style for the indeterminate loading bar if not in tailwind config */}
             <style>{`
                @keyframes loading {
                    0% { transform: translateX(-100%) scaleX(0.2); }
                    50% { transform: translateX(0%) scaleX(0.5); }
                    100% { transform: translateX(100%) scaleX(0.2); }
                }
             `}</style>
          </div>
        </div>
      </div>
    </div>
  );
};