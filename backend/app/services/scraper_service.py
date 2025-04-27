import requests
from bs4 import BeautifulSoup
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Cache-Control": "max-age=0"
}

def create_session():
    session = requests.Session()
    retry = Retry(
        total=3,
        backoff_factor=0.5,
        status_forcelist=[500, 502, 503, 504]
    )
    adapter = HTTPAdapter(max_retries=retry)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    session.headers.update(HEADERS)
    return session

def scrape_target_product(url):
    try:
        response = requests.get(url, headers=HEADERS)
        soup = BeautifulSoup(response.content, 'html.parser')

        # Scrape title
        title_meta = soup.find('meta', property='og:title')
        title = title_meta['content'].strip() if title_meta else None

        # Scrape image
        image_meta = soup.find('meta', property='og:image')
        image_url = image_meta['content'].strip() if image_meta else None

        # Try to get price
        price = None
        for script in soup.find_all('script', type='application/ld+json'):
            try:
                raw_json = script.string.strip()
                data = json.loads(raw_json)

                if isinstance(data, dict) and data.get('@type') == 'Product':
                    offers = data.get('offers')

                    # Case 1: offers is a dict
                    if isinstance(offers, dict):
                        price = offers.get('price')
                        if not price and 'priceSpecification' in offers:
                            price = offers['priceSpecification'].get('price')

                    # Case 2: offers is a list
                    elif isinstance(offers, list) and len(offers) > 0:
                        first_offer = offers[0]
                        price = first_offer.get('price')
                        if not price and 'priceSpecification' in first_offer:
                            price = first_offer['priceSpecification'].get('price')
                    
                    if price:
                        break

            except Exception:
                continue  # Ignore JSON parsing errors

        if not title or not image_url:
            raise Exception("Could not extract title or image from Target page.")

        return {
            "title": title,
            "image_url": image_url,
            "price": price if price else "N/A"
        }

    except Exception as e:
        raise Exception(f"Target scraping failed: {str(e)}")

def scrape_ralphs_product(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; ScraperBot/1.0; +http://yourdomain.com/bot)"
    }

    # Fetch page
    response = requests.get(url, headers=headers)
    response.raise_for_status()

    # Parse HTML
    soup = BeautifulSoup(response.text, 'html.parser')

    # Check if the page says "Product Unavailable"
    page_title_tag = soup.find('title')
    if page_title_tag and "Product Unavailable" in page_title_tag.text:
        raise ValueError("Product is unavailable or page not found.")

    # Scrape name
    name_meta = soup.find('meta', property='og:title')
    name = name_meta['content'].strip() if name_meta else None

    # Scrape image
    image_meta = soup.find('meta', property='og:image')
    image = image_meta['content'].strip() if image_meta else None

    # Try to scrape price from JSON-LD
    price = None
    for script in soup.find_all('script', type='application/ld+json'):
        try:
            data = json.loads(script.string)
            if isinstance(data, dict) and data.get('@type') == 'Product':
                offers = data.get('offers')
                if offers and isinstance(offers, dict):
                    price = offers.get('price')
                elif offers and isinstance(offers, list) and offers:
                    price = offers[0].get('price')
                break
        except Exception:
            continue  # Ignore JSON parsing errors

    return {
        "name": name,
        "image": image,
        "price": price if price else "Price not listed"
    }

def scrape_trader_joes_product(url):
    try:
        response = requests.get(url, headers=HEADERS)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        # Scrape title
        title_meta = soup.find('meta', property='og:title')
        title = title_meta['content'].strip() if title_meta else None

        # Scrape image
        image_meta = soup.find('meta', property='og:image')
        image_url = image_meta['content'].strip() if image_meta else None

        # Scrape price
        # Look for any <span> whose class starts with 'ProductPrice_productPrice__price'
        price = None
        price_span = soup.find('span', class_=lambda c: c and c.startswith('ProductPrice_productPrice__price'))
        if price_span:
            price = price_span.text.strip()

        if not title or not image_url:
            raise Exception("Could not extract title or image from Trader Joe's page.")

        return {
            "title": title,
            "image_url": image_url,
            "price": price if price else "Price not listed"
        }

    except Exception as e:
        raise Exception(f"Trader Joe's scraping failed: {str(e)}")