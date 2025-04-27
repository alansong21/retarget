from firebase_admin import auth as admin_auth
from app.models import db, User
from app.utils.validators import valid_signup_data

class AuthError(Exception):
    # Custom exception for authentication errors
    def __init__(self, error, status_code):
        self.error = error
        self.status_code = status_code

def create_user_profile(firebase_uid, name, email, phone_number=None, role='buyer'):
    # Create or update a user profile in our database linked to Firebase UID
    try:
        # Check if profile already exists
        existing_profile = User.query.filter_by(firebase_uid=firebase_uid).first()
        if existing_profile:
            # Update existing profile
            existing_profile.name = name
            existing_profile.email = email
            existing_profile.phone_number = phone_number
            existing_profile.role = role
            db.session.commit()
            return {"user_id": existing_profile.id, "profile": "updated"}
        
        # Create new profile
        new_user = User(
            name=name,
            email=email,
            phone_number=phone_number,
            role=role,
            email_verified=False,  # Will be updated when Firebase reports verification
            firebase_uid=firebase_uid
        )
        
        db.session.add(new_user)
        db.session.commit()
        
        return {"user_id": new_user.id, "profile": "created"}
        
    except Exception as e:
        db.session.rollback()
        raise AuthError({"code": "profile_creation_failed", "description": str(e)}, 500)

def send_verification_email(firebase_uid):
    try: 
        user = User.admin.get_user(firebase_uid)
        action_link = admin_auth.generate_email_verification_link(user.email)
        return action_link
    except Exception as e:
        raise AuthError({"code": "email_verification_failed", "description": str(e)}, 500)

def update_email_verification_status(firebase_uid, email_verified):
    # Update email verification status in our database based on Firebase status
    try:
        user = User.query.filter_by(firebase_uid=firebase_uid).first()
        if not user:
            raise AuthError({"code": "user_not_found", "description": "User not found in database"}, 404)
            
        user.email_verified = email_verified
        db.session.commit()
        
        return {"user_id": user.id, "email_verified": email_verified}
    except AuthError as e:
        raise e
    except Exception as e:
        db.session.rollback()
        raise AuthError({"code": "verification_update_failed", "description": str(e)}, 500)

def verify_token(id_token):
    # Verify Firebase ID token and return user info
    try:
        # Verify the ID token
        decoded_token = admin_auth.verify_id_token(id_token)
        
        # Get user from our database
        firebase_uid = decoded_token['uid']
        user = User.query.filter_by(firebase_uid=firebase_uid).first()
        
        if not user:
            # User exists in Firebase but not in our database
            # This could happen if Firebase auth was created but profile creation failed
            firebase_user = admin_auth.get_user(firebase_uid)
            return {
                "user_exists": False,
                "firebase_uid": firebase_uid,
                "email": firebase_user.email,
                "email_verified": firebase_user.email_verified,
                "display_name": firebase_user.display_name
            }
            
        # Update the email verification status from Firebase if needed
        firebase_user = admin_auth.get_user(firebase_uid)
        if user.email_verified != firebase_user.email_verified:
            user.email_verified = firebase_user.email_verified
            db.session.commit()
            
        return {
            "user_exists": True,
            "user_id": user.id,
            "firebase_uid": firebase_uid,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "email_verified": user.email_verified,
            "phone_number": user.phone_number
        }
        
    except admin_auth.InvalidIdTokenError:
        raise AuthError({"code": "invalid_token", "description": "Invalid ID token"}, 401)
    except Exception as e:
        raise AuthError({"code": "token_verification_failed", "description": str(e)}, 500)
        
def get_user_by_firebase_uid(firebase_uid):
    # Get user profile by Firebase UID
    try:
        # Get user from Firebase
        firebase_user = admin_auth.get_user(firebase_uid)
        
        # Get user from our database
        user = User.query.filter_by(firebase_uid=firebase_uid).first()
        
        if not user:
            return {
                "user_exists": False,
                "firebase_uid": firebase_uid,
                "email": firebase_user.email
            }
            
        return {
            "user_exists": True,
            "user_id": user.id,
            "firebase_uid": firebase_uid,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "email_verified": user.email_verified,
            "phone_number": user.phone_number
        }
        
    except Exception as e:
        raise AuthError({"code": "user_fetch_failed", "description": str(e)}, 500)

def signup_user(name, email, password, phone_number=None, role='buyer'):
    # Signup a new user and create a profile in our database
    errors = valid_signup_data(name, email, password, phone_number, role)
    if errors:
        raise ValueError(errors)
    
    user_record = admin_auth.create_user(
        email=email,
        password=password,
        display_name=name,
        phone_number=phone_number
    )
    
    new_user = User(
        name=name,
        email=email,
        phone_number=phone_number,
        role=role,
        email_verified=False,
        firebase_uid=user_record.uid
    )
    
    db.session.add(new_user)
    db.session.commit()

    action_link = send_verification_email(user_record.uid)
    
    return {
        "user_id": new_user.id,
        "firebase_uid": user_record.uid,
        "verification_link": action_link
    }
        