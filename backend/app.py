from flask import Flask, jsonify, request
from flask_cors import CORS
from stripe_utils import create_stripe_account, get_stripe_account, create_payment_intent, transfer_to_carrier
from functools import wraps

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

def auth_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No authorization token provided'}), 401
        
        token = auth_header.split(' ')[1]
        # TODO: Verify Firebase token
        # For now, we'll just pass through
        
        return f(*args, **kwargs)
    return decorated

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

@app.route('/stripe/account/create', methods=['POST'])
@auth_required
def create_account():
    try:
        # TODO: Get user email from Firebase token
        email = 'test@example.com'  # Placeholder
        
        result = create_stripe_account(email)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/stripe/account', methods=['GET'])
@auth_required
def get_account():
    try:
        # TODO: Get account_id from user's database record
        # For now, return error if no account exists
        return jsonify({'error': 'No account found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/stripe/transfer', methods=['POST'])
@auth_required
def create_transfer():
    try:
        data = request.json
        amount = data.get('amount')
        account_id = data.get('account_id')
        
        if not amount or not account_id:
            return jsonify({'error': 'Missing required fields'}), 400
            
        result = transfer_to_carrier(amount, account_id)
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
