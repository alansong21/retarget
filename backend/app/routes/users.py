from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User

users_bp = Blueprint('users', __name__)

@users_bp.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    
    if not data or 'email' not in data or 'firebase_uid' not in data:
        return jsonify({'error': 'Missing required fields'}), 400
    
    try:
        user = User(
            email=data['email'],
            firebase_uid=data['firebase_uid']
        )
        db.session.add(user)
        db.session.commit()
        
        return jsonify(user.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
