"""Test script for batch order creation endpoint."""

import requests
from pprint import pprint

def test_batch_create(products):
    # API endpoint
    url = 'http://localhost:5001/orders/batch_create'
    
    # Test payload
    payload = {
        "buyer_id": 1,  # Make sure this user exists in your database
        "delivery_address": "123 Test St, San Francisco, CA 94105",
        "products": products
    }

    try:
        # Make the request
        print("\nSending request to create batch orders...")
        headers = {'Content-Type': 'application/json'}
        response = requests.post(url, json=payload, headers=headers)
        
        # Print response details
        print(f"\nStatus Code: {response.status_code}\n")
        print("Response:")
        try:
            pprint(response.json())
        except:
            print(response.text)

    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server. Make sure your Flask app is running.")
    except Exception as e:
        print(f"Error: {str(e)}")

def main():
    print("Choose a test case:")
    print("1. Target Baby Oil")
    print("2. Trader Joe's Spicy Salt")
    print("3. Both products")
    print("4. Custom URLs")
    
    choice = input("\nEnter your choice (1-4): ")
    
    test_cases = {
        "1": [{
            "url": "https://www.target.com/p/baby-oil-aloe-vitamin-e-20oz-up-38-up-8482/-/A-11312702#lnk=sametab",
            "quantity": 1
        }],
        "2": [{
            "url": "https://www.traderjoes.com/home/products/pdp/spicy-pink-salt-with-crushed-red-chili-pepper-076362",
            "quantity": 2
        }],
        "3": [{
            "url": "https://www.target.com/p/baby-oil-aloe-vitamin-e-20oz-up-38-up-8482/-/A-11312702#lnk=sametab",
            "quantity": 1
        }, {
            "url": "https://www.traderjoes.com/home/products/pdp/spicy-pink-salt-with-crushed-red-chili-pepper-076362",
            "quantity": 2
        }]
    }
    
    if choice in ["1", "2", "3"]:
        test_batch_create(test_cases[choice])
    elif choice == "4":
        products = []
        while True:
            url = input("\nEnter product URL (or press Enter to finish): ")
            if not url:
                break
            quantity = int(input("Enter quantity: "))
            products.append({"url": url, "quantity": quantity})
        
        if products:
            test_batch_create(products)
        else:
            print("No products entered.")
    else:
        print("Invalid choice.")

if __name__ == "__main__":
    main()
