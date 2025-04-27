import firebase_admin
from firebase_admin import credentials, firestore, auth
from app.config import Config

# Firebase objects
db = None
admin_auth = None

def initialize_firebase():
    """Initialize Firebase Admin SDK and clients"""
    global db, admin_auth
    
    # Initialize Firebase Admin with credentials
    cred = credentials.Certificate(Config.FIREBASE_CREDENTIALS_PATH)
    firebase_admin.initialize_app(cred)
    
    # Set up clients
    db = firestore.client()
    admin_auth = auth
    
    print("Firebase initialized successfully")
    return True