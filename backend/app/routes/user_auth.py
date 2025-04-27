from flask import Blueprint, request, jsonify, g
from app.services.auth_service import (
    create_user_profile, 
    send_verification_email, 
    update_email_verification_status,
    verify_token,
    get_user_by_firebase_uid,
    signup_user,
    AuthError
)
from functools import wraps

# Create auth blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Middleware for token verification
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if auth_header:
            if 'Bearer ' in auth_header:
                token = auth_header.split('Bearer ')[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            # Verify token and attach user data to request context
            user_data = verify_token(token)
            g.user = user_data
            
            # Check if user exists in the database
            if not user_data.get('user_exists', False):
                return jsonify({'message': 'User profile not found. Please complete registration.'}), 403
                
            # Check if email is verified for sensitive operations
            if not user_data.get('email_verified', False):
                return jsonify({'message': 'Email not verified. Please verify your email.'}), 403
            
            return f(*args, **kwargs)
        except AuthError as e:
            return jsonify(e.error), e.status_code
        
    return decorated

# Route for user signup
@auth_bp.route('/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        
        # Extract required fields
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        phone_number = data.get('phone_number')
        role = data.get('role', 'buyer')
        
        # Create user in Firebase and our database
        result = signup_user(name, email, password, phone_number, role)
        
        return jsonify({
            'message': 'User registered successfully',
            'user_id': result.get('user_id'),
            'firebase_uid': result.get('firebase_uid'),
            'verification_email_sent': True
        }), 201
        
    except ValueError as e:
        return jsonify({'message': 'Validation error', 'errors': e.args[0]}), 400
    except AuthError as e:
        return jsonify(e.error), e.status_code
    except Exception as e:
        return jsonify({'message': f'Registration failed: {str(e)}'}), 500

# Route for creating/updating user profile
@auth_bp.route('/profile', methods=['POST'])
def create_profile():
    try:
        # Verify Firebase token first
        token = request.headers.get('Authorization', '').split('Bearer ')[-1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
            
        # Get user info from token
        firebase_user = verify_token(token)
        firebase_uid = firebase_user.get('firebase_uid')
        
        # Get profile data from request
        data = request.json
        name = data.get('name')
        email = data.get('email')
        phone_number = data.get('phone_number')
        role = data.get('role', 'buyer')
        
        # Create or update user profile
        result = create_user_profile(
            firebase_uid=firebase_uid,
            name=name,
            email=email,
            phone_number=phone_number,
            role=role
        )
        
        return jsonify({
            'message': f'Profile {result.get("profile")} successfully',
            'user_id': result.get('user_id')
        }), 200
        
    except AuthError as e:
        return jsonify(e.error), e.status_code
    except Exception as e:
        return jsonify({'message': f'Profile creation failed: {str(e)}'}), 500

# Route to send verification email
@auth_bp.route('/send-verification', methods=['POST'])
def send_verification():
    try:
        # Get Firebase UID from request or token
        data = request.json
        firebase_uid = data.get('firebase_uid')
        
        if not firebase_uid:
            token = request.headers.get('Authorization', '').split('Bearer ')[-1]
            if token:
                user_data = verify_token(token)
                firebase_uid = user_data.get('firebase_uid')
        
        if not firebase_uid:
            return jsonify({'message': 'Firebase UID required'}), 400
            
        # Send verification email
        verification_link = send_verification_email(firebase_uid)
        
        return jsonify({
            'message': 'Verification email sent',
            'verification_link': verification_link
        }), 200
        
    except AuthError as e:
        return jsonify(e.error), e.status_code
    except Exception as e:
        return jsonify({'message': f'Failed to send verification email: {str(e)}'}), 500

# Route to update email verification status
@auth_bp.route('/update-verification', methods=['POST'])
def update_verification():
    try:
        data = request.json
        firebase_uid = data.get('firebase_uid')
        email_verified = data.get('email_verified', False)
        
        if not firebase_uid:
            return jsonify({'message': 'Firebase UID required'}), 400
            
        result = update_email_verification_status(firebase_uid, email_verified)
        
        return jsonify({
            'message': 'Verification status updated',
            'user_id': result.get('user_id'),
            'email_verified': result.get('email_verified')
        }), 200
        
    except AuthError as e:
        return jsonify(e.error), e.status_code
    except Exception as e:
        return jsonify({'message': f'Failed to update verification status: {str(e)}'}), 500

# Route to get user profile
@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    # User data is attached to g.user by the token_required decorator
    return jsonify(g.user), 200

# Route to check if token is valid
@auth_bp.route('/verify-token', methods=['POST'])
def validate_token():
    try:
        token = request.json.get('token')
        
        if not token:
            return jsonify({'valid': False, 'message': 'Token is missing'}), 400
            
        user_data = verify_token(token)
        
        return jsonify({
            'valid': True,
            'user': user_data
        }), 200
        
    except AuthError as e:
        return jsonify({'valid': False, 'message': e.error.get('description')}), 401
    except Exception as e:
        return jsonify({'valid': False, 'message': str(e)}), 500
