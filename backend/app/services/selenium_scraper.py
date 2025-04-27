from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.keys import Keys
from bs4 import BeautifulSoup
import json
import time
import os

def create_driver():
    chrome_options = Options()
    chrome_options.add_argument('--headless=new')  # New headless mode
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')  # Disable automation flag
    chrome_options.add_argument('--window-size=1920,1080')
    
    # More realistic user agent
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    # Additional settings to make us look more like a real browser
    chrome_options.add_argument('--disable-extensions')
    chrome_options.add_argument('--enable-automation')  # Ironically, enabling this makes us look more real
    chrome_options.add_argument('--disable-infobars')
    
    # Add some preferences
    chrome_options.add_experimental_option('excludeSwitches', ['enable-automation'])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    prefs = {
        'profile.default_content_setting_values.notifications': 2,  # Block notifications
        'credentials_enable_service': False,  # Disable password manager
        'profile.password_manager_enabled': False
    }
    chrome_options.add_experimental_option('prefs', prefs)
    
    # Create a new ChromeDriver service
    service = Service()
    
    try:
        driver = webdriver.Chrome(service=service, options=chrome_options)
        return driver
    except Exception as e:
        print(f"Failed to create Chrome driver: {str(e)}")
        raise

def scrape_target_product(url, driver):
    try:
        print("Loading page...")
        driver.get(url)
        
        # Wait for page to load
        time.sleep(3)  # Give JavaScript time to execute
        print("Page loaded, starting to scrape...")

        # Wait for product details to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-test="product-title"]'))
        )
        
        # Try multiple price selectors
        price_selectors = [
            '[data-test="product-price"]',
            'span[data-test="product-price"]',
            'div[data-test="product-price"]',
            'span.h-text-bs',  # Common price class
            '.style-price'
        ]
        
        price = None
        for selector in price_selectors:
            try:
                price_element = WebDriverWait(driver, 2).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, selector))
                )
                price = price_element.text.strip()
                if price:
                    print(f"Found price using selector: {selector}")
                    break
            except Exception as e:
                print(f"Selector {selector} failed: {str(e)}")
                continue

        # If still no price, try JavaScript approach
        if not price:
            try:
                price = driver.execute_script(
                    'return document.querySelector("[data-test=\'product-price\']").textContent'
                )
                if price:
                    print("Found price using JavaScript")
            except Exception as e:
                print(f"JavaScript price extraction failed: {str(e)}")

        soup = BeautifulSoup(driver.page_source, 'html.parser')

        # Scrape title
        name = None
        try:
            title_element = driver.find_element(By.CSS_SELECTOR, '[data-test="product-title"]')
            if title_element:
                name = title_element.text.strip()
        except Exception:
            name_meta = soup.find('meta', property='og:title')
            name = name_meta['content'].strip() if name_meta else None

        # Scrape image
        image_meta = soup.find('meta', property='og:image')
        image = image_meta['content'].strip() if image_meta else None

        # Print debug info
        print("\nDebug Info:")
        print(f"Price found: {price}")
        print(f"Page title: {driver.title}")
        print(f"Current URL: {driver.current_url}")

        return {
            "name": name,
            "image_url": image,
            "price": price if price else "Price not listed"
        }

    except Exception as e:
        print(f"Scraping failed: {str(e)}")
        return {
            "name": None,
            "image_url": None,
            "price": "Error: Failed to scrape product"}

    return {
        "name": name,
        "image_url": image,
        "price": price if price else "Price not listed"
    }


def scrape_trader_joes_product(url, driver):
    driver.get(url)
    time.sleep(2)  # Trader Joe's is lighter

    soup = BeautifulSoup(driver.page_source, 'html.parser')

    name_meta = soup.find('meta', property='og:title')
    name = name_meta['content'].strip() if name_meta else None

    image_meta = soup.find('meta', property='og:image')
    image = image_meta['content'].strip() if image_meta else None

    # Trader Joe's price is not reliably exposed
    price_span = soup.find('span', class_=lambda c: c and c.startswith('ProductPrice_productPrice__price'))
    price = price_span.text.strip() if price_span else "Price not listed"

    return {
        "name": name,
        "image_url": image,
        "price": price
    }

# Example usage
if __name__ == "__main__":
    driver = create_driver()

    try:
        # Target Example
        target_url = "https://www.target.com/p/dove-beauty-white-moisturizing-beauty-bar-soap/-/A-84780837?preselect=11012602#lnk=sametab"
        print("\nTarget:")
        print(scrape_target_product(target_url, driver))

        # Trader Joe's Example
        trader_joes_url = "https://www.traderjoes.com/home/products/pdp/spicy-pink-salt-with-crushed-red-chili-pepper-076362"
        print("\nTrader Joe's:")
        print(scrape_trader_joes_product(trader_joes_url, driver))

    finally:
        driver.quit()
