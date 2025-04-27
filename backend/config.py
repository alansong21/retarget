"""Configuration settings for the Flask application.

This module defines the configuration settings for different environments
(development, testing, production). It uses environment variables when available
and falls back to default values when needed.
"""

import os

class Config:
    """Base configuration class.
    
    This class contains all the configuration settings for the application.
    Sensitive values should be loaded from environment variables in production.
    
    Attributes:
        SECRET_KEY (str): Secret key for session management and security
        SQLALCHEMY_DATABASE_URI (str): Database connection string
        SQLALCHEMY_TRACK_MODIFICATIONS (bool): Disable SQLAlchemy modification tracking
    """
    # Security
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev_secret_key'
    SECRET_KEY_FOR_FLASK_LOGIN = os.environ.get('SECRET_KEY_FOR_FLASK_LOGIN') or 'dev_secret_key_for_flask_login'
    WTF_CSRF_ENABLED = False  # Disable CSRF protection for API
    
    # Database
    basedir = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or f'sqlite:///{os.path.join(basedir, "app.db")}'  # Using the same path as create_db.py
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Debug
    DEBUG = True