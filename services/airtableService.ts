
import { AIRTABLE_FIELDS, EventData } from '../types';

// Base ID retrieved from your shared link (appL19ZG07Y5xCC5E)
const BASE_ID = 'appL19ZG07Y5xCC5E';

// We use the Table Name directly. Ensure your tab in Airtable is named exactly "All Events".
const TABLE_NAME = 'All Events';

// We encode the table name to handle the space character properly in the URL
const API_URL = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(TABLE_NAME)}`;

// Helper to construct headers
const getHeaders = (apiKey: string) => ({
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
});

export const checkDuplicates = async (apiKey: string, events: EventData[]): Promise<EventData[]> => {
  if (!apiKey || events.length === 0) return events;

  const updatedEvents = [...events];

  await Promise.all(updatedEvents.map(async (event) => {
    try {
      // Encode field names to handle spaces or special characters safely in formula
      const formula = `OR({${AIRTABLE_FIELDS.NAME}} = "${event.name}", {${AIRTABLE_FIELDS.WEBSITE}} = "${event.website}")`;
      const url = `${API_URL}?filterByFormula=${encodeURIComponent(formula)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getHeaders(apiKey)
      });

      if (!response.ok) throw new Error('Airtable check failed');

      const data = await response.json();
      if (data.records && data.records.length > 0) {
        event.isDuplicate = true;
        event.airtableId = data.records[0].id;
      } else {
        event.isDuplicate = false;
      }
    } catch (error) {
      console.error("Error checking duplicate for", event.name, error);
      // Fail gracefully, assume not duplicate
    }
  }));

  return updatedEvents;
};

export const createEvent = async (apiKey: string, event: EventData) => {
  const fields = {
    [AIRTABLE_FIELDS.NAME]: event.name,
    [AIRTABLE_FIELDS.WEBSITE]: event.website,
    [AIRTABLE_FIELDS.DATE]: event.date,
    [AIRTABLE_FIELDS.PLACE]: event.place,
    [AIRTABLE_FIELDS.PRICE]: event.priceRange,
    [AIRTABLE_FIELDS.CATEGORY]: [event.category], // Multi-select expects array
    [AIRTABLE_FIELDS.STATUS]: "Todo"
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: getHeaders(apiKey),
    body: JSON.stringify({ 
        fields,
        typecast: true // Allows creating new Select options if they don't exist
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to create record');
  }

  return await response.json();
};

export const updateEvent = async (apiKey: string, event: EventData) => {
  if (!event.airtableId) throw new Error("Missing Airtable Record ID for update");

  const fields = {
    [AIRTABLE_FIELDS.CATEGORY]: [event.category], 
    [AIRTABLE_FIELDS.STATUS]: "Todo"
  };

  const response = await fetch(`${API_URL}/${event.airtableId}`, {
    method: 'PATCH',
    headers: getHeaders(apiKey),
    body: JSON.stringify({ 
        fields,
        typecast: true 
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Failed to update record');
  }

  return await response.json();
};
