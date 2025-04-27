"""Flask application factory and configuration.

This module initializes the Flask application and its extensions.
It sets up the database, migrations, and registers all blueprints.
"""

from flask import Flask
from app.models import db
from flask_migrate import Migrate

def create_app():
    """Create and configure the Flask application.
    
    This factory function creates a new Flask application instance,
    loads the configuration, initializes extensions, and registers
    all blueprints.
    
    Returns:
        Flask: The configured Flask application instance.
    """
    app = Flask(__name__)
    app.config.from_object('config.Config')

    db.init_app(app)
    migrate = Migrate(app, db)

    # Import routes
    from app.routes.orders import orders_bp
    app.register_blueprint(orders_bp, url_prefix='/orders')

    return app