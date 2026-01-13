import os
import requests
import json
from typing import List, Dict, Optional

# --- Configuration ---
# Best Practice: Load secrets from environment variables
SERPER_API_KEY = os.getenv("SERPER_API_KEY", "YOUR_SERPER_API_KEY")
FIRECRAWL_API_KEY = os.getenv("FIRECRAWL_API_KEY", "fc-d1b3aa7ac4664abe94dad6abf88afb5b") # Provided in request

def search_events(query: str, limit: int = 3) -> List[str]:
    """
    Searches for events on Google using Serper.dev API.

    Args:
        query (str): The search query string.
        limit (int): Number of top results to return.

    Returns:
        List[str]: A list of URLs found.
    """
    url = "https://google.serper.dev/search"
    payload = json.dumps({
        "q": query,
        "num": limit
    })
    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
    }

    print(f"[*] Searching Google via Serper.dev for: '{query}'...")
    try:
        response = requests.request("POST", url, headers=headers, data=payload)
        response.raise_for_status() # Raise error for bad status codes
        
        data = response.json()
        organic_results = data.get("organic", [])
        
        # Extract links from organic results
        links = [result.get("link") for result in organic_results if result.get("link")]
        
        # Return only the requested amount
        return links[:limit]
        
    except requests.exceptions.RequestException as e:
        print(f"[!] Error during Google Search: {e}")
        return []

def scrape_content(url: str) -> Optional[str]:
    """
    Scrapes content from a specific URL using Firecrawl API v2.
    
    Args:
        url (str): The URL to scrape.

    Returns:
        Optional[str]: The scraped content in Markdown format, or None if failed.
    """
    api_url = 'https://api.firecrawl.dev/v2/scrape'
    headers = {
        'Authorization': f'Bearer {FIRECRAWL_API_KEY}',
        'Content-Type': 'application/json'
    }
    payload = {
        "url": url,
        "formats": ["markdown"] # Crucial for LLM consumption
    }
    
    print(f"[*] Scraping content from: {url}...")
    try:
        response = requests.post(api_url, headers=headers, json=payload)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get("success"):
            # Depending on API response structure, sometimes markdown is nested
            # V2 structure: data['data']['markdown']
            return data.get("data", {}).get("markdown", "")
        else:
            print(f"[!] Firecrawl failed for {url}: {data.get('error', 'Unknown error')}")
            return None

    except requests.exceptions.RequestException as e:
        print(f"[!] Error during scraping: {e}")
        return None

def main():
    # --- Orchestration ---
    search_query = "Tech conferences in San Francisco 2025"
    
    # 1. Search for events
    urls = search_events(search_query, limit=3)
    
    if not urls:
        print("[-] No URLs found. Exiting.")
        return

    print(f"\n[+] Found {len(urls)} URLs. Starting processing...\n")

    # 2. Process each URL
    results = {}
    
    for i, link in enumerate(urls, 1):
        print(f"--- Processing URL {i}/{len(urls)}: {link} ---")
        content = scrape_content(link)
        
        if content:
            results[link] = content[:500] + "..." # Storing snippet for display
            print(f"[V] Successfully scraped {len(content)} characters.\n")
        else:
            print("[X] Failed to scrape content.\n")

    # Summary
    print("=== Execution Summary ===")
    for link, preview in results.items():
        print(f"URL: {link}")
        print(f"Preview: {preview}\n")

if __name__ == "__main__":
    main()
