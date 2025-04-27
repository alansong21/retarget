from flask import Blueprint, request, jsonify
from app.models import db, Order

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/create', methods=['POST'])
def create_order():
    data = request.get_json()

    # Later: validate fields property
    new_order = Order(
        buyer_id=data['buyer_id'],
        store_name=data['store_name'],
        item_list_json=data['item_list_json'],
        delivery_location=data['delivery_location'],
        service_fee=data['service_fee'],
        carrier_reward=data['carrier_reward'],
        expiry_time=data['expiry_time']
    )

    db.session.add(new_order)
    db.session.commit()

    return jsonify({'message': 'Order created successfully'}), 201