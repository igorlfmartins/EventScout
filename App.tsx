import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SearchPanel } from './components/SearchPanel';
import { ResultsArea } from './components/ResultsArea';
import { EventModal } from './components/EventModal';
import { AppConfig, EventData, SearchParams, ToastMessage } from './types';
import { searchRealEvents } from './services/mockService';
import { checkDuplicates, createEvent, updateEvent } from './services/airtableService';
import { BarChart3, CheckCircle2, AlertTriangle, XCircle, Cloud, Database, ExternalLink } from 'lucide-react';

const STORAGE_KEY = 'prospect_flow_config';
// Hardcoded API Key as requested
const FIXED_API_KEY = 'pateSFfSTxOalPQTE.99835744111cb8eb8d43da2fa00bb51bd4448ad1d71d88fdb778d62b612ce8aa';

// Initial Config
const DEFAULT_CONFIG: AppConfig = {
  airtableApiKey: FIXED_API_KEY,
  customCities: [],
  customCategories: [],
  theme: 'light'
};

const App: React.FC = () => {
  // --- State ---
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  
  // Search State
  const [searchParams, setSearchParams] = useState<SearchParams>({ city: '', category: '', keyword: '' });
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<EventData[]>([]);
  
  // UI State
  const [modalEvent, setModalEvent] = useState<EventData | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  
  // Dashboard Metrics
  const [sessionAddedCount, setSessionAddedCount] = useState(0);

  // --- Effects ---

  // Load Config on Mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // IMPORTANT: We force the hardcoded key here. 
        // We do NOT load the API key from local storage anymore to prevent overrides or security issues.
        parsed.airtableApiKey = FIXED_API_KEY;
        
        setConfig(parsed);
      } catch (e) {
        console.error("Failed to parse config", e);
        setConfig(DEFAULT_CONFIG);
      }
    }
  }, []);

  // Save Config & Apply Theme
  useEffect(() => {
    // We only save theme and custom lists. We technically save the key too but it gets overwritten on load.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

    if (config.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [config]);


  // --- Handlers ---

  const addToast = (type: ToastMessage['type'], message: string) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleAddCustomCity = (newCity: string) => {
    if (config.customCities.includes(newCity)) return;
    setConfig(prev => ({
        ...prev,
        customCities: [...prev.customCities, newCity]
    }));
    setSearchParams(prev => ({ ...prev, city: newCity }));
    addToast('success', `City "${newCity}" added to list.`);
  };

  const handleAddCustomCategory = (newCategory: string) => {
    if (config.customCategories.includes(newCategory)) return;
    setConfig(prev => ({
        ...prev,
        customCategories: [...prev.customCategories, newCategory]
    }));
    setSearchParams(prev => ({ ...prev, category: newCategory }));
    addToast('success', `Category "${newCategory}" added to list.`);
  };

  const handleSearch = async () => {
    if (!searchParams.city || !searchParams.category) {
        addToast('error', 'Please select both City and Category');
        return;
    }

    setIsSearching(true);
    setResults([]);

    try {
      // 1. Get Real Data from Gemini
      const realEvents = await searchRealEvents(searchParams.city, searchParams.category, searchParams.keyword);
      
      // 2. Check Airtable for duplicates (Using the hardcoded key)
      if (config.airtableApiKey) {
          try {
             const checkedEvents = await checkDuplicates(config.airtableApiKey, realEvents);
             setResults(checkedEvents);
          } catch (e) {
              console.error(e);
              addToast('warning', 'Could not connect to Airtable. Showing results without duplicate check.');
              setResults(realEvents);
          }
      }
    } catch (e) {
      console.error(e);
      addToast('error', 'Failed to fetch events from Google.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAirtableAction = async (event: EventData, action: 'create' | 'update') => {
    // Key is always present now
    if (!config.airtableApiKey) {
        addToast('error', 'System Error: API Key missing.');
        return;
    }

    // Optimistic Update
    setResults(prev => prev.map(e => e.id === event.id ? { ...e, syncStatus: 'loading' } : e));
    if(modalEvent && modalEvent.id === event.id) {
        setModalEvent(prev => prev ? { ...prev, syncStatus: 'loading' } : null);
    }

    try {
        if (action === 'create') {
            const res = await createEvent(config.airtableApiKey, event);
            addToast('success', 'Event added to Airtable!');
            setSessionAddedCount(c => c + 1);
            // Update local state with real Airtable ID
             const updatedEvent = { ...event, syncStatus: 'synced' as const, airtableId: res.id, isDuplicate: true };
             
             setResults(prev => prev.map(e => e.id === event.id ? updatedEvent : e));
             if(modalEvent?.id === event.id) setModalEvent(updatedEvent);

        } else {
            await updateEvent(config.airtableApiKey, event);
            addToast('success', 'Event updated in Airtable!');
             const updatedEvent = { ...event, syncStatus: 'synced' as const };
             
             setResults(prev => prev.map(e => e.id === event.id ? updatedEvent : e));
             if(modalEvent?.id === event.id) setModalEvent(updatedEvent);
        }
    } catch (e: any) {
        addToast('error', `Airtable Error: ${e.message}`);
        setResults(prev => prev.map(e => e.id === event.id ? { ...e, syncStatus: 'error' } : e));
        if(modalEvent?.id === event.id) setModalEvent(prev => prev ? { ...prev, syncStatus: 'error' } : null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-brand-dark pb-20 font-sans selection:bg-brand-teal selection:text-white">
      
      <Header 
        isDark={config.theme === 'dark'}
        toggleTheme={() => setConfig(c => ({...c, theme: c.theme === 'light' ? 'dark' : 'light'}))}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <a 
                href="https://airtable.com/appL19ZG07Y5xCC5E/shrWkNLoDuZtZmXez" 
                target="_blank" 
                rel="noreferrer"
                className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:border-brand-teal dark:hover:border-brand-teal transition-all group cursor-pointer"
            >
                <div className="p-3 bg-brand-teal rounded-lg text-white group-hover:bg-teal-700 transition-colors">
                    <Database className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Airtable Database</p>
                    <p className="text-xl font-bold text-brand-teal flex items-center gap-2 mt-1">
                         Open Sheet <ExternalLink className="w-5 h-5" />
                    </p>
                </div>
            </a>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                 <div className="p-3 bg-brand-teal/10 rounded-lg text-brand-teal">
                    <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Added This Session</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{sessionAddedCount}</p>
                </div>
            </div>
        </div>

        <SearchPanel 
          searchParams={searchParams}
          onParamChange={(k, v) => setSearchParams(p => ({ ...p, [k]: v }))}
          onSearch={handleSearch}
          isSearching={isSearching}
          customCities={config.customCities}
          customCategories={config.customCategories}
          onAddCity={handleAddCustomCity}
          onAddCategory={handleAddCustomCategory}
        />

        <ResultsArea 
          events={results}
          onAddToAirtable={(e) => handleAirtableAction(e, 'create')}
          onUpdateAirtable={(e) => handleAirtableAction(e, 'update')}
          onOpenModal={setModalEvent}
        />
      </main>

      <EventModal 
        event={modalEvent}
        onClose={() => setModalEvent(null)}
        onAddToAirtable={(e) => handleAirtableAction(e, 'create')}
        onUpdateAirtable={(e) => handleAirtableAction(e, 'update')}
      />

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`
                pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white font-medium text-sm animate-[slideIn_0.3s_ease-out]
                ${toast.type === 'success' ? 'bg-green-600' : ''}
                ${toast.type === 'error' ? 'bg-red-600' : ''}
                ${toast.type === 'warning' ? 'bg-orange-500' : ''}
                ${toast.type === 'info' ? 'bg-blue-600' : ''}
            `}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
            {toast.type === 'error' && <XCircle className="w-5 h-5" />}
            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;