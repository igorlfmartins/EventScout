import React, { useState } from 'react';
import { EventData } from '../types';
import { ExternalLink, Plus, RefreshCw, AlertCircle, CheckCircle2, Calendar, MapPin, Tag, Layers, Loader2 } from 'lucide-react';

interface ResultsAreaProps {
  events: EventData[];
  onAddToAirtable: (event: EventData) => void;
  onUpdateAirtable: (event: EventData) => void;
  onOpenModal: (event: EventData) => void;
}

export const ResultsArea: React.FC<ResultsAreaProps> = ({ events, onAddToAirtable, onUpdateAirtable, onOpenModal }) => {
  const [isAddingAll, setIsAddingAll] = useState(false);

  if (events.length === 0) return null;

  // Filter for events that are candidates for "Add All" (Not duplicates, not already synced)
  const unsavedEvents = events.filter(e => !e.isDuplicate && e.syncStatus !== 'synced');
  const hasUnsavedEvents = unsavedEvents.length > 0;

  const handleAddAll = async () => {
    if (!hasUnsavedEvents) return;
    
    setIsAddingAll(true);
    
    // Process sequentially to be gentle on the UI and API rate limits
    for (const event of unsavedEvents) {
        onAddToAirtable(event);
        // Small artificial delay to prevent UI freezing and ensure state updates flow smoothly
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setIsAddingAll(false);
  };

  return (
    <div className="animate-[fadeIn_0.5s_ease-out]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Found {events.length} results
            </h3>

            {hasUnsavedEvents && (
                <button
                    onClick={handleAddAll}
                    disabled={isAddingAll}
                    className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm shadow-md transition-all
                        ${isAddingAll 
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400' 
                            : 'bg-brand-teal text-white hover:bg-teal-700 active:scale-95'
                        }
                    `}
                >
                    {isAddingAll ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Adding events...
                        </>
                    ) : (
                        <>
                            <Layers className="w-4 h-4" />
                            Add All {unsavedEvents.length} Events to Airtable
                        </>
                    )}
                </button>
            )}
        </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800">
          <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
            <tr>
              <th className="px-6 py-4">Event Name</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {events.map((event) => (
              <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900 dark:text-white mb-1">{event.name}</div>
                  <a href={event.website} target="_blank" rel="noreferrer" className="text-brand-teal hover:underline flex items-center gap-1 text-xs">
                    {new URL(event.website).hostname} <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{event.date}</td>
                <td className="px-6 py-4">{event.place}</td>
                <td className="px-6 py-4">
                  {event.isDuplicate ? (
                     <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                        <AlertCircle className="w-3 h-3" /> Duplicate
                     </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <Tag className="w-3 h-3" /> New
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                        onClick={() => onOpenModal(event)}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
                    >
                        Details
                    </button>
                    {event.syncStatus === 'synced' ? (
                       <button disabled className="px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded-md flex items-center gap-1 opacity-80 cursor-default">
                           <CheckCircle2 className="w-3 h-3" /> Done
                       </button>
                    ) : (
                        <button
                        onClick={() => event.isDuplicate ? onUpdateAirtable(event) : onAddToAirtable(event)}
                        disabled={event.syncStatus === 'loading' || isAddingAll}
                        className={`px-3 py-1.5 text-xs font-medium text-white rounded-md flex items-center gap-1 shadow-sm transition-all ${
                            event.isDuplicate 
                                ? 'bg-orange-500 hover:bg-orange-600' 
                                : 'bg-brand-teal hover:bg-teal-700'
                        } ${event.syncStatus === 'loading' || isAddingAll ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                        {event.syncStatus === 'loading' ? (
                            <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        ) : event.isDuplicate ? (
                            <><RefreshCw className="w-3 h-3" /> Update</>
                        ) : (
                            <><Plus className="w-3 h-3" /> Add</>
                        )}
                        </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {events.map((event) => (
          <div key={event.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-bold text-gray-900 dark:text-white text-lg">{event.name}</h4>
                <a href={event.website} target="_blank" rel="noreferrer" className="text-brand-teal text-sm flex items-center gap-1 mt-1">
                    {new URL(event.website).hostname} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              {event.isDuplicate ? (
                  <span className="text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2 py-1 rounded">Duplicate</span>
              ) : (
                  <span className="text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded">New</span>
              )}
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" /> {event.date}
                </div>
                <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" /> {event.place}
                </div>
                <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-400" /> {event.category}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => onOpenModal(event)}
                    className="flex justify-center items-center py-2 px-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium text-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                    Details
                </button>
                {event.syncStatus === 'synced' ? (
                     <button disabled className="flex justify-center items-center py-2 px-4 rounded-lg bg-green-600 text-white font-medium text-sm">
                        <CheckCircle2 className="w-4 h-4 mr-1" /> Added
                    </button>
                ) : (
                    <button 
                        onClick={() => event.isDuplicate ? onUpdateAirtable(event) : onAddToAirtable(event)}
                        disabled={event.syncStatus === 'loading' || isAddingAll}
                        className={`flex justify-center items-center py-2 px-4 rounded-lg text-white font-medium text-sm shadow-md ${
                            event.isDuplicate ? 'bg-orange-500 hover:bg-orange-600' : 'bg-brand-teal hover:bg-teal-700'
                        } ${event.syncStatus === 'loading' || isAddingAll ? 'opacity-70' : ''}`}
                    >
                         {event.syncStatus === 'loading' ? 'Processing...' : event.isDuplicate ? 'Update Airtable' : 'Add to Airtable'}
                    </button>
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};