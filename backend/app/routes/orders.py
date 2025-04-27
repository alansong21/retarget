from flask import Blueprint, request, jsonify
from app.models import db, Order
from datetime import datetime, timedelta, timezone
import json

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/create', methods=['POST'])
def create_order():
    data = request.get_json()

    try:
        buyer_id = data['buyer_id']
        store_name = data['store_name']
        item_list_json = data['item_list_json']
        delivery_location = data['delivery_location']
        service_fee = data['service_fee']
        carrier_reward = data['carrier_reward']
        expiry_time = data['expiry_time']

        new_order = Order(
            buyer_id=buyer_id,
            store_name=store_name,
            item_list_json=item_list_json,
            delivery_location=delivery_location,
            service_fee=service_fee,
            carrier_reward=carrier_reward,
            expiry_time=expiry_time
        )

        db.session.add(new_order)
        db.session.commit()

        return jsonify({
            "message": "Order created successfully",
            "order_id": new_order.id
        }), 201

    except KeyError as e:
        return jsonify({"error": f"Missing required field: {str(e)}"}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500