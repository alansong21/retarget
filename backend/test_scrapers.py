from app.services.selenium_scraper import (
    scrape_target_product,
    scrape_ralphs_product,
    scrape_trader_joes_product
)

def main():
    url = input("Paste a product URL: ").strip()

    try:
        if "target.com" in url:
            result = scrape_target_product(url)
        elif "ralphs.com" in url:
            result = scrape_ralphs_product(url)
        elif "traderjoes.com" in url:
            result = scrape_trader_joes_product(url)
        else:
            print("Unsupported retailer. Only Target, Ralph's, and Trader Joe's are supported.")
            return

        print("\nScraped Product Info:")
        for key, value in result.items():
            print(f"{key}: {value}")

    except Exception as e:
        print(f"Scraping failed: {str(e)}")

if __name__ == "__main__":
    main()