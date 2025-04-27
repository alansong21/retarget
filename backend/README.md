# Retarget Backend

Backend service for the Retarget delivery application.

## Setup

1. Create a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
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
   python3 wsgi.py
   ```

The server will run on `http://localhost:5001`.

## API Documentation

### Orders API

#### Create Order
- **Endpoint**: `POST /orders/create`
- **Description**: Create a new delivery order
- **Request Body**:
  ```json
  {
    "buyer_id": 1,
    "store_name": "Store Name",
    "item_list": [
      {
        "item": "Item Name",
        "qty": 1
      }
    ],
    "delivery_address": "Delivery Address"
  }
  ```
- **Response**: 
  ```json
  {
    "message": "Order created successfully",
    "order_id": 1,
    "status": "open"
  }
  ```
- **Status Codes**:
  - 201: Order created successfully
  - 400: Invalid request (missing fields or invalid data)

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
- `store_name`: Name of the store
- `items`: JSON array of items with quantities
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
   - Create models in `app/models.py`
   - Generate migrations: `flask db migrate -m "Description"`
   - Apply migrations: `flask db upgrade`

2. **Adding New Routes**
   - Create new blueprints in `app/routes/`
   - Register blueprints in `app/__init__.py`

3. **Configuration**
   - Environment-specific settings go in `config.py`
   - Sensitive data should use environment variables

## Environment Variables

- `FLASK_APP`: Set to `app:create_app()`
- `SECRET_KEY`: Application secret key
- `DATABASE_URL`: Database connection string (defaults to SQLite)

## Testing

(TODO: Add testing instructions)
