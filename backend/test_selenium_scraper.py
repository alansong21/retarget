from app.services.selenium_scraper import (
    create_driver,
    scrape_target_product,
    scrape_ralphs_product,
    scrape_trader_joes_product
)

def main():
    url = input("Paste a product URL: ").strip()

    driver = create_driver()  # <- Start Selenium browser

    try:
        if "target.com" in url:
            result = scrape_target_product(url, driver)
        elif "ralphs.com" in url:
            result = scrape_ralphs_product(url, driver)
        elif "traderjoes.com" in url:
            result = scrape_trader_joes_product(url, driver)
        else:
            print("Unsupported retailer. Only Target, Ralph's, and Trader Joe's are supported.")
            return

        print("\nScraped Product Info:")
        for key, value in result.items():
            print(f"{key}: {value}")

    except Exception as e:
        print(f"Scraping failed: {str(e)}")

    finally:
        driver.quit()  # <- Cleanly close Selenium driver even on error

if __name__ == "__main__":
    main()
