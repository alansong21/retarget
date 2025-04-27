# Retarget Backend

Backend service for the Retarget delivery application. Supports automated product scraping from Target and Trader Joe's websites.

## Setup

1. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Initialize the database:
   ```bash
   python3 create_db.py
   python3 add_test_user.py  # Adds a test user for development
   ```

4. Start the server:
   ```bash
   FLASK_APP=app:create_app flask run --port=5001
   ```

The server will run on `http://localhost:5001`.

## API Documentation

### Orders API

#### Batch Create Orders
- **Endpoint**: `POST /orders/batch_create`
- **Description**: Create multiple orders from product URLs
- **Request Body**:
  ```json
  {
    "buyer_id": 1,
    "delivery_address": "123 Test St, San Francisco, CA 94105",
    "products": [
      {
        "url": "https://www.target.com/p/product-name/-/A-12345",
        "quantity": 1
      },
      {
        "url": "https://www.traderjoes.com/home/products/pdp/product-name-12345",
        "quantity": 2
      }
    ]
  }
  ```
- **Response**: 
  ```json
  {
    "message": "Orders created successfully",
    "orders": [
      {
        "name": "Product Name",
        "price": "$19.99",
        "quantity": 1,
        "store": "Target",
        "url": "https://www.target.com/p/product-name/-/A-12345"
      }
    ]
  }
  ```
- **Status Codes**:
  - 201: Orders created successfully
  - 400: Invalid request
  - 500: Server error (e.g., scraping failed)

#### Get Available Orders
- **Endpoint**: `GET /orders/available`
- **Description**: Get all open orders that haven't expired
- **Response**:
  ```json
  [
    {
      "order_id": 1,
      "store_name": "Store Name",
      "items": [
        {
          "item": "Item Name",
          "qty": 1
        }
      ],
      "delivery_address": "Delivery Address",
      "expiry_time": "2025-04-27T01:55:46.784714+00:00"
    }
  ]
  ```
- **Status Codes**:
  - 200: Success
  - 500: Server error

#### Accept Order
- **Endpoint**: `POST /orders/accept/<order_id>`
- **Description**: Accept an open order as a carrier
- **URL Parameters**:
  - order_id: ID of the order to accept
- **Request Body**:
  ```json
  {
    "carrier_id": 2
  }
  ```
- **Response**:
  ```json
  {
    "message": "Order accepted successfully",
    "order_id": 1,
    "assigned_carrier_id": 2
  }
  ```
- **Status Codes**:
  - 200: Order accepted successfully
  - 400: Order already assigned or expired
  - 404: Order not found

### Order Status Flow

Orders follow this status flow:
1. `open`: Initial state when order is created
2. `assigned`: Order has been accepted by a carrier
3. `in_progress`: Carrier has started the delivery
4. `ready_for_pickup`: Items are ready for pickup
5. `completed`: Order has been delivered
6. `cancelled`: Order was cancelled
7. `expired`: Order wasn't accepted within the expiry time

### Data Models

