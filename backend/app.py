from flask import Flask, jsonify, request
from flask_cors import CORS
from app.routes.user_auth import auth_bp
from app.models import db
from app.config import Config
from app.firebase_config import initialize_firebase

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

# Configure app with settings from config.py
app.config.from_object(Config)

# Initialize database
db.init_app(app)

# Initialize Firebase Admin SDK
initialize_firebase()

# Register auth blueprint
app.register_blueprint(auth_bp)

# Sample data for orders
orders = [
    {"id": 1, "item": "Milk", "quantity": 2},
    {"id": 2, "item": "Eggs", "quantity": 1},
    {"id": 3, "item": "Bread", "quantity": 1},
]

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({"message": "Hello, World!"})

@app.route('/api/orders', methods=['GET'])
def get_orders():
    return jsonify(orders)

@app.route('/api/orders', methods=['POST'])
def create_order():
    new_order = request.json
    orders.append(new_order)
    return jsonify(new_order), 201

if __name__ == '__main__':
    app.run(debug=True, port=5001)
