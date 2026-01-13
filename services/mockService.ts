import { EventData } from '../types';
import { GoogleGenAI } from "@google/genai";

// Helpers
// @ts-ignore: injected by Vite
const SERPER_API_KEY = process.env.VITE_SERPER_API_KEY;
// @ts-ignore: injected by Vite
const FIRECRAWL_API_KEY = process.env.VITE_FIRECRAWL_API_KEY;

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

const searchGoogle = async (query: string, limit = 4): Promise<string[]> => {
  if (!SERPER_API_KEY) {
    console.warn("Serper API Key missing. Skipping real search.");
    return [];
  }

  try {
    const response = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: query, num: limit }),
    });

    if (!response.ok) throw new Error("Serper API failed");

    const data = await response.json();
    return data.organic?.map((r: any) => r.link).filter((l: string) => l) || [];
  } catch (e) {
    console.error("Serper Error:", e);
    return [];
  }
};

const scrapeWithFirecrawl = async (url: string): Promise<string | null> => {
  if (!FIRECRAWL_API_KEY) return null;

  try {
    const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        formats: ["markdown"]
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.success ? data.data?.markdown : null;
  } catch (e) {
    console.error("Firecrawl Error:", e);
    return null;
  }
};

export const searchRealEvents = async (city: string, category: string, keyword: string): Promise<EventData[]> => {
  const currentYear = new Date().getFullYear();
  const searchQuery = `Top B2B ${category} conferences events in ${city} ${currentYear} 2026 ${keyword || ''} official website`;

  console.log(`[Pipeline] 1. Searching Google for: "${searchQuery}"`);
  const links = await searchGoogle(searchQuery);

  if (links.length === 0) {
    console.warn("[Pipeline] No links found. Falling back to simple generation.");
    // Fallback to pure generation if search fails completely
    return generateFallbackEvents(city, category, keyword);
  }

  console.log(`[Pipeline] 2. Found ${links.length} links. Scraping content...`);

  // Scrape top 3 links to avoid hitting rate limits too hard
  const scrapedContents = await Promise.all(
    links.slice(0, 3).map(async (link) => {
      const content = await scrapeWithFirecrawl(link);
      return content ? `SOURCE URL: ${link}\nCONTENT:\n${content.substring(0, 8000)}\n---` : null;
    })
  );

  const context = scrapedContents.filter(c => c).join("\n\n");

  if (!context) {
    return generateFallbackEvents(city, category, keyword);
  }

  console.log(`[Pipeline] 3. Extracting events with Gemini...`);

  const prompt = `
    You are an expert event data extractor. 
    Analyze the following scraped content from search results and extract a list of REAL, CONFIRMED B2B events happening in ${city} related to "${category}".
    
    SCRAPED CONTENT:
    ${context}

    INSTRUCTIONS:
    - Only include events that are explicitly mentioned in the text with a confirmed date and location.
    - IGNORE generic aggregators or lists of "Top 10 events" unless you can extract specific details for a single event.
    - STRICTLY use the "SOURCE URL" provided in the text as the website. Do NOT make up URLs.
    - Return a JSON array.

    JSON SCHEMA:
    - name: string
    - date: string (e.g. "October 15-17, 2025")
    - place: string
    - priceRange: string (or "TBD")
    - website: string (The SOURCE URL provided above)
    - category: string ("${category}")

    Return ONLY raw JSON.
  `;

  try {
    const ai = getGenAI();
    if (!ai) throw new Error("Gemini Client not initialized");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' }
    });

    const text = response.text?.replace(/```json/g, '').replace(/```/g, '').trim() || '[]';
    const rawEvents = JSON.parse(text);

    return rawEvents.map((e: any) => ({
      id: crypto.randomUUID(),
      name: e.name,
      website: e.website,
      date: e.date,
      place: e.place,
      priceRange: e.priceRange || 'TBD',
      category: category,
      isDuplicate: false,
      syncStatus: 'idle'
    }));

  } catch (error) {
    console.error("[Pipeline] Extraction failed:", error);
    return [];
  }
};

// Fallback logic (Old method, simplified)
const generateFallbackEvents = async (city: string, category: string, keyword: string): Promise<EventData[]> => {
  // Return empty to encourage user to check API keys
  // or implement a very basic generation if desired, but robustness is preferred.
  return [];
};