#### Order
- `id`: Primary key
- `buyer_id`: ID of the user who created the order
- `store_name`: Name of store (Target or Trader Joe's)
- `items`: JSON array of items with quantities, prices, and URLs
- `delivery_address`: Delivery destination
- `status`: Current order status
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp
- `assigned_carrier_id`: ID of assigned carrier (if any)
- `expiry_time`: When the order expires if not accepted

#### OrderAssignment
- `id`: Primary key
- `order_id`: ID of the assigned order
- `carrier_id`: ID of the carrier
- `status`: Assignment status
- `accepted_at`: When the carrier accepted
- `completed_at`: When the order was completed

A Flask-based backend service for the Retarget application, which handles order management and delivery services.

## Testing Instructions

### Prerequisites
- Server running on port 5001 (`python3 wsgi.py`)
- Database initialized with test user (`python3 create_db.py && python3 add_test_user.py`)

### Testing

Use the provided test script to create orders:

```bash
python3 test_batch_orders.py
```

The script provides several test cases:
1. Target product only
2. Trader Joe's product only
3. Both products
4. Custom product URLs

To view orders:
```bash
python3 check_orders.py
```

3. **Accept an Order** (replace `<order_id>` with actual ID)
   ```bash
   curl -X POST http://localhost:5001/orders/accept/<order_id> \
   -H "Content-Type: application/json" \
   -d '{
     "carrier_id": 2
   }'
   ```

4. **Update Order Status** (by carrier)
   ```bash
   # Start delivery
   curl -X POST http://localhost:5001/orders/update_status/<order_id> \
   -H "Content-Type: application/json" \
   -d '{
     "carrier_id": 2,
     "new_status": "in_progress"
   }'

   # Mark ready for pickup
   curl -X POST http://localhost:5001/orders/update_status/<order_id> \
   -H "Content-Type: application/json" \
   -d '{
     "carrier_id": 2,
     "new_status": "ready_for_pickup"
   }'
   ```

5. **Confirm Delivery** (by buyer)
   ```bash
   curl -X POST http://localhost:5001/orders/confirm_delivery/<order_id> \
   -H "Content-Type: application/json" \
   -d '{
     "buyer_id": 1
   }'
   ```

### Expected Status Codes
- 201: Order created successfully
- 200: Request successful
- 400: Bad request (invalid data or state)
- 403: Forbidden (wrong user)
- 404: Resource not found
- 500: Server error

### Utility Scripts
- `check_orders.py`: View all orders and their current status
- `add_test_user.py`: Add a test user with ID 1

### Common Issues

1. **Port Already in Use**
   - The server runs on port 5001 to avoid conflicts with AirPlay
   - If port 5001 is in use, try a different port:
     ```bash
     FLASK_APP=app:create_app flask run --port=5002
     ```
   - Update the port in `test_batch_orders.py` to match

2. **Database Errors**
   - If you get schema errors:
     ```bash
     rm app.db
     python3 create_db.py
     python3 add_test_user.py
     ```

3. **Scraping Issues**
   - Some products may fail to scrape due to website changes
   - Check that the product URLs are valid and accessible
   - Only Target and Trader Joe's URLs are supported

## Project Structure
```
backend/
├── app/                    # Application package
│   ├── __init__.py        # App factory and configuration
│   ├── models.py          # Database models
│   └── routes/            # API route blueprints
├── migrations/            # Database migrations
├── instance/             # Instance-specific files
├── requirements.txt      # Project dependencies
├── config.py            # Configuration settings
└── .flaskenv            # Flask environment variables
```

## Setup and Installation

1. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Initialize the database:
   ```bash
   flask db upgrade
   ```

4. Run the development server:
   ```bash
   flask run
   ```

## Database Models

### User
- Represents both buyers and carriers in the system
- Role-based access control ('buyer' or 'carrier')
- Manages user authentication and profile information

### Order
- Represents delivery orders created by buyers
- Tracks order status, items, locations, and fees
- Links buyers and assigned carriers

### OrderAssignment
- Manages the relationship between orders and carriers
- Tracks assignment status and completion times

## API Endpoints

The API is organized using Flask Blueprints:

- `/orders` - Order management endpoints (create, update, list orders)

## Development Guidelines

1. **Database Changes**
   - Models are defined in `app/models.py`
   - For schema changes:
     ```bash
     flask db migrate -m "Description"
     flask db upgrade
     ```

2. **Adding New Routes**
   - Create blueprints in `app/routes/`
   - Register in `app/__init__.py`

3. **Scraper Development**
   - Scraper logic in `app/services/selenium_scraper.py`
   - Uses Selenium in headless mode
   - Supports Target and Trader Joe's websites

## Environment Variables

- `FLASK_APP=app:create_app`
- `FLASK_DEBUG=1` (optional, for development)
