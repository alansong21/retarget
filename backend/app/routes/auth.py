from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from app.models import db, User
from app.utils.validators import is_valid_email, is_valid_role

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate input
    if not all(k in data for k in ['email', 'password', 'role']):
        return jsonify({'error': 'Missing required fields'}), 400
    
    email = data['email']
    password = data['password']
    role = data['role']
    display_name = data.get('display_name')
    
    # Validate email and role
    if not is_valid_email(email):
        return jsonify({'error': 'Invalid email format'}), 400
    if not is_valid_role(role):
        return jsonify({'error': 'Invalid role. Must be either "buyer" or "carrier"'}), 400
    
    # Check if user already exists
    existing_user = User.query.filter_by(email=email).first()
    if existing_user:
        return jsonify({'error': 'Email already registered'}), 400
    
    # Create user
    user = User(
        email=email,
        role=role,
        display_name=display_name
    )
    user.set_password(password)
    
    try:
        db.session.add(user)
        db.session.commit()
        login_user(user)
        return jsonify({
            'message': 'User registered successfully',
            'user': {
                'id': user.id,
                'email': user.email,
                'role': user.role,
                'display_name': user.display_name
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to create user'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not all(k in data for k in ['email', 'password']):
        return jsonify({'error': 'Missing email or password'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    login_user(user)
    return jsonify({
        'message': 'Logged in successfully',
        'user': {
            'id': user.id,
            'email': user.email,
            'role': user.role,
            'display_name': user.display_name
        }
    })

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'})

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user():
    return jsonify({
        'user': {
            'id': current_user.id,
            'email': current_user.email,
            'role': current_user.role,
            'display_name': current_user.display_name
        }
    })
