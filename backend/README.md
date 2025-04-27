# Retarget Backend

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
