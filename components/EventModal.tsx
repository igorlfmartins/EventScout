import React from 'react';
import { EventData } from '../types';
import { X, Calendar, MapPin, DollarSign, Globe, Layers } from 'lucide-react';

interface EventModalProps {
  event: EventData | null;
  onClose: () => void;
  onAddToAirtable: (event: EventData) => void;
  onUpdateAirtable: (event: EventData) => void;
}

export const EventModal: React.FC<EventModalProps> = ({ event, onClose, onAddToAirtable, onUpdateAirtable }) => {
  if (!event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-[fadeIn_0.2s_ease-out]">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-[scaleIn_0.2s_ease-out]">
        <div className="relative h-32 bg-brand-teal flex items-center justify-center">
            <h2 className="text-3xl font-black text-white/20 uppercase tracking-widest">{event.category}</h2>
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-1 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
        
        <div className="p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{event.name}</h2>
            
            <div className="space-y-4 mb-8">
                <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Date</p>
                        <p className="text-gray-900 dark:text-gray-200">{event.date}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Location</p>
                        <p className="text-gray-900 dark:text-gray-200">{event.place}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <DollarSign className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Price Range</p>
                        <p className="text-gray-900 dark:text-gray-200">{event.priceRange}</p>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Globe className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Website</p>
                        <a href={event.website} target="_blank" rel="noreferrer" className="text-brand-teal hover:underline break-all">
                            {event.website}
                        </a>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Layers className="w-5 h-5 text-brand-teal shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-semibold">Airtable Status</p>
                         {event.isDuplicate ? (
                            <span className="text-red-600 dark:text-red-400 font-medium">Existing Record (Duplicate)</span>
                        ) : (
                            <span className="text-green-600 dark:text-green-400 font-medium">New Opportunity</span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button 
                    onClick={onClose}
                    className="py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    Close
                </button>
                {event.syncStatus !== 'synced' && (
                     <button 
                        onClick={() => {
                            if(event.isDuplicate) onUpdateAirtable(event);
                            else onAddToAirtable(event);
                        }}
                        disabled={event.syncStatus === 'loading'}
                        className={`py-3 px-4 rounded-xl text-white font-semibold shadow-lg transition-transform active:scale-95 ${
                            event.isDuplicate ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20' : 'bg-brand-teal hover:bg-teal-700 shadow-teal-500/20'
                        }`}
                    >
                        {event.syncStatus === 'loading' ? 'Processing...' : event.isDuplicate ? 'Update Record' : 'Add Record'}
                    </button>
                )}
                 {event.syncStatus === 'synced' && (
                     <button disabled className="py-3 px-4 rounded-xl bg-green-600 text-white font-semibold cursor-default">
                        Saved to Airtable
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
