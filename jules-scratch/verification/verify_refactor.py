import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    """
    Startet einen headless Chromium-Browser, lädt die lokale Datei `index.html` und speichert einen Screenshot.
    
    Die Funktion öffnet einen Chromium-Browser über Playwright (asynchron), navigiert zur lokal ermittelten Datei `index.html` (absolute Dateipfad-URL), wartet bis der Ladevorgang den Zustand `networkidle` erreicht und schreibt einen Screenshot nach `jules-scratch/verification/verification.png`. Ressourcen werden über den async Playwright-Kontext verwaltet; auftretende Ausnahmen werden nicht abgefangen und propagiert.
    """
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Get the absolute path to the index.html file
        file_path = os.path.abspath('index.html')

        await page.goto(f'file://{file_path}')
        await page.wait_for_load_state('networkidle')
        await page.screenshot(path='jules-scratch/verification/verification.png')
        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())
