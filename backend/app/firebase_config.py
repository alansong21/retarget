import firebase_admin
from firebase_admin import credentials, firestore, auth
from config import Config

# Initialize Firebase Admin
cred = credentials.Certificate(Config.FIREBASE_CREDENTIALS_PATH)
firebase_admin.initialize_app(cred)

db = firestore.client()
firebase_auth = auth