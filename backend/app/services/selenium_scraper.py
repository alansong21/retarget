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

def scrape_ralphs_product(url, driver):
    print("Loading Ralph's page...")
    driver.get(url)
    time.sleep(5)  # Initial wait
    
    # Execute JavaScript to modify navigator.webdriver
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    # Wait for page to be ready
    try:
        WebDriverWait(driver, 10).until(
            lambda d: d.execute_script('return document.readyState') == 'complete'
        )
        print("Page loaded completely")
    except Exception as e:
        print(f"Page load timeout: {str(e)}")

    # Try to handle location selection
    try:
        # Check if we need to select a location
        if 'select-store' in driver.page_source.lower():
            print("Location selection needed")
            # Try to find and click the location selector button
            location_button = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-qa="location-search-button"]'))
            )
            driver.execute_script("arguments[0].click();", location_button)
            time.sleep(2)

            # Enter zip code
            zip_input = WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, '[data-qa="zipcode-input"]'))
            )
            zip_input.clear()
            zip_input.send_keys('90017')  # Los Angeles zip code
            zip_input.send_keys(Keys.RETURN)
            time.sleep(3)

            # Select the first store
            store_button = WebDriverWait(driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-qa="select-store"]'))
            )
            driver.execute_script("arguments[0].click();", store_button)
            time.sleep(5)  # Wait for page to refresh
            
            print("Location selected successfully")
        else:
            print("No location selection needed")

    except Exception as e:
        print(f"Location selection failed: {str(e)}")
        # Continue anyway as we might already have a location set

    print("Scraping product details...")
    # Wait for product details to load and retry if needed
    max_retries = 3
    for attempt in range(max_retries):
        try:
            # Wait for any of these elements to appear
            WebDriverWait(driver, 10).until(lambda d: any([
                d.find_elements(By.CSS_SELECTOR, '[data-qa="product-title"]'),
                d.find_elements(By.CSS_SELECTOR, '[data-qa="product-details-name"]'),
                d.find_elements(By.CSS_SELECTOR, '.ProductDetails-header')
            ]))
            print("Product details found")
            break
        except Exception as e:
            print(f"Attempt {attempt + 1}: Waiting for product details: {str(e)}")
            if attempt < max_retries - 1:
                time.sleep(3)
                driver.refresh()
            else:
                print("Failed to load product details after all retries")

    # Get the page source after it's loaded
    page_source = driver.page_source
    soup = BeautifulSoup(page_source, 'html.parser')

    # Get product title - try multiple selectors
    name = None
    title_selectors = [
        ('h1', {'data-qa': 'product-title'}),
        ('h1', {'data-qa': 'product-details-name'}),
        ('h1', {'class': 'ProductDetails-header'}),
        ('div', {'class': 'ProductDetails-name'})
    ]

    for tag, attrs in title_selectors:
        elem = soup.find(tag, attrs=attrs)
        if elem:
            name = elem.text.strip()
            print(f"Found title using selector: {tag}, {attrs}")
            break

    if not name:
        name_meta = soup.find('meta', property='og:title')
        if name_meta:
            name = name_meta['content'].strip()
            print("Found title in meta tags")

    # Get product image - try multiple selectors
    image = None
    image_selectors = [
        ('img', {'data-qa': 'product-image'}),
        ('img', {'data-qa': 'product-details-image'}),
        ('img', {'class': 'ProductDetails-image'})
    ]

    for tag, attrs in image_selectors:
        elem = soup.find(tag, attrs=attrs)
        if elem and 'src' in elem.attrs:
            image = elem['src']
            print(f"Found image using selector: {tag}, {attrs}")
            break

    if not image:
        image_meta = soup.find('meta', property='og:image')
        if image_meta:
            image = image_meta['content'].strip()
            print("Found image in meta tags")

    # Get price - try multiple methods
    price = None
    price_selectors = [
        '[data-qa="cart-page-item-price"]',
        '[data-qa="product-details-price"]',
        '[data-qa="product-price"]',
        '.kds-Price',
        '.ProductDetails-price',
        'span[class*="Price"]'
    ]

    # Try Selenium first
    for selector in price_selectors:
        try:
            price_elem = WebDriverWait(driver, 2).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, selector))
            )
            if price_elem:
                price = price_elem.text.strip()
                print(f"Found price using selector: {selector}")
                break
        except Exception:
            continue

    # If no price found, try BeautifulSoup
    if not price:
        for selector in price_selectors:
            try:
                price_elem = soup.select_one(selector)
                if price_elem:
                    price = price_elem.text.strip()
                    print(f"Found price using BeautifulSoup selector: {selector}")
                    break
            except Exception:
                continue

    # Try JavaScript as last resort
    if not price:
        try:
            for selector in price_selectors:
                price = driver.execute_script(
                    f'return document.querySelector("{selector}")?.textContent'
                )
                if price:
                    price = price.strip()
                    print(f"Found price using JavaScript selector: {selector}")
                    break
        except Exception as e:
            print(f"JavaScript price extraction failed: {str(e)}")

    print("\nDebug Info:")
    print(f"Title found: {name}")
    print(f"Image found: {image}")
    print(f"Price found: {price}")
    print(f"Page title: {driver.title}")
    print(f"Current URL: {driver.current_url}")

    return {
        "name": name,
        "image_url": image,
        "price": price if price else "Price not listed"
    }

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
        # Ralphs Example
        ralphs_url = "https://www.ralphs.com/p/fresh-large-lemon-each/0000000004053?fulfillment=PICKUP"
        print("Ralphs:")
        print(scrape_ralphs_product(ralphs_url, driver))

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
