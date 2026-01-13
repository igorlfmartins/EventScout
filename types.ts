
export interface AirtableFieldConfig {
  name: string;
  website: string;
  date: string;
  place: string;
  price: string;
  category: string;
  status: string;
}

// Updated to use Column Names matching typical Airtable templates
// This is more robust than using 'fld...' IDs which change if you recreate fields.
export const AIRTABLE_FIELDS = {
  NAME: 'Name',
  WEBSITE: 'Website',
  DATE: 'Date',
  PLACE: 'Location', // Maps internal 'place' to Airtable column 'Location'
  PRICE: 'Price',
  CATEGORY: 'Category',
  STATUS: 'Status',
};

export interface EventData {
  id: string; // Internal ID for the app (can be mock ID or Airtable ID)
  airtableId?: string; // If it exists in Airtable
  name: string;
  website: string;
  date: string;
  place: string;
  priceRange: string;
  category: string;
  isDuplicate: boolean;
  syncStatus: 'idle' | 'synced' | 'error' | 'loading';
}

export interface AppConfig {
  airtableApiKey: string;
  customCities: string[];
  customCategories: string[];
  theme: 'light' | 'dark';
}

export interface SearchParams {
  city: string;
  category: string;
  keyword: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}
