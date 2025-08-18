import asyncio
from playwright.async_api import async_playwright, expect
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        file_path = os.path.abspath('index.html')
        # Use wait_until='networkidle' to ensure all external scripts are loaded
        await page.goto(f'file://{file_path}', wait_until='networkidle')

        add_task_button = page.locator("#open-task-modal")
        await expect(add_task_button).to_be_visible()
        await add_task_button.click()

        modal = page.locator("#task-modal")
        await expect(modal).to_be_visible(timeout=5000)

        await page.screenshot(path="jules-scratch/verification/verification.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
