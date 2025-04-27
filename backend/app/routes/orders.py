from flask import Blueprint, request, jsonify
from app.models import db, Order
from datetime import datetime, timedelta, timezone
import json

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/test', methods=['GET'])
def test_route():
    return jsonify({"message": "Orders blueprint is working"}), 200

@orders_bp.route('/create', methods=['POST'])
def create_order():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400

        # Validate required fields
        required_fields = ['buyer_id', 'store_name', 'item_list', 'delivery_address']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400

        # Create new order with default expiry time of 1 hour
        new_order = Order(
            buyer_id=data['buyer_id'],
            store_name=data['store_name'],
            items=data['item_list'],  # This will be stored as JSON
            delivery_address=data['delivery_address'],
            status='open',
            expiry_time=datetime.now(timezone.utc) + timedelta(hours=1)
        )

        db.session.add(new_order)
        db.session.commit()

        return jsonify({
            "message": "Order created successfully",
            "order_id": new_order.id,
            "status": new_order.status
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400