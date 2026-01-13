import { EventData } from '../types';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
// Initialize Gemini Client Lazily
// @ts-ignore: process.env is injected by the build/runtime environment
const getGenAI = () => {
  const key = process.env.API_KEY || process.env.GEMINI_API_KEY;
  if (!key) {
    console.warn("Gemini API Key is missing!");
    return null;
  }
  return new GoogleGenAI({ apiKey: key });
};

const isValidUrl = (str: string) => {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
};

const checkUrlReachability = async (url: string): Promise<boolean> => {
  if (!isValidUrl(url)) return false;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    // mode: 'no-cors' allows us to send the request without CORS errors blocking the execution immediately,
    // but we get an opaque response. If the network request fails (DNS, connection refused), it throws.
    // This effectively checks if the domain/server is reachable.
    await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal
    });

    clearTimeout(id);
    return true;
  } catch (e) {
    return false;
  }
};

export const searchRealEvents = async (city: string, category: string, keyword: string): Promise<EventData[]> => {
  const currentYear = new Date().getFullYear();

  const prompt = `
    Find real, upcoming professional B2B events, conferences, and summits in ${city} related to "${category}" ${keyword ? `and matching keywords "${keyword}"` : ''}.
    Focus on events happening in late ${currentYear} or 2026.
    
    Return the results as a JSON array of objects. 
    Each object must strictly have these fields:
    - name: string (The official name of the event)
    - date: string (Formatted exactly as "MM/DD/YYYY" or "MM/DD/YYYY - MM/DD/YYYY" if multi-day)
    - place: string (The venue name and city)
    - priceRange: string (Estimate price, e.g. "$500 - $1000" or "TBD")
    - website: string (The OFFICIAL event website. Do not use generic aggregators like 10times or eventbrite unless it's the only source)
    - category: string (Use the value "${category}")

    Return ONLY the raw JSON string. Do not use markdown code blocks.
    Verify that the website links provided are valid. If you are unsure of the official site, use a google search URL for the event name.
  `;

  try {
    const ai = getGenAI();
    if (!ai) {
      throw new Error("Gemini API Key is disallowed or missing. Please configure GEMINI_API_KEY in your environment variables.");
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType: 'application/json' // Removed: incompatible with googleSearch tool
      }
    });

    let text = response.text;
    if (!text) return [];

    // Clean up potential markdown formatting if the model adds it despite instructions
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    // Parse the JSON response
    let rawEvents: any[] = [];
    try {
      rawEvents = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON from Gemini:", text);
      return [];
    }

    if (!Array.isArray(rawEvents)) return [];

    // Validate and Clean Events
    const validatedEvents: EventData[] = [];

    // Process validations in parallel
    await Promise.all(rawEvents.map(async (e) => {
      // 1. Check Required Fields
      if (!e.name || !e.date || !e.place || !e.website) return;

      // 2. Syntax Check
      if (!isValidUrl(e.website)) return;

      // 3. Reachability Check (Best effort)
      const isReachable = await checkUrlReachability(e.website);
      if (!isReachable) return;

      validatedEvents.push({
        id: crypto.randomUUID(),
        name: e.name,
        website: e.website,
        date: e.date,
        place: e.place,
        priceRange: e.priceRange || 'TBD',
        category: category,
        isDuplicate: false,
        syncStatus: 'idle'
      });
    }));

    return validatedEvents;

  } catch (error) {
    console.error("Error fetching real events:", error);
    throw new Error("Failed to perform real-time search.");
  }
};