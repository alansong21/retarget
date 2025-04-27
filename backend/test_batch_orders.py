"""# Test script for batch creating orders
#
# This script demonstrates the order creation flow with authentication:
# 1. Logs in with test user credentials
# 2. Gets a session cookie from login response
# 3. Uses the session cookie for subsequent order creation requests
#
# Prerequisites:
# - Server running on port 5001
# - Database initialized with test user (email: test@example.com, password: password123)
#
# Usage:
#   python3 test_batch_orders.py
#
# The script will prompt for which test case to run and handle authentication automatically."""

import requests
from pprint import pprint

def login_user(email="test@example.com", password="password123"):
    try:
        # First try to register
        register_data = {
            'email': email,
            'password': password,
            'role': 'buyer',
            'display_name': 'Test User'
        }
        
        response = requests.post('http://localhost:5001/auth/register', json=register_data)
        if response.status_code != 201:
            # If registration fails, try to login
            login_data = {
                'email': email,
                'password': password
            }
            response = requests.post('http://localhost:5001/auth/login', json=login_data)
            if response.status_code != 200:
                print(f"Login failed: {response.json().get('error')}")
                return None
        
        # Get the session cookie
        return response.cookies.get('session')
    except Exception as e:
        print(f"Error during authentication: {str(e)}")
        return None

def test_batch_create(products):
    # API endpoint
    url = 'http://localhost:5001/orders/batch_create'
    
    # Login and get session cookie
    session = login_user()
    if not session:
        print("Failed to authenticate")
        return
    
    # Create request payload
    payload = {
        'products': products,
        'delivery_address': '123 Test St, Los Angeles, CA 90012'
    }

    try:
        # Make the request
        print("\nSending request to create batch orders...")
        headers = {'Content-Type': 'application/json'}
        cookies = {'session': session}
        response = requests.post(url, json=payload, headers=headers, cookies=cookies)
        
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
