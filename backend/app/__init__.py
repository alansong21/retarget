"""Flask application factory and configuration.

This module initializes the Flask application and its extensions.
It sets up the database, migrations, and registers all blueprints.
"""

from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_login import LoginManager
from config import Config
from werkzeug.exceptions import HTTPException

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()

def create_app(config_class=Config):
    """Create and configure the Flask application.
    
    This factory function creates a new Flask application instance,
    configures it, and registers all necessary extensions and blueprints.
    
    Returns:
        Flask: The configured Flask application instance.
    """
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)
    
    # Setup Flask-Login
    login_manager.init_app(app)
    login_manager.login_view = 'auth.login'
    
    @login_manager.user_loader
    def load_user(user_id):
        from app.models import User
        return User.query.get(int(user_id))

    # Error handler for all HTTP exceptions
    @app.errorhandler(HTTPException)
    def handle_exception(e):
        return jsonify({
            "code": e.code,
            "name": e.name,
            "description": e.description,
        }), e.code

    # Import routes
    from app.routes.orders import orders_bp
    from app.routes.auth import auth_bp
    from app.routes.scraper import scraper_bp
    from app.routes.products import products_bp
    
    # Register blueprints
    app.register_blueprint(orders_bp, url_prefix='/orders')
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(scraper_bp, url_prefix='/scrape')
    app.register_blueprint(products_bp, url_prefix='/products')
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    return